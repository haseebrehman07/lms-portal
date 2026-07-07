import uuid
import logging
from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.core.security import hash_password
from app.config import settings

logger = logging.getLogger(__name__)


def create_first_admin(db: Session) -> None:
    try:
        existing_admin = db.query(User).filter(
            User.role == RoleEnum.admin
        ).first()

        if existing_admin:
            logger.info(
                f"Admin already exists: {existing_admin.email}"
            )
            return

        if not settings.first_admin_email or not settings.first_admin_password:
            logger.warning(
                "No admin exists. Set FIRST_ADMIN_EMAIL and "
                "FIRST_ADMIN_PASSWORD in .env"
            )
            return

        admin = User(
            id=uuid.uuid4(),
            name=settings.first_admin_name,
            email=settings.first_admin_email.lower().strip(),
            password_hash=hash_password(settings.first_admin_password),
            role=RoleEnum.admin,
            is_active=True
        )
        db.add(admin)
        db.commit()
        logger.info(f"First admin created: {settings.first_admin_email}")

    except Exception as e:
        logger.error(f"Error creating first admin: {e}")
        db.rollback()