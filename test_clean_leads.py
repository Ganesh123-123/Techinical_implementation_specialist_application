"""
test_clean_leads.py - Comprehensive Unit & Integration Tests for clean_leads.py
"""

import os
import tempfile
import pytest
from clean_leads import clean_phone_number, normalize_name, process_leads


class TestPhoneCleaningUnit:
    """Unit tests for clean_phone_number."""

    def test_plain_10_digit(self):
        valid, phone, reason = clean_phone_number("9876543210")
        assert valid is True
        assert phone == "+919876543210"
        assert reason == ""

    def test_numbers_with_spaces(self):
        valid, phone, reason = clean_phone_number("91 98765 12345")
        assert valid is True
        assert phone == "+919876512345"

    def test_numbers_with_hyphens(self):
        valid, phone, reason = clean_phone_number("098-765-99887")
        assert valid is True
        assert phone == "+919876599887"

    def test_numbers_with_plus_91(self):
        valid, phone, reason = clean_phone_number("+919876500000")
        assert valid is True
        assert phone == "+919876500000"

    def test_numbers_with_plus_91_and_hyphen(self):
        valid, phone, reason = clean_phone_number("+91-9876511111")
        assert valid is True
        assert phone == "+919876511111"

    def test_numbers_starting_with_zero(self):
        valid, phone, reason = clean_phone_number("09876543210")
        assert valid is True
        assert phone == "+919876543210"

    def test_starting_digits_validation(self):
        # 6, 7, 8, 9 are valid Indian mobile start digits
        for start_digit in ("6", "7", "8", "9"):
            valid, phone, _ = clean_phone_number(f"{start_digit}123456789")
            assert valid is True
            assert phone == f"+91{start_digit}123456789"

        # 1, 2, 3, 4, 5 are invalid start digits for mobile numbers in India
        for start_digit in ("1", "2", "3", "4", "5"):
            valid, _, reason = clean_phone_number(f"{start_digit}123456789")
            assert valid is False
            assert "Invalid starting digit" in reason

    def test_invalid_lengths(self):
        valid, _, reason = clean_phone_number("98765")
        assert valid is False
        assert "Invalid length" in reason

        valid, _, reason = clean_phone_number("987654321098765")
        assert valid is False
        assert "Invalid length" in reason

    def test_empty_and_alphanumeric(self):
        valid, _, reason = clean_phone_number("")
        assert valid is False
        assert "Empty" in reason

        valid, _, reason = clean_phone_number("98765ABCD0")
        assert valid is False
        assert "Invalid length" in reason


class TestProcessLeadsIntegration:
    """Integration tests for lead processing, deduplication, and file generation."""

    def test_exact_assignment_sample(self):
        """Verify the exact sample input produces the exact expected output from assignment."""
        input_csv_content = (
            "Name,Phone\n"
            "Ravi Kumar,9876543210\n"
            "Priya Shah,91 98765 12345\n"
            "Amit Verma,098-765-99887\n"
            "Sneha Reddy,+919876500000\n"
            "Sneha Reddy,9876500000\n"
            "Karan Mehta,+91-9876511111\n"
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            input_file = os.path.join(tmpdir, "leads.csv")
            output_file = os.path.join(tmpdir, "cleaned_leads.csv")
            invalid_file = os.path.join(tmpdir, "invalid_leads.csv")

            with open(input_file, "w", encoding="utf-8") as f:
                f.write(input_csv_content)

            summary = process_leads(input_file, output_file, invalid_file)

            assert summary["processed"] == 6
            assert summary["cleaned"] == 5
            assert summary["duplicates"] == 1
            assert summary["invalid"] == 0

            with open(output_file, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f.readlines()]

            expected_lines = [
                "Name,Phone",
                "Ravi Kumar,+919876543210",
                "Priya Shah,+919876512345",
                "Amit Verma,+919876599887",
                "Sneha Reddy,+919876500000",
                "Karan Mehta,+919876511111",
            ]
            assert lines == expected_lines

    def test_preserves_distinct_clients_with_same_phone(self):
        """Preserve distinct clients even when their phone numbers match."""
        input_csv_content = (
            "Name,Phone\n"
            "Ananya Roy,9876543210\n"
            "Rohan Roy,9876543210\n"
        )
        with tempfile.TemporaryDirectory() as tmpdir:
            input_file = os.path.join(tmpdir, "leads.csv")
            output_file = os.path.join(tmpdir, "cleaned_leads.csv")

            with open(input_file, "w", encoding="utf-8") as f:
                f.write(input_csv_content)

            summary = process_leads(input_file, output_file)
            assert summary["processed"] == 2
            assert summary["cleaned"] == 2
            assert summary["duplicates"] == 0

    def test_reports_invalid_rows_to_error_report(self):
        """Invalid rows are written to separate error file and not silently discarded."""
        input_csv_content = (
            "Name,Phone\n"
            "Ravi Kumar,9876543210\n"
            "Invalid Person,12345\n"
            "Another Bad,01234567890\n"
        )
        with tempfile.TemporaryDirectory() as tmpdir:
            input_file = os.path.join(tmpdir, "leads.csv")
            output_file = os.path.join(tmpdir, "cleaned_leads.csv")
            invalid_file = os.path.join(tmpdir, "invalid_leads.csv")

            with open(input_file, "w", encoding="utf-8") as f:
                f.write(input_csv_content)

            summary = process_leads(input_file, output_file, invalid_file)
            assert summary["processed"] == 3
            assert summary["cleaned"] == 1
            assert summary["invalid"] == 2

            assert os.path.exists(invalid_file)
            with open(invalid_file, "r", encoding="utf-8") as f:
                content = f.read()
                assert "Invalid Person" in content
                assert "Another Bad" in content
