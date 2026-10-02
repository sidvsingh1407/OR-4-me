import pytest
import os
import json
from unittest.mock import patch, MagicMock

# Import functions from run.py
from run import (
    dedupe_leads,
    enrich_lead,
    calculate_score,
    save_to_csv,
    hash_url
)

def test_dedupe_leads():
    raw = [
        {"evidence_url": "http://example.com/1", "title": "Help with Shadow AI"},
        {"evidence_url": "http://example.com/1", "title": "Duplicate URL"},  # exact URL dupe
        {"evidence_url": "http://example.com/2", "title": "Help with Shadow AI"}, # exact title dupe
        {"evidence_url": "http://example.com/3", "title": "Help with shadow ai!!"}, # near title dupe
        {"evidence_url": "http://example.com/4", "title": "A completely different issue about vector DBs"}
    ]

    deduped = dedupe_leads(raw)

    # Expecting 1st and last to survive
    assert len(deduped) == 2
    assert deduped[0]["evidence_url"] == "http://example.com/1"
    assert deduped[1]["evidence_url"] == "http://example.com/4"

@patch('run.genai.Client')
def test_enrich_lead_success(MockClient):
    mock_client = MockClient.return_value

    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "company_name": "Tech Corp",
        "evidence_quote": "We are struggling with AI governance",
        "pain_category": "Shadow AI",
        "pain_severity": 8,
        "urgency": 9,
        "decision_maker_title": "CTO",
        "recommended_outreach_angle": "Focus on governance",
        "confidence": "high",
        "confidence_reason": "Clear evidence in text"
    })

    mock_client.models.generate_content.return_value = mock_response

    lead = {"title": "Help", "body": "We need help"}
    enriched = enrich_lead(mock_client, lead)

    assert enriched is not None
    assert enriched["company_name"] == "Tech Corp"
    assert enriched["pain_severity"] == 8

@patch('run.genai.Client')
def test_enrich_lead_validation_failure(MockClient):
    mock_client = MockClient.return_value

    # Missing required field type matching or out of bounds (e.g. string for severity)
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "company_name": "Tech Corp",
        "pain_severity": "very high" # Should be int
    })

    mock_client.models.generate_content.return_value = mock_response

    lead = {"title": "Help", "body": "We need help"}
    enriched = enrich_lead(mock_client, lead)

    assert enriched is None  # Should return None on validation error

def test_calculate_score():
    lead = {
        "title": "We have shadow AI issues",
        "body": "It is causing ROI concerns and we need a prompt engineer. We are experiencing employee growth.",
        "pain_category": "Shadow AI",
        "pain_severity": 8, # Bonus: 16
        "urgency": 10 # Bonus: 20
    }

    # Matches from text:
    # "shadow ai" (Pain: 20)
    # "roi concerns" (Pain: 20)
    # "employee growth" (Growth: 10)

    res = calculate_score(lead)

    # 20 + 20 + 10 + 16 + 20 = 86
    assert res["score_breakdown"]["Pain"] == 40
    assert res["score_breakdown"]["Growth"] == 10
    assert res["score"] == 86

def test_calculate_score_cap():
    lead = {
        "title": "Shadow AI, AI governance, prompt inconsistency, hallucination complaints, automation failures",
        "pain_severity": 10,
        "urgency": 10
    }
    res = calculate_score(lead)
    assert res["score"] == 100  # Should cap at 100

def test_save_to_csv(tmp_path):
    csv_file = tmp_path / "test_leads.csv"
    leads = [
        {"id": 1, "source": "HN", "title": "Test 1", "score_breakdown": {"Pain": 10}},
        {"id": 2, "source": "GH", "title": "Test 2", "score_breakdown": {"Growth": 20}}
    ]

    save_to_csv(str(csv_file), leads, is_review=False)

    assert csv_file.exists()

    with open(csv_file, 'r') as f:
        content = f.read()
        assert "Test 1" in content
        assert "Test 2" in content
        assert "human_usable" not in content

def test_save_to_csv_review(tmp_path):
    csv_file = tmp_path / "test_review.csv"
    leads = [
        {"id": 1, "source": "HN", "title": "Test 1", "score_breakdown": {"Pain": 10}}
    ]

    save_to_csv(str(csv_file), leads, is_review=True)

    assert csv_file.exists()

    with open(csv_file, 'r') as f:
        content = f.read()
        assert "human_usable,human_notes" in content


@patch('run.requests.get')
def test_search_github_issues_mocked(mock_get):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "items": [
            {
                "html_url": "http://github.com/issue/1",
                "title": "GitHub test title",
                "body": "GitHub test body",
                "user": {"login": "testuser"},
                "created_at": "2023-01-01"
            }
        ]
    }
    mock_resp.raise_for_status.return_value = None
    mock_get.return_value = mock_resp

    from run import search_github_issues
    res = search_github_issues("test query", limit=5)

    assert len(res) == 1
    assert res[0]["source"] == "GitHub"
    assert res[0]["evidence_url"] == "http://github.com/issue/1"

@patch('run.requests.get')
def test_search_hackernews_mocked(mock_get):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "hits": [
            {
                "url": "http://hn.com/item/1",
                "title": "HN test title",
                "story_text": "HN test body",
                "author": "hnuser",
                "created_at": "2023-01-01"
            }
        ]
    }
    mock_resp.raise_for_status.return_value = None
    mock_get.return_value = mock_resp

    from run import search_hackernews
    res = search_hackernews("test query", limit=5)

    assert len(res) == 1
    assert res[0]["source"] == "HackerNews"
    assert res[0]["evidence_url"] == "http://hn.com/item/1"
