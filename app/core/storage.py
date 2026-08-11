import boto3
import uuid
import logging
from botocore.exceptions import ClientError
from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo"
]

ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
]

ALLOWED_PDF_TYPES = [
    "application/pdf"
]

ALLOWED_ASSIGNMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "text/plain"
]

ALLOWED_RECEIPT_TYPES = ALLOWED_IMAGE_TYPES + ["application/pdf"]

MAX_VIDEO_SIZE = 500 * 1024 * 1024      # 500MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024        # 5MB
MAX_PDF_SIZE = 50 * 1024 * 1024         # 50MB
MAX_ASSIGNMENT_SIZE = 100 * 1024 * 1024 # 100MB
MAX_RECEIPT_SIZE = 10 * 1024 * 1024     # 10MB


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key,
        aws_secret_access_key=settings.r2_secret_key,
        region_name="auto"
    )


def is_r2_configured() -> bool:
    return bool(
        settings.r2_account_id
        and settings.r2_access_key
        and settings.r2_secret_key
        and settings.r2_bucket_name
    )


def upload_to_r2(
    file_content: bytes,
    folder: str,
    original_filename: str,
    content_type: str
) -> str:
    if not is_r2_configured():
        raise Exception(
            "File storage not configured. "
            "Please add R2 credentials to .env"
        )

    try:
        client = get_r2_client()
        extension = (
            original_filename.rsplit(".", 1)[-1].lower()
            if "." in original_filename else "bin"
        )
        unique_key = f"{folder}/{uuid.uuid4()}.{extension}"

        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=unique_key,
            Body=file_content,
            ContentType=content_type
        )

        public_url = f"{settings.r2_public_url}/{unique_key}"
        logger.info(f"Uploaded file to R2: {unique_key}")
        return public_url

    except ClientError as e:
        logger.error(f"R2 upload failed: {e}")
        raise Exception("File upload failed. Please try again.") from e


def upload_video(file_content: bytes, filename: str, content_type: str) -> str:
    return upload_to_r2(file_content, "videos", filename, content_type)


def upload_thumbnail(file_content: bytes, filename: str, content_type: str) -> str:
    return upload_to_r2(file_content, "thumbnails", filename, content_type)


def upload_pdf(file_content: bytes, filename: str) -> str:
    return upload_to_r2(file_content, "pdfs", filename, "application/pdf")


def upload_assignment_file(
    file_content: bytes,
    filename: str,
    content_type: str
) -> str:
    return upload_to_r2(file_content, "assignments", filename, content_type)


def upload_fee_receipt(
    file_content: bytes,
    filename: str,
    content_type: str
) -> str:
    return upload_to_r2(file_content, "fee_receipts", filename, content_type)


def upload_certificate_pdf(
    file_content: bytes,
    user_id: str,
    course_id: str
) -> str:
    if not is_r2_configured():
        raise Exception("File storage not configured.")

    try:
        client = get_r2_client()
        # Deterministic key (not a random UUID) - re-generating a
        # certificate for the same user+course overwrites the same
        # object instead of creating duplicates.
        key = f"certificates/{user_id}/{course_id}.pdf"

        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=file_content,
            ContentType="application/pdf"
        )

        return f"{settings.r2_public_url}/{key}"

    except ClientError as e:
        logger.error(f"Certificate upload failed: {e}")
        raise Exception("Certificate upload failed.") from e