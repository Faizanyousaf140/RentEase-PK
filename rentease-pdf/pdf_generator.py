# reportlab logic
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO

def generate_agreement_pdf(data):

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)

    p.setFont("Helvetica-Bold", 16)
    p.drawString(200, 800, "RENT AGREEMENT")

    p.setFont("Helvetica", 12)
    p.drawString(50, 750, f"Landlord: {data.landlord_name}")
    p.drawString(50, 730, f"Tenant: {data.tenant_name}")
    p.drawString(50, 710, f"Property: {data.property_address}")
    p.drawString(50, 690, f"Rent: PKR {data.rent_amount}")
    p.drawString(50, 670, f"Start Date: {data.start_date}")
    p.drawString(50, 650, f"End Date: {data.end_date}")

    p.drawString(50, 600, "This is a legally generated digital rent agreement.")

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer