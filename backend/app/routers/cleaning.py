import os
import csv
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from backend.app.services.cleaning_service import run_lead_cleaning, clean_lead_payload

router = APIRouter(prefix="/api/clean-leads", tags=["Lead Cleaning"])


class CustomCleanRequest(BaseModel):
    leads: List[Dict[str, str]]


@router.get("/status")
def get_cleaning_status():
    leads_exist = os.path.exists("leads.csv")
    cleaned_exist = os.path.exists("cleaned_leads.csv")
    invalid_exist = os.path.exists("invalid_leads.csv")

    raw_count = 0
    if leads_exist:
        with open("leads.csv", "r", encoding="utf-8-sig") as f:
            raw_count = sum(1 for _ in csv.DictReader(f))

    cleaned_count = 0
    if cleaned_exist:
        with open("cleaned_leads.csv", "r", encoding="utf-8") as f:
            cleaned_count = sum(1 for _ in csv.DictReader(f))

    return {
        "leads_csv_exists": leads_exist,
        "cleaned_csv_exists": cleaned_exist,
        "invalid_csv_exists": invalid_exist,
        "raw_count": raw_count,
        "cleaned_count": cleaned_count,
    }


@router.get("/preview")
def preview_files():
    raw_data = []
    if os.path.exists("leads.csv"):
        with open("leads.csv", "r", encoding="utf-8-sig") as f:
            raw_data = list(csv.DictReader(f))

    cleaned_data = []
    if os.path.exists("cleaned_leads.csv"):
        with open("cleaned_leads.csv", "r", encoding="utf-8") as f:
            cleaned_data = list(csv.DictReader(f))

    invalid_data = []
    if os.path.exists("invalid_leads.csv"):
        with open("invalid_leads.csv", "r", encoding="utf-8") as f:
            invalid_data = list(csv.DictReader(f))

    return {
        "raw_leads": raw_data,
        "cleaned_leads": cleaned_data,
        "invalid_leads": invalid_data,
    }


@router.post("/execute")
def execute_cleaning():
    try:
        result = run_lead_cleaning("leads.csv")
        return {
            "status": "success",
            "message": "Lead cleaning completed successfully.",
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/custom")
def clean_custom(req: CustomCleanRequest):
    return clean_lead_payload(req.leads)
