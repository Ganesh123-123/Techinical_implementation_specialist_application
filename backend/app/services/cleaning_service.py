import os
import io
import csv
from typing import Dict, Any, List
from clean_leads import process_leads, clean_phone_number, normalize_name


def run_lead_cleaning(input_path: str = "leads.csv") -> Dict[str, Any]:
    """Execute clean_leads logic and return structured results."""
    output_path = "cleaned_leads.csv"
    invalid_path = "invalid_leads.csv"

    summary = process_leads(input_path, output_path, invalid_path)

    # Read output content
    cleaned_records = []
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            cleaned_records = list(reader)

    invalid_records = []
    if os.path.exists(invalid_path):
        with open(invalid_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            invalid_records = list(reader)

    return {
        "summary": summary,
        "cleaned_records": cleaned_records,
        "invalid_records": invalid_records,
    }


def clean_lead_payload(rows: List[Dict[str, str]]) -> Dict[str, Any]:
    """Clean arbitrary lead rows passed in a web payload."""
    cleaned = []
    invalid = []
    seen = set()
    dup_count = 0

    for row in rows:
        name = normalize_name(row.get("Name", ""))
        raw_phone = row.get("Phone", "")
        valid, phone, reason = clean_phone_number(raw_phone)

        if not valid:
            invalid.append({"Name": name, "Phone": raw_phone, "Reason": reason})
            continue

        key = (name.lower(), phone)
        if key in seen:
            dup_count += 1
            continue

        seen.add(key)
        cleaned.append({"Name": name, "Phone": phone})

    return {
        "summary": {
            "processed": len(rows),
            "cleaned": len(cleaned),
            "duplicates": dup_count,
            "invalid": len(invalid),
        },
        "cleaned_records": cleaned,
        "invalid_records": invalid,
    }
