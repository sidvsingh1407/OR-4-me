# TarkaX V1 Quality Test Harness

This folder contains a minimal, runnable test harness designed to answer one specific question: **"Are the leads this pipeline produces good enough to contact?"**

## Prerequisites

1. **Python 3.11+**: Ensure you have Python installed.
2. **API Keys**:
   - Google Gemini API Key (`GEMINI_API_KEY`)
   - GitHub Personal Access Token (`GITHUB_TOKEN`)
   - (Optional) Supabase URL and Key (`SUPABASE_URL`, `SUPABASE_KEY`)

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   # Edit .env with your favorite text editor
   ```

3. **(Optional) Supabase Schema:**
   If you are testing the Supabase write functionality, run the SQL commands in `schema.sql` inside your Supabase SQL Editor to create the `leads` table. If you omit Supabase credentials, the harness will safely fall back to writing purely to local CSVs.

## How to Run

### Step 1: Run the Pipeline

Run the pipeline using the `run.py` script. The `--limit` argument controls the maximum number of leads that will be enriched via the Gemini AI (default is 30).

```bash
python run.py --limit 30
```

This command will:
1. Ask Gemini to generate specific search queries regarding AI adoption struggles.
2. Search Hacker News and GitHub Issues for these terms.
3. Deduplicate the findings.
4. Send the unique results to Gemini to extract structured business intelligence.
5. Score the leads out of 100 based on TarkaX's deterministic scoring engine.
6. Save the results to `leads.csv` (and Supabase if configured).
7. Generate a `review_YYYYMMDD_HHMM.csv` file for manual human review.

### Step 2: Human Review

Open the generated `review_YYYYMMDD_HHMM.csv` file in Excel, Google Sheets, or your preferred CSV editor.

For each lead, fill in the `human_usable` column with:
- `y` (Yes, this is a good lead)
- `n` (No, this is a bad lead)

You can optionally add notes in the `human_notes` column.

### Step 3: Summarize Results

Once you have filled out the `human_usable` column, run the `summarize.py` script, pointing it to your review file:

```bash
python summarize.py review_20231027_1430.csv
```

This will print out a statistical summary of the leads, showing the overall usable rate, rates broken down by source (GitHub vs. Hacker News), and by pain category.

## Testing

To run the automated unit tests with mocked responses:

```bash
pytest test_pipeline.py
```
