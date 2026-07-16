import io
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from app.core.storage import upload_certificate_pdf


def generate_certificate_pdf(
    learner_name: str,
    course_title: str,
    issued_at,
    certificate_id,
    user_id,
    course_id
) -> str:
    """
    Generates a professional certificate PDF entirely in memory and
    uploads it directly to R2 - it never touches local disk, consistent
    with how video/pdf/thumbnail/assignment uploads all work now.
    Returns the public R2 URL to store in Certificate.certificate_url.
    """
    page_size = landscape(A4)
    width, height = page_size
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=page_size)

    navy = HexColor("#0f172a")
    blue = HexColor("#2563eb")
    gray = HexColor("#64748b")

    c.setStrokeColor(blue)
    c.setLineWidth(3)
    c.rect(1.2 * cm, 1.2 * cm, width - 2.4 * cm, height - 2.4 * cm)

    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 34)
    c.drawCentredString(width / 2, height - 4.5 * cm, "Certificate of Completion")

    c.setFillColor(gray)
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 6 * cm, "This certifies that")

    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2, height - 8 * cm, learner_name)

    c.setFillColor(gray)
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 9.5 * cm, "has successfully completed the course")

    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 11 * cm, course_title)

    c.setFillColor(gray)
    c.setFont("Helvetica", 12)
    date_str = issued_at.strftime("%B %d, %Y")
    c.drawCentredString(width / 2, 3.5 * cm, f"Issued on {date_str}")

    c.setFont("Helvetica", 9)
    c.drawCentredString(width / 2, 2.5 * cm, f"Certificate ID: {certificate_id}")

    c.showPage()
    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()

    return upload_certificate_pdf(pdf_bytes, str(user_id), str(course_id))