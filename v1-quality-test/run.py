import os
import sys
import time
import json
import hashlib
import logging
import argparse
import difflib
from datetime import datetime, timezone
import csv
from typing import List, Dict, Any, Optional

import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from supabase import create_client, Client
from pydantic import BaseModel, Field, ValidationError

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [%(name)s] %(message)s')
logger = logging.getLogger('Pipeline')

# Load env
load_dotenv()

# Constants
SIMILARITY_THRESHOLD = 0.85
MAX_RAW_MULTIPLIER = 3
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

class EnrichedLeadSchema(BaseModel):
    company_name: Optional[str] = Field(None, description="Company name, null if not explicitly stated.")
    evidence_quote: Optional[str] = Field(None, description="A short verbatim snippet from the source showing the pain; null if none.")
    pain_category: Optional[str] = Field(None, description="Category of the pain (e.g., 'Implementation Failure', 'Cost Overrun', 'Compliance Risk', 'Shadow AI').")
    pain_severity: Optional[int] = Field(None, ge=1, le=10, description="Severity of the pain 1-10.")
    urgency: Optional[int] = Field(None, ge=1, le=10, description="Urgency 1-10.")
    decision_maker_title: Optional[str] = Field(None, description="Title of the decision maker, null if unknown.")
    recommended_outreach_angle: Optional[str] = Field(None, description="Recommended angle for outreach.")
    confidence: Optional[str] = Field(None, description="'low', 'medium', or 'high'.")
    confidence_reason: Optional[str] = Field(None, description="One line reason for confidence.")

def normalize_title(title: str) -> str:
    if not title: return ""
    return ''.join(c.lower() for c in title if c.isalnum() or c.isspace()).strip()

def hash_url(url: str) -> str:
    # Normalize url (simple strip and lower for consistency)
    normalized = url.strip().lower()
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def is_duplicate_title(new_title: str, existing_titles: List[str]) -> bool:
    norm_new = normalize_title(new_title)
    if not norm_new:
        return False
    for ext in existing_titles:
        if difflib.SequenceMatcher(None, norm_new, ext).ratio() >= SIMILARITY_THRESHOLD:
            return True
    return False

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY is missing. Please set it in .env")
        sys.exit(1)
    return genai.Client(api_key=api_key)

def get_supabase_client() -> Optional[Client]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if url and key:
        return create_client(url, key)
    return None

def generate_search_queries(client: genai.Client) -> List[str]:
    logger.info("Step 1: Generating search queries via Gemini.")
    prompt = """
    Generate exactly 10 search queries designed to find developers or engineering leaders
    complaining about or struggling with AI adoption, LLM integration, AI governance,
    vector database costs, or AI project ROI.

    The queries should be suitable for searching GitHub Issues and Hacker News.
    Examples:
    - "LLM timeout error"
    - "vector database cost too high"
    - "prompt injection vulnerability"
    - "shadow AI risk"
    - "hallucination in production"

    Return ONLY a valid JSON array of strings. No markdown formatting, no explanations.
    """

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
        )
        text = response.text.strip()
        queries = json.loads(text)
        if not isinstance(queries, list):
             raise ValueError("Expected a JSON array of strings.")
        logger.info(f"Generated {len(queries)} queries.")
        return queries[:10]
    except Exception as e:
        logger.error(f"Failed to generate queries: {e}")
        # Fallback queries if Gemini fails
        return [
            "AI integration failed", "LLM timeout", "vector database cost",
            "prompt injection", "hallucination in production", "shadow AI",
            "AI governance issue", "RAG poor results", "OpenAI API limit",
            "Copilot bad suggestions"
        ]

def search_github_issues(query: str, limit: int) -> List[Dict[str, Any]]:
    results = []
    headers = {"Accept": "application/vnd.github.v3+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"

    url = f"https://api.github.com/search/issues?q={query}+type:issue&per_page=10"

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        for item in items:
             results.append({
                 "source": "GitHub",
                 "evidence_url": item.get("html_url"),
                 "title": item.get("title", ""),
                 "body": (item.get("body") or "")[:2000],
                 "author": item.get("user", {}).get("login", ""),
                 "created_at": item.get("created_at")
             })
             if len(results) >= limit:
                 break
    except Exception as e:
        logger.warning(f"GitHub search failed for '{query}': {e}")
    time.sleep(2) # Backoff
    return results

def search_hackernews(query: str, limit: int) -> List[Dict[str, Any]]:
    results = []
    url = f"http://hn.algolia.com/api/v1/search?query={query}&tags=story&hitsPerPage=10"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        hits = data.get("hits", [])
        for hit in hits:
             results.append({
                 "source": "HackerNews",
                 "evidence_url": hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                 "title": hit.get("title", ""),
                 "body": (hit.get("story_text") or "")[:2000],
                 "author": hit.get("author", ""),
                 "created_at": hit.get("created_at")
             })
             if len(results) >= limit:
                 break
    except Exception as e:
        logger.warning(f"HackerNews search failed for '{query}': {e}")
    time.sleep(1) # Backoff
    return results

def collect_raw_leads(queries: List[str], max_raw: int) -> List[Dict[str, Any]]:
    logger.info("Step 2: Collecting raw leads.")
    raw_leads = []

    # Try to fetch evenly across queries and sources
    limit_per_query_source = max(1, max_raw // (len(queries) * 2))

    for q in queries:
        if len(raw_leads) >= max_raw:
             break

        gh_results = search_github_issues(q, limit_per_query_source)
        raw_leads.extend(gh_results)

        if len(raw_leads) >= max_raw:
             break

        hn_results = search_hackernews(q, limit_per_query_source)
        raw_leads.extend(hn_results)

    logger.info(f"Collected {len(raw_leads)} raw items.")
    return raw_leads[:max_raw]

def dedupe_leads(raw_leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    logger.info("Step 3: Deduping leads.")
    deduped = []
    seen_hashes = set()
    existing_norm_titles = []

    for lead in raw_leads:
        url_hash = hash_url(lead["evidence_url"])
        if url_hash in seen_hashes:
            continue

        title = lead.get("title", "")
        if is_duplicate_title(title, existing_norm_titles):
            continue

        seen_hashes.add(url_hash)
        if title:
             existing_norm_titles.append(normalize_title(title))

        lead["dedupe_hash"] = url_hash
        deduped.append(lead)

    logger.info(f"Deduped down to {len(deduped)} items.")
    return deduped

def enrich_lead(client: genai.Client, lead: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    prompt = f"""
    Extract structured business intelligence from the following raw crawler text.
    Return ONLY valid JSON according to the schema. Do not include markdown formatting.
    Do NOT infer company website, budget, revenue, or maturity. If a field is not supported by the text, return null.

    Schema structure required:
    {{
      "company_name": "string or null",
      "evidence_quote": "string or null",
      "pain_category": "string or null",
      "pain_severity": number (1-10) or null,
      "urgency": number (1-10) or null,
      "decision_maker_title": "string or null",
      "recommended_outreach_angle": "string or null",
      "confidence": "low", "medium", or "high",
      "confidence_reason": "string or null"
    }}

    Raw Text:
    Title: {lead.get('title', '')}
    Body: {lead.get('body', '')}
    """
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )

        text = response.text.strip()
        parsed = json.loads(text)

        # Validate against Pydantic schema
        validated = EnrichedLeadSchema(**parsed)
        return validated.model_dump()

    except ValidationError as ve:
        logger.error(f"Schema validation failed for lead {lead.get('evidence_url')}: {ve}")
        return None
    except Exception as e:
        logger.error(f"Enrichment failed for lead {lead.get('evidence_url')}: {e}")
        return None

# Scoring Dictionaries ported from Config.gs
SCORING_SIGNALS = {
    "PAIN": [
        {"term": 'Shadow AI', "score": 20},
        {"term": 'AI governance', "score": 18},
        {"term": 'prompt inconsistency', "score": 15},
        {"term": 'hallucination complaints', "score": 15},
        {"term": 'automation failures', "score": 15},
        {"term": 'model drift', "score": 12},
        {"term": 'ROI concerns', "score": 20},
        {"term": 'manual processes', "score": 10}
    ],
    "GROWTH": [
        {"term": 'employee growth', "score": 10},
        {"term": 'hiring velocity', "score": 15},
        {"term": 'department expansion', "score": 10},
        {"term": 'AI team growth', "score": 20},
        {"term": 'engineering expansion', "score": 15}
    ]
}

def calculate_score(lead: Dict[str, Any]) -> Dict[str, Any]:
    score = 0
    breakdown = {"Pain": 0, "Growth": 0}

    text_to_scan = f"{lead.get('title', '')} {lead.get('body', '')} {lead.get('pain_category', '')}".lower()

    # Evaluate Pain
    for item in SCORING_SIGNALS["PAIN"]:
        if item["term"].lower() in text_to_scan:
            breakdown["Pain"] += item["score"]
            score += item["score"]

    # Evaluate Growth
    for item in SCORING_SIGNALS["GROWTH"]:
        if item["term"].lower() in text_to_scan:
            breakdown["Growth"] += item["score"]
            score += item["score"]

    # Base weight application (Simplified from ScoringEngine.gs: Pain 0.35, Growth 0.15)
    # Since we dropped hiring/tech/funding/exec to keep minimal plain text scan,
    # we'll just sum and cap.

    # Bonus from explicit fields
    if lead.get("pain_severity"):
         score += lead["pain_severity"] * 2
    if lead.get("urgency"):
         score += lead["urgency"] * 2

    final_score = min(score, 100)

    return {
        "score": final_score,
        "score_breakdown": breakdown
    }

def save_to_csv(filepath: str, leads: List[Dict[str, Any]], is_review: bool = False):
    if not leads:
        return

    file_exists = os.path.exists(filepath)

    fieldnames = [
        "id", "source", "evidence_url", "title", "body", "author", "created_at",
        "dedupe_hash", "company_name", "evidence_quote", "pain_category",
        "pain_severity", "urgency", "decision_maker_title",
        "recommended_outreach_angle", "confidence", "confidence_reason",
        "score", "score_breakdown", "raw_gemini_json", "status", "run_id", "processed_at"
    ]

    if is_review:
        fieldnames = ["human_usable", "human_notes"] + fieldnames

    with open(filepath, 'w' if is_review else 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        if not file_exists or is_review:
            writer.writeheader()

        for lead in leads:
            row = lead.copy()
            # serialize json fields
            row["score_breakdown"] = json.dumps(row.get("score_breakdown", {}))
            row["raw_gemini_json"] = json.dumps(row.get("raw_gemini_json", {}))
            if is_review:
                row["human_usable"] = ""
                row["human_notes"] = ""
            writer.writerow(row)

def main():
    parser = argparse.ArgumentParser(description="TarkaX Lead Quality Test Harness")
    parser.add_argument("--limit", type=int, default=30, help="Max items to enrich")
    args = parser.parse_args()

    run_id = f"run_{int(time.time())}"
    stats = {
        "collected": 0,
        "deduped": 0,
        "enriched": 0,
        "failed": 0,
        "stored": 0
    }

    gemini_client = get_gemini_client()
    supabase = get_supabase_client()

    queries = generate_search_queries(gemini_client)

    max_raw = args.limit * MAX_RAW_MULTIPLIER
    raw_leads = collect_raw_leads(queries, max_raw)
    stats["collected"] = len(raw_leads)

    deduped_leads = dedupe_leads(raw_leads)
    stats["deduped"] = len(deduped_leads)

    final_leads = []

    logger.info("Step 4 & 5: Enriching and Scoring leads.")
    for lead in deduped_leads[:args.limit]:
        enriched_data = enrich_lead(gemini_client, lead)
        if enriched_data:
            lead.update(enriched_data)
            lead["raw_gemini_json"] = enriched_data

            # Step 5: Score
            score_data = calculate_score(lead)
            lead.update(score_data)

            lead["run_id"] = run_id
            lead["processed_at"] = datetime.now(timezone.utc).isoformat()
            lead["status"] = "new"

            final_leads.append(lead)
            stats["enriched"] += 1
            logger.info(f"Enriched lead from {lead.get('source')} - Score: {lead.get('score')}")
            time.sleep(3) # API rate limit safety
        else:
            stats["failed"] += 1

    # Step 6: Store
    logger.info("Step 6: Storing leads.")
    if final_leads:
        if supabase:
            try:
                # Prepare for supabase insert
                insert_data = []
                for fl in final_leads:
                     copy_fl = fl.copy()
                     # Let postgres handle auto-increment ID if not present
                     if "id" in copy_fl:
                         del copy_fl["id"]
                     insert_data.append(copy_fl)

                resp = supabase.table("leads").upsert(insert_data, on_conflict="dedupe_hash").execute()
                logger.info("Successfully wrote to Supabase.")
            except Exception as e:
                logger.error(f"Failed to write to Supabase: {e}")

        # Always fallback to CSV
        save_to_csv("leads.csv", final_leads)
        stats["stored"] = len(final_leads)

    # Step 7: Review file
    logger.info("Step 7: Generating review file.")
    if final_leads:
        # Sort by score desc
        final_leads.sort(key=lambda x: x.get("score", 0), reverse=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        review_filename = f"review_{timestamp}.csv"
        save_to_csv(review_filename, final_leads, is_review=True)
        logger.info(f"Generated {review_filename} for human review.")

    logger.info(f"Run completed. Stats: {stats}")

if __name__ == "__main__":
    main()
