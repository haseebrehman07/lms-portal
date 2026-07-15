import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.core.storage import (
    upload_video,
    upload_thumbnail,
    upload_pdf,
    upload_assignment_file,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_PDF_TYPES,
    ALLOWED_ASSIGNMENT_TYPES,
    MAX_VIDEO_SIZE,
    MAX_IMAGE_SIZE,
    MAX_PDF_SIZE,
    MAX_ASSIGNMENT_SIZE
)
from app.core.deps import require_admin, get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])
logger = logging.getLogger(__name__)


@router.post("/video")
async def upload_video_file(
    file: UploadFile = File(...),
    admin=Depends(require_admin)
):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: MP4, WebM, OGG, MOV"
        )

    content = await file.read()

    if len(content) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video must be under 500MB"
        )

    try:
        url = upload_video(content, file.filename)
        return {
            "url": url,
            "filename": file.filename,
            "size_mb": round(len(content) / 1024 / 1024, 2),
            "type": "video"
        }
    except Exception as e:
        logger.error(f"Video upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/thumbnail")
async def upload_thumbnail_file(
    file: UploadFile = File(...),
    admin=Depends(require_admin)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: JPEG, PNG, WebP"
        )

    content = await file.read()

    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be under 5MB"
        )

    try:
        url = upload_thumbnail(content, file.filename)
        return {
            "url": url,
            "filename": file.filename,
            "size_mb": round(len(content) / 1024 / 1024, 2),
            "type": "thumbnail"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/pdf")
async def upload_pdf_file(
    file: UploadFile = File(...),
    admin=Depends(require_admin)
):
    if file.content_type not in ALLOWED_PDF_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files allowed"
        )

    content = await file.read()

    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF must be under 50MB"
        )

    try:
        url = upload_pdf(content, file.filename)
        return {
            "url": url,
            "filename": file.filename,
            "size_mb": round(len(content) / 1024 / 1024, 2),
            "type": "pdf"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/assignment")
async def upload_assignment_file_endpoint(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    if file.content_type not in ALLOWED_ASSIGNMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allowed types: PDF, Word, ZIP, Text"
        )

    content = await file.read()

    if len(content) > MAX_ASSIGNMENT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be under 100MB"
        )

    try:
        url = upload_assignment_file(
            content,
            file.filename,
            file.content_type
        )
        return {
            "url": url,
            "filename": file.filename,
            "size_mb": round(len(content) / 1024 / 1024, 2),
            "type": "assignment"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )