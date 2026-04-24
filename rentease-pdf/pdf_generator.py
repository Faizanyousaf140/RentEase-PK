"""
pdf_generator.py — Production-grade rent agreement PDF using ReportLab Platypus.

Layout:
  Page 1 — Header, party details, property & financial summary table
  Page 2 — Legal terms and conditions (12 clauses), signatures
  Persistent — Page number footer, "RENTEASE" diagonal watermark
"""

from __future__ import annotations

import os
from datetime import date
from io import BytesIO
from typing import List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)

from models import AgreementRequest

# ── Colour palette ────────────────────────────────────────────────────────────
NAVY   = colors.HexColor("#0d1b2a")
GOLD   = colors.HexColor("#c8a96e")
SILVER = colors.HexColor("#8a9ab5")
LIGHT  = colors.HexColor("#f4f6f9")
WHITE  = colors.white
RED    = colors.HexColor("#c0392b")

PAGE_W, PAGE_H = A4


# ── Style registry ────────────────────────────────────────────────────────────
def _build_styles() -> dict:
    base = getSampleStyleSheet()

    def ps(name: str, **kw) -> ParagraphStyle:
        return ParagraphStyle(name, parent=base["Normal"], **kw)

    return {
        "doc_title": ps(
            "doc_title",
            fontSize=22, fontName="Helvetica-Bold",
            textColor=WHITE, alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "doc_subtitle": ps(
            "doc_subtitle",
            fontSize=10, fontName="Helvetica",
            textColor=GOLD, alignment=TA_CENTER,
            spaceAfter=0,
        ),
        "section_heading": ps(
            "section_heading",
            fontSize=9, fontName="Helvetica-Bold",
            textColor=NAVY, spaceBefore=14, spaceAfter=6,
            borderPad=0,
        ),
        "body": ps(
            "body",
            fontSize=9.5, fontName="Helvetica",
            textColor=colors.HexColor("#1a1a2e"),
            leading=15, alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "clause_num": ps(
            "clause_num",
            fontSize=9, fontName="Helvetica-Bold",
            textColor=NAVY, leading=14,
        ),
        "clause_body": ps(
            "clause_body",
            fontSize=9, fontName="Helvetica",
            textColor=colors.HexColor("#2c2c54"),
            leading=14, alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "label": ps(
            "label",
            fontSize=8, fontName="Helvetica-Bold",
            textColor=SILVER,
        ),
        "value": ps(
            "value",
            fontSize=9.5, fontName="Helvetica",
            textColor=NAVY,
        ),
        "footer": ps(
            "footer",
            fontSize=7.5, fontName="Helvetica",
            textColor=SILVER, alignment=TA_CENTER,
        ),
        "sig_name": ps(
            "sig_name",
            fontSize=10, fontName="Helvetica-Bold",
            textColor=NAVY, alignment=TA_CENTER,
        ),
        "sig_label": ps(
            "sig_label",
            fontSize=8, fontName="Helvetica",
            textColor=SILVER, alignment=TA_CENTER,
        ),
    }


# ── Watermark / footer canvas callback ───────────────────────────────────────
class _NumberedCanvas(pdf_canvas.Canvas):
    """Adds page number and watermark after all pages are rendered."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states: List[dict] = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_watermark()
            self._draw_footer(self._pageNumber, total)
            super().showPage()
        super().save()

    def _draw_watermark(self):
        self.saveState()
        self.setFont("Helvetica-Bold", 68)
        self.setFillColor(colors.HexColor("#0d1b2a"), alpha=0.04)
        self.translate(PAGE_W / 2, PAGE_H / 2)
        self.rotate(45)
        self.drawCentredString(0, 0, "RENTEASE")
        self.restoreState()

    def _draw_footer(self, page_num: int, total: int):
        self.saveState()
        self.setStrokeColor(GOLD)
        self.setLineWidth(0.5)
        self.line(2 * cm, 1.6 * cm, PAGE_W - 2 * cm, 1.6 * cm)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(SILVER)
        self.drawString(2 * cm, 1.2 * cm, "RentEase Pakistan · Digital Rent Agreement")
        self.drawRightString(PAGE_W - 2 * cm, 1.2 * cm, f"Page {page_num} of {total}")
        self.restoreState()


# ── Header band (drawn on first page) ────────────────────────────────────────
def _draw_header_band(c: pdf_canvas.Canvas, doc: BaseDocTemplate):
    band_h = 3.8 * cm
    # Navy background
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - band_h, PAGE_W, band_h, fill=1, stroke=0)

    # Gold accent bar
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - band_h - 3, PAGE_W, 3, fill=1, stroke=0)

    # Logo mark
    c.setFillColor(GOLD)
    c.circle(1.8 * cm, PAGE_H - band_h / 2, 0.45 * cm, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(1.8 * cm, PAGE_H - band_h / 2 - 3.5, "RE")

    # Title text
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(3.2 * cm, PAGE_H - 2.1 * cm, "RESIDENTIAL RENT AGREEMENT")

    c.setFillColor(GOLD)
    c.setFont("Helvetica", 9)
    c.drawString(3.2 * cm, PAGE_H - 2.8 * cm, "RentEase Pakistan  ·  Legally Binding Digital Document")


def _draw_subsequent_header(c: pdf_canvas.Canvas, doc: BaseDocTemplate):
    band_h = 1.6 * cm
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - band_h, PAGE_W, band_h, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - band_h - 2, PAGE_W, 2, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2 * cm, PAGE_H - 1.1 * cm, "RESIDENTIAL RENT AGREEMENT  (continued)")
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - 2 * cm, PAGE_H - 1.1 * cm, "RentEase Pakistan")


# ── Helper: two-column info table ─────────────────────────────────────────────
def _info_table(rows: list, styles_dict: dict) -> Table:
    """
    rows: list of (label, value) pairs
    Returns a two-column Table styled for party/property info.
    """
    data = [
        [
            Paragraph(label, styles_dict["label"]),
            Paragraph(str(value) if value else "—", styles_dict["value"]),
        ]
        for label, value in rows
    ]
    t = Table(data, colWidths=[4.5 * cm, 10.5 * cm])
    t.setStyle(
        TableStyle([
            ("VALIGN",       (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("LINEBELOW",    (0, 0), (-1, -2), 0.3, colors.HexColor("#e8eaf0")),
        ])
    )
    return t


# ── Summary box (dark card) ───────────────────────────────────────────────────
def _summary_table(data: AgreementRequest, styles_dict: dict) -> Table:
    def fmt_pkr(n):
        return f"PKR {n:,}" if n else "—"

    start = date.fromisoformat(data.start_date)
    end   = date.fromisoformat(data.end_date)
    months = (end.year - start.year) * 12 + (end.month - start.month)

    label_style = ParagraphStyle("sl", parent=styles_dict["label"], textColor=SILVER, fontSize=7.5)
    value_style = ParagraphStyle("sv", parent=styles_dict["value"], textColor=WHITE, fontSize=10, fontName="Helvetica-Bold")

    cells = [
        ("MONTHLY RENT",     fmt_pkr(data.rent_amount)),
        ("SECURITY DEPOSIT", fmt_pkr(data.security_deposit) if data.security_deposit else "—"),
        ("DURATION",         f"{months} months"),
        ("PAYMENT DUE",      f"{data.payment_due_day}st of each month"),
    ]

    row = [[Paragraph(lbl, label_style), Paragraph(val, value_style)] for lbl, val in cells]
    col_w = (PAGE_W - 4 * cm) / 4

    t = Table([row], colWidths=[col_w] * 4)
    t.setStyle(
        TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
            ("TOPPADDING",    (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LINEAFTER",     (0, 0), (2, -1),  0.5, GOLD),
            ("ROUNDEDCORNERS", [6]),
        ])
    )
    return t


# ── Legal clauses ─────────────────────────────────────────────────────────────
CLAUSES = [
    (
        "1. Rent Payment",
        "The Tenant agrees to pay the monthly rent of PKR {rent:,} on or before the {due}th day of each calendar month. "
        "Payments shall be made via bank transfer, cheque, or any mutually agreed digital payment method. "
        "A late fee of PKR 500 per day shall apply after a 5-day grace period.",
    ),
    (
        "2. Security Deposit",
        "A refundable security deposit of PKR {deposit} has been paid by the Tenant. This deposit shall be returned within "
        "30 days of the termination of this agreement, subject to deductions for unpaid rent, utility bills, or property damage "
        "beyond normal wear and tear.",
    ),
    (
        "3. Duration of Tenancy",
        "This agreement commences on {start} and expires on {end}. The tenancy shall terminate automatically on the expiry date "
        "unless renewed in writing by both parties. Month-to-month continuation after the expiry date shall be treated as a new "
        "tenancy at the same terms until either party provides 30 days' written notice of termination.",
    ),
    (
        "4. Use of Premises",
        "The Tenant shall use the property exclusively for {prop_type} purposes and shall not carry on any trade, business, or "
        "profession from the premises without prior written consent of the Landlord. The Tenant shall not sublet the property "
        "or any part thereof.",
    ),
    (
        "5. Maintenance and Repairs",
        "The Tenant shall maintain the property in a clean and tenantable condition. Minor repairs (under PKR 2,000) are the "
        "responsibility of the Tenant. The Landlord shall be responsible for major structural repairs, plumbing, and electrical "
        "systems, provided that damage has not been caused by the Tenant's negligence.",
    ),
    (
        "6. Utilities and Services",
        "The Tenant shall be solely responsible for payment of all utility bills including electricity, gas, water, and internet "
        "during the tenancy period, unless otherwise specified: {utilities}. Meter readings shall be recorded at the time of "
        "possession and at the time of vacation.",
    ),
    (
        "7. Right of Entry",
        "The Landlord or their authorised representative shall have the right to inspect the property at reasonable times with "
        "a minimum notice of 24 hours, except in cases of emergency. The Tenant shall not unreasonably withhold access.",
    ),
    (
        "8. Alterations and Modifications",
        "The Tenant shall not make any structural alterations, additions, or modifications to the property without the prior "
        "written consent of the Landlord. Fixtures installed by the Tenant may be removed at the end of the tenancy provided "
        "the original condition is restored.",
    ),
    (
        "9. Termination",
        "Either party may terminate this agreement by giving 30 days' written notice. In the event of material breach of any "
        "term of this agreement, the Landlord shall serve a written notice specifying the breach. If the Tenant fails to remedy "
        "the breach within 15 days, the Landlord may initiate eviction proceedings under applicable law.",
    ),
    (
        "10. Handover of Premises",
        "Upon termination or expiry of this agreement, the Tenant shall vacate the premises and return all keys, access cards, "
        "and remote controls. The property shall be left in the same condition as at the commencement of this agreement, "
        "subject to normal wear and tear.",
    ),
    (
        "11. Dispute Resolution",
        "Any dispute arising out of or in connection with this agreement shall first be referred to mediation. If mediation "
        "fails, the matter shall be referred to arbitration in accordance with the Arbitration Act, 1940, or to the court of "
        "competent jurisdiction in Lahore, Pakistan.",
    ),
    (
        "12. Governing Law",
        "This agreement shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. "
        "Both parties confirm that they have read, understood, and agreed to all terms and conditions stated herein.",
    ),
]


def _build_clauses(data: AgreementRequest, styles_dict: dict) -> List:
    deposit_str = f"PKR {data.security_deposit:,}" if data.security_deposit else "nil"
    utilities_str = data.utilities_included or "none — all utilities are the Tenant's responsibility"
    prop_type = (data.property_type or "Residential").lower()

    story = []
    for title, text in CLAUSES:
        filled = text.format(
            rent=data.rent_amount,
            due=data.payment_due_day,
            deposit=deposit_str,
            start=data.start_date,
            end=data.end_date,
            prop_type=prop_type,
            utilities=utilities_str,
        )
        block = KeepTogether([
            Paragraph(title, styles_dict["clause_num"]),
            Paragraph(filled, styles_dict["clause_body"]),
        ])
        story.append(block)
    return story


# ── Signature block ───────────────────────────────────────────────────────────
def _signature_block(data: AgreementRequest, styles_dict: dict) -> Table:
    line = HRFlowable(width="90%", thickness=0.8, color=NAVY, spaceAfter=4)

    def sig_col(name: str, role: str, cnic: str = None) -> List:
        items = [
            Spacer(1, 1.8 * cm),
            line,
            Paragraph(name, styles_dict["sig_name"]),
            Paragraph(role, styles_dict["sig_label"]),
        ]
        if cnic:
            items.append(Paragraph(f"CNIC: {cnic}", styles_dict["sig_label"]))
        items.append(Spacer(1, 0.6 * cm))
        items.append(Paragraph("Date: ___________________", styles_dict["sig_label"]))
        return items

    data_rows = [[sig_col(data.landlord_name, "Landlord", data.landlord_cnic),
                  sig_col(data.tenant_name, "Tenant",   data.tenant_cnic)]]

    t = Table(data_rows, colWidths=[(PAGE_W - 4 * cm) / 2, (PAGE_W - 4 * cm) / 2])
    t.setStyle(TableStyle([
        ("VALIGN",  (0, 0), (-1, -1), "TOP"),
        ("ALIGN",   (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",  (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",(0, 0), (-1, -1), 12),
    ]))
    return t


# ── Main generator ────────────────────────────────────────────────────────────
def generate_agreement_pdf(data: AgreementRequest) -> BytesIO:
    buffer = BytesIO()
    styles = _build_styles()

    # ── Page templates ──────────────────────────────────────
    first_frame = Frame(
        2 * cm, 2.2 * cm,
        PAGE_W - 4 * cm, PAGE_H - 4 * cm - 3.8 * cm,
        id="first",
    )
    later_frame = Frame(
        2 * cm, 2.2 * cm,
        PAGE_W - 4 * cm, PAGE_H - 4 * cm - 1.6 * cm,
        id="later",
    )

    doc = BaseDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.2 * cm,
        title="RentEase Rent Agreement",
        author="RentEase Pakistan",
        subject=f"Agreement: {data.landlord_name} / {data.tenant_name}",
    )

    doc.addPageTemplates([
        PageTemplate(id="First", frames=[first_frame], onPage=_draw_header_band),
        PageTemplate(id="Later", frames=[later_frame], onPage=_draw_subsequent_header),
    ])

    # ── Content story ───────────────────────────────────────
    story = []

    # Reference number + generation date
    ref = f"REF: RE-{date.today().strftime('%Y%m%d')}-{abs(hash(data.tenant_name)) % 9999:04d}"
    story.append(Spacer(1, 0.4 * cm))
    story.append(
        Paragraph(
            f'<font color="#8a9ab5" size="8">{ref} &nbsp;&nbsp;·&nbsp;&nbsp; '
            f'Generated: {date.today().strftime("%d %B %Y")}</font>',
            ParagraphStyle("ref", parent=styles["body"], alignment=TA_RIGHT, spaceAfter=12),
        )
    )

    # ── PARTIES ─────────────────────────────────────────────
    story.append(Paragraph("PARTIES TO THIS AGREEMENT", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))

    party_rows = [
        [
            _info_table([
                ("LANDLORD NAME",    data.landlord_name),
                ("CNIC",             data.landlord_cnic),
                ("CONTACT",          data.landlord_contact),
            ], styles),
            _info_table([
                ("TENANT NAME",  data.tenant_name),
                ("CNIC",         data.tenant_cnic),
                ("CONTACT",      data.tenant_contact),
            ], styles),
        ]
    ]
    parties_table = Table(party_rows, colWidths=[(PAGE_W - 4 * cm) / 2] * 2)
    parties_table.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LINEAFTER",     (0, 0), (0, -1),  0.5, colors.HexColor("#dde0ea")),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
    ]))
    story.append(parties_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── PROPERTY ─────────────────────────────────────────────
    story.append(Paragraph("PROPERTY DETAILS", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
    story.append(_info_table([
        ("ADDRESS",       data.property_address),
        ("PROPERTY TYPE", data.property_type or "Residential"),
    ], styles))
    story.append(Spacer(1, 0.5 * cm))

    # ── SUMMARY BOX ──────────────────────────────────────────
    story.append(Paragraph("FINANCIAL & DURATION SUMMARY", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
    story.append(_summary_table(data, styles))
    story.append(Spacer(1, 0.5 * cm))

    # ── SPECIAL CONDITIONS ────────────────────────────────────
    if data.special_conditions:
        story.append(Paragraph("SPECIAL CONDITIONS", styles["section_heading"]))
        story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
        story.append(Paragraph(data.special_conditions, styles["body"]))
        story.append(Spacer(1, 0.3 * cm))

    # ── Page break before terms ───────────────────────────────
    from reportlab.platypus import NextPageTemplate, PageBreak
    story.append(NextPageTemplate("Later"))
    story.append(PageBreak())

    # ── TERMS AND CONDITIONS ──────────────────────────────────
    story.append(Paragraph("TERMS AND CONDITIONS", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=10))
    story.extend(_build_clauses(data, styles))

    # ── SIGNATURES ────────────────────────────────────────────
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph("SIGNATURES", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6))
    story.append(
        Paragraph(
            "Both parties confirm they have read and agreed to all terms stated in this agreement.",
            ParagraphStyle("sig_intro", parent=styles["body"], fontSize=8.5, textColor=SILVER),
        )
    )
    story.append(_signature_block(data, styles))

    # ── WITNESS ───────────────────────────────────────────────
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("WITNESS", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dde0ea"), spaceAfter=6))
    witness_row = [
        [
            Spacer(1, 1.5 * cm),
            HRFlowable(width="85%", thickness=0.7, color=NAVY, spaceAfter=3),
            Paragraph("Witness Name", styles["sig_label"]),
            Paragraph("CNIC: ___________________", styles["sig_label"]),
        ],
        [
            Spacer(1, 1.5 * cm),
            HRFlowable(width="85%", thickness=0.7, color=NAVY, spaceAfter=3),
            Paragraph("Witness Name", styles["sig_label"]),
            Paragraph("CNIC: ___________________", styles["sig_label"]),
        ],
    ]
    wt = Table([witness_row], colWidths=[(PAGE_W - 4 * cm) / 2] * 2)
    wt.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(wt)

    # ── Build ─────────────────────────────────────────────────
    doc.build(story, canvasmaker=_NumberedCanvas)
    buffer.seek(0)
    return buffer