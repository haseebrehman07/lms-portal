import io
import random
import string
from datetime import datetime

import qrcode
import requests
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.core.storage import upload_certificate_pdf
from app.config import settings


def generate_certificate_number(course_prefix: str | None, year: int, db) -> str:
    """
    Builds a unique, human-readable certificate ID like 'CHRPE-2026-062'
    or 'CHRP-2026-014', using this course's own certificate_prefix.
    Retries on the rare chance of a collision.
    """
    from app.models.certificate import Certificate

    prefix = (course_prefix or "CERT").upper()[:10]

    for _ in range(20):
        number = f"{prefix}-{year}-{random.randint(1, 999):03d}"
        exists = db.query(Certificate).filter(
            Certificate.certificate_number == number
        ).first()
        if not exists:
            return number

    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{year}-{suffix}"


def _generate_qr_image(verify_url: str) -> ImageReader:
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return ImageReader(buffer)


def _load_template_background(template_url: str | None) -> ImageReader | None:
    """
    Downloads this course's specific template image from R2 (or
    wherever certificate_template_url points). Returns None if no
    template is set, so the caller can fall back to a plain design.
    """
    if not template_url:
        return None
    try:
        response = requests.get(template_url, timeout=15)
        response.raise_for_status()
        return ImageReader(io.BytesIO(response.content))
    except Exception:
        # If the template URL is broken/unreachable, don't crash
        # certificate issuance - fall back to the plain design instead.
        return None


def _draw_plain_fallback(c, width, height, learner_name, course_title, navy):
    """Used only if a course has no template image uploaded yet."""
    c.setStrokeColor(HexColor("#2563eb"))
    c.setLineWidth(3)
    c.rect(30, 30, width - 60, height - 60)

    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 34)
    c.drawCentredString(width / 2, height - 130, "Certificate of Completion")

    c.setFillColor(HexColor("#64748b"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 170, "This certifies that")

    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2, height - 220, learner_name)

    c.setFillColor(HexColor("#64748b"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 260, "has successfully completed the course")

    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 300, course_title)


def generate_certificate_pdf(
    learner_name: str,
    course_title: str,
    issued_at: datetime,
    certificate_id,
    certificate_number: str,
    certificate_template_url: str | None,
    user_id,
    course_id
) -> str:
    """
    Generates the certificate PDF using THIS COURSE'S OWN template
    image as the background (each course can have a different design),
    with learner name, course title, certificate number, date, and a
    QR code (linking to the public verification page) overlaid.

    If the course has no template_url set, falls back to a plain
    generic design rather than failing certificate issuance entirely.

    Returns the public R2 URL to store in Certificate.certificate_url.
    """
    page_size = landscape(A4)
    width, height = page_size
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=page_size)

    navy = HexColor("#1e3a5f")
    background = _load_template_background(certificate_template_url)

    if background:
        c.drawImage(
            background, 0, 0, width=width, height=height,
            preserveAspectRatio=False, mask='auto'
        )

        # These positions assume templates are designed on a consistent
        # layout (name/course/date/QR in roughly the same spots) - see
        # the note in chat about keeping new templates visually
        # consistent in structure with the original CHRPE one.
        c.setFillColor(navy)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(width / 2, height * 0.565, learner_name)

        c.setFillColor(HexColor("#111111"))
        c.setFont("Helvetica-Bold", 15)
        c.drawCentredString(width / 2, height * 0.455, course_title)

        c.setFillColor(HexColor("#111111"))
        c.setFont("Helvetica", 11)
        date_str = issued_at.strftime("%d-%m-%Y")
        c.drawString(width * 0.305, height * 0.135, f"Certificate ID: {certificate_number}")
        c.drawString(width * 0.305, height * 0.108, f"Issued On: {date_str}")

        verify_url = f"{settings.backend_public_url}/certificates/verify/{certificate_number}"
        qr_image = _generate_qr_image(verify_url)
        qr_size = height * 0.11
        c.drawImage(
            qr_image, width * 0.225, height * 0.095,
            width=qr_size, height=qr_size, mask='auto'
        )
    else:
        # No template uploaded for this course yet - plain fallback
        # so an admin forgetting to upload a design doesn't block
        # certificate issuance entirely.
        _draw_plain_fallback(c, width, height, learner_name, course_title, navy)

        c.setFillColor(HexColor("#64748b"))
        c.setFont("Helvetica", 10)
        date_str = issued_at.strftime("%B %d, %Y")
        c.drawCentredString(width / 2, 90, f"Issued on {date_str}")
        c.setFont("Helvetica", 9)
        c.drawCentredString(width / 2, 70, f"Certificate ID: {certificate_number}")

    c.showPage()
    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()

    return upload_certificate_pdf(pdf_bytes, str(user_id), str(course_id))