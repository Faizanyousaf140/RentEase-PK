"""
main.py — Production-ready FastAPI entrypoint for RentEase PDF service.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from datetime import datetime, timezone
from io import BytesIO

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from models import AgreementRequest
from pdf_generator import generate_agreement_pdf


def _bool_env(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def _list_env(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("rentease-pdf")

APP_NAME = os.getenv("APP_NAME", "RentEase PDF Service")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
ENABLE_DOCS = _bool_env("ENABLE_API_DOCS", "true")

ALLOWED_ORIGINS = _list_env(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
TRUSTED_HOSTS = _list_env("TRUSTED_HOSTS", "127.0.0.1,localhost")

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=TRUSTED_HOSTS)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled error | request_id=%s", request_id)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "request_id": request_id},
        )

    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

    logger.info(
        "%s %s -> %s | %.2fms | request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id,
    )
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation failed | path=%s | errors=%s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation failed",
            "errors": exc.errors(),
        },
    )


@app.get("/")
def home() -> dict:
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "status": "running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict:
    # Service is stateless; readiness equals process availability.
    return {"ready": True}


@app.post(
    "/generate-pdf",
    responses={
        200: {
            "description": "PDF stream",
            "content": {"application/pdf": {}},
        }
    },
)
def create_pdf(data: AgreementRequest):
    try:
        pdf_buffer = generate_agreement_pdf(data)
    except Exception as exc:
        logger.exception("PDF generation failed")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"PDF generation failed: {str(exc)}"},
        )

    if not isinstance(pdf_buffer, BytesIO):
        logger.error("PDF generator returned non-buffer object: %s", type(pdf_buffer))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "PDF generator returned invalid response buffer."},
        )

    filename = f"agreement_{data.tenant_name.replace(' ', '_').lower()}_{data.start_date}.pdf"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)