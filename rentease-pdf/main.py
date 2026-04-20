# FastAPI single endpoint
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from models import AgreementRequest
from pdf_generator import generate_agreement_pdf

app = FastAPI()

@app.get("/")
def home():
    return {"message": "RentEase PDF Service Running"}

@app.post("/generate-pdf")
def create_pdf(data: AgreementRequest):

    pdf_buffer = generate_agreement_pdf(data)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=agreement.pdf"
        }
    )