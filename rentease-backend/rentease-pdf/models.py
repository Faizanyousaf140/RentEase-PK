"""
models.py — Pydantic request/response schemas for the PDF microservice.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class AgreementRequest(BaseModel):
    # ── Parties ──────────────────────────────────────────────
    landlord_name:    str = Field(..., min_length=2, max_length=120, examples=["Muhammad Usman Tariq"])
    landlord_cnic:    Optional[str] = Field(None, examples=["35202-1234567-1"])
    landlord_contact: Optional[str] = Field(None, examples=["+92-300-1234567"])

    tenant_name:      str = Field(..., min_length=2, max_length=120, examples=["Ali Raza Khan"])
    tenant_cnic:      Optional[str] = Field(None, examples=["35202-7654321-3"])
    tenant_contact:   Optional[str] = Field(None, examples=["+92-321-9876543"])

    # ── Property ─────────────────────────────────────────────
    property_address: str = Field(..., min_length=5, max_length=300, examples=["House 12, Block C, DHA Phase 5, Lahore"])
    property_type:    Optional[str] = Field("Residential", examples=["Residential", "Commercial"])

    # ── Financial ────────────────────────────────────────────
    rent_amount:      int   = Field(..., gt=0, lt=100_000_000, examples=[45000])
    security_deposit: Optional[int] = Field(None, ge=0, examples=[90000])
    payment_due_day:  int   = Field(1, ge=1, le=28, examples=[1])

    # ── Duration ─────────────────────────────────────────────
    start_date: str = Field(..., examples=["2025-01-01"])
    end_date:   str = Field(..., examples=["2025-12-31"])

    # ── Optional extras ──────────────────────────────────────
    utilities_included: Optional[str] = Field(None, examples=["Water, Electricity"])
    special_conditions: Optional[str] = Field(None, max_length=1000)

    # ── Validators ───────────────────────────────────────────
    @field_validator("start_date", "end_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format.")
        return v

    @model_validator(mode="after")
    def end_after_start(self) -> AgreementRequest:
        if self.start_date and self.end_date:
            if date.fromisoformat(self.end_date) <= date.fromisoformat(self.start_date):
                raise ValueError("end_date must be after start_date.")
        return self

    @field_validator("landlord_cnic", "tenant_cnic")
    @classmethod
    def validate_cnic(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        if not re.fullmatch(r"\d{5}-\d{7}-\d", v):
            raise ValueError("CNIC must be in the format XXXXX-XXXXXXX-X.")
        return v


class PDFResponse(BaseModel):
    """Used only for OpenAPI documentation — actual response is StreamingResponse."""
    detail: str = "Returns a binary PDF stream."