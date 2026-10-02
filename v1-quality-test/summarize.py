import csv
import argparse
import sys
from collections import defaultdict

def summarize(filepath: str):
    total_reviewed = 0
    usable_count = 0
    source_stats = defaultdict(lambda: {"total": 0, "usable": 0})
    pain_stats = defaultdict(lambda: {"total": 0, "usable": 0})
    company_name_count = 0

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            if 'human_usable' not in reader.fieldnames:
                print(f"Error: {filepath} does not contain 'human_usable' column.")
                sys.exit(1)

            for row in reader:
                usable_val = row.get("human_usable", "").strip().lower()

                # Only count rows that have been reviewed (y or n)
                if usable_val not in ('y', 'n'):
                    continue

                total_reviewed += 1
                is_usable = (usable_val == 'y')

                if is_usable:
                    usable_count += 1

                source = row.get("source", "Unknown")
                source_stats[source]["total"] += 1
                if is_usable:
                    source_stats[source]["usable"] += 1

                pain_cat = row.get("pain_category") or "None"
                pain_stats[pain_cat]["total"] += 1
                if is_usable:
                    pain_stats[pain_cat]["usable"] += 1

                if row.get("company_name") and str(row.get("company_name")).strip().lower() != 'null':
                    company_name_count += 1

    except FileNotFoundError:
        print(f"Error: File {filepath} not found.")
        sys.exit(1)

    if total_reviewed == 0:
        print("No reviewed records found. Please fill out the 'human_usable' column with 'y' or 'n'.")
        sys.exit(0)

    print(f"\n--- Lead Quality Summary ({filepath}) ---")
    print(f"Total Reviewed: {total_reviewed}")
    print(f"Overall Usable Rate: {usable_count}/{total_reviewed} ({(usable_count/total_reviewed)*100:.1f}%)")
    print(f"Leads with Company Name: {company_name_count}/{total_reviewed} ({(company_name_count/total_reviewed)*100:.1f}%)")

    print("\n--- Usable Rate by Source ---")
    for src, stats in source_stats.items():
        rate = (stats["usable"] / stats["total"]) * 100 if stats["total"] > 0 else 0
        print(f"  {src}: {stats['usable']}/{stats['total']} ({rate:.1f}%)")

    print("\n--- Usable Rate by Pain Category ---")
    for pain, stats in pain_stats.items():
        rate = (stats["usable"] / stats["total"]) * 100 if stats["total"] > 0 else 0
        print(f"  {pain}: {stats['usable']}/{stats['total']} ({rate:.1f}%)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Summarize reviewed leads.")
    parser.add_argument("review_file", help="Path to the review_YYYYMMDD_HHMM.csv file")
    args = parser.parse_args()
    summarize(args.review_file)
