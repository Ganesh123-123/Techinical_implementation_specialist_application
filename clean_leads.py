#!/usr/bin/env python3
"""
clean_leads.py - Lead Data Cleaning Script for Sunrise Interiors

Standardizes Indian mobile numbers into +91XXXXXXXXXX format,
removes duplicate records, validates inputs, and exports cleaned leads.
"""

import csv
import os
import re
import sys
from typing import Dict, List, Optional, Tuple


def normalize_name(name: str) -> str:
    """Normalize client name by stripping leading/trailing whitespace and collapsing multiple spaces."""
    if not name:
        return ""
    return re.sub(r"\s+", " ", name.strip())


def clean_phone_number(phone: str) -> Tuple[bool, str, str]:
    """
    Standardize Indian mobile numbers into +91XXXXXXXXXX format.

    Rules:
    - Removes formatting characters (spaces, hyphens, parentheses, dots).
    - Handles existing '+91' or '91' country code prefix.
    - Strips leading zero from 11-digit numbers (STD/trunk prefix).
    - Validates 10-digit mobile number starts with 6, 7, 8, or 9.

    Returns:
        (is_valid, standardized_phone_or_original, error_reason)
    """
    if not phone or not str(phone).strip():
        return False, phone, "Empty phone number"

    raw = str(phone).strip()

    # Check if raw starts with '+'
    has_plus = raw.startswith("+")
    raw_digits_only = re.sub(r"\D", "", raw)

    digits = raw_digits_only

    # Handle country code 91 if present
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    # Handle leading 0 for 11-digit phone numbers
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]

    # Must be exactly 10 digits
    if len(digits) != 10:
        return False, raw, f"Invalid length ({len(digits)} digits, expected 10)"

    # Valid Indian mobile numbers begin with 6, 7, 8, or 9
    if digits[0] not in ("6", "7", "8", "9"):
        return False, raw, f"Invalid starting digit '{digits[0]}' (must start with 6, 7, 8, or 9)"

    standardized = f"+91{digits}"
    return True, standardized, ""


def process_leads(
    input_file: str = "leads.csv",
    output_file: str = "cleaned_leads.csv",
    invalid_file: str = "invalid_leads.csv",
) -> Dict[str, any]:
    """
    Read input CSV, clean phone numbers, deduplicate identical (Name, Phone) pairs,
    and output cleaned leads and invalid leads.
    """
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file not found: {input_file}")

    total_processed = 0
    cleaned_rows: List[Dict[str, str]] = []
    invalid_rows: List[Dict[str, str]] = []
    seen_pairs = set()
    duplicate_count = 0

    with open(input_file, mode="r", encoding="utf-8-sig") as infile:
        reader = csv.DictReader(infile)
        if not reader.fieldnames or "Name" not in reader.fieldnames or "Phone" not in reader.fieldnames:
            raise ValueError(f"Input CSV must contain 'Name' and 'Phone' headers. Found: {reader.fieldnames}")

        for row in reader:
            total_processed += 1
            raw_name = row.get("Name", "")
            raw_phone = row.get("Phone", "")

            norm_name = normalize_name(raw_name)
            is_valid, clean_phone, reason = clean_phone_number(raw_phone)

            if not is_valid:
                invalid_rows.append({
                    "Name": norm_name,
                    "Phone": raw_phone,
                    "Reason": reason,
                })
                continue

            # Deduplication: Check if both normalized Name and normalized Phone match
            pair_key = (norm_name.lower(), clean_phone)
            if pair_key in seen_pairs:
                duplicate_count += 1
                continue

            seen_pairs.add(pair_key)
            cleaned_rows.append({
                "Name": norm_name,
                "Phone": clean_phone,
            })

    # Write cleaned leads
    with open(output_file, mode="w", newline="", encoding="utf-8") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=["Name", "Phone"])
        writer.writeheader()
        writer.writerows(cleaned_rows)

    # Write invalid leads report if any exist
    if invalid_rows:
        with open(invalid_file, mode="w", newline="", encoding="utf-8") as errfile:
            writer = csv.DictWriter(errfile, fieldnames=["Name", "Phone", "Reason"])
            writer.writeheader()
            writer.writerows(invalid_rows)
    elif os.path.exists(invalid_file):
        # Clean up stale invalid leads file if no invalids
        try:
            os.remove(invalid_file)
        except OSError:
            pass

    summary = {
        "processed": total_processed,
        "cleaned": len(cleaned_rows),
        "duplicates": duplicate_count,
        "invalid": len(invalid_rows),
    }

    print("=" * 45)
    print(" Sunrise Interiors - Lead Cleaning Summary")
    print("=" * 45)
    print(f"Total Rows Processed : {summary['processed']}")
    print(f"Valid Cleaned Leads  : {summary['cleaned']}")
    print(f"Duplicate Rows Removed: {summary['duplicates']}")
    print(f"Invalid Rows Reported : {summary['invalid']}")
    print("=" * 45)
    print(f"Saved cleaned output to : {output_file}")
    if invalid_rows:
        print(f"Saved invalid leads to  : {invalid_file}")
    print("=" * 45)

    return summary


if __name__ == "__main__":
    in_file = sys.argv[1] if len(sys.argv) > 1 else "leads.csv"
    out_file = sys.argv[2] if len(sys.argv) > 2 else "cleaned_leads.csv"
    err_file = sys.argv[3] if len(sys.argv) > 3 else "invalid_leads.csv"
    process_leads(in_file, out_file, err_file)
