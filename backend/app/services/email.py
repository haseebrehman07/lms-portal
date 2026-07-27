import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """
    Sends a single email via SMTP using the credentials in .env.
    Runs as a background task - failures are logged, not raised, so a
    slow/broken mail server never breaks the API response to the caller.
    """
    if not settings.mail_username or not settings.mail_password:
        logger.warning(
            "Email not configured (mail_username/mail_password missing) - "
            "skipped sending '%s' to %s", subject, to_email
        )
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.mail_from or settings.mail_username
    message["To"] = to_email
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.mail_server, settings.mail_port, timeout=10) as server:
            server.starttls()
            server.login(settings.mail_username, settings.mail_password)
            server.sendmail(message["From"], [to_email], message.as_string())
        logger.info("Email sent: '%s' to %s", subject, to_email)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)


def send_invite_email(to_email: str, name: str, token: str) -> None:
    link = f"{settings.frontend_url}/reset-password?token={token}"
    html = f"""
    <p>Hi {name},</p>
    <p>An account has been created for you on the LMS. Click below to set your password and get started:</p>
    <p><a href="{link}">Set your password</a></p>
    <p>This link expires in 7 days.</p>
    """
    _send_email(to_email, "You've been invited to the LMS", html)


def send_password_reset_email(to_email: str, name: str, token: str) -> None:
    link = f"{settings.frontend_url}/reset-password?token={token}"
    html = f"""
    <p>Hi {name},</p>
    <p>We received a request to reset your password. Click below to choose a new one:</p>
    <p><a href="{link}">Reset your password</a></p>
    <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    """
    _send_email(to_email, "Reset your LMS password", html)