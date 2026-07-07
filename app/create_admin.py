import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User, RoleEnum
from app.core.security import hash_password
import uuid


def create_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(
            User.email == "rabiyahumayon@gmail.com"
        ).first()

        if existing:
            print("Admin already exists")
            print(f"Email: {existing.email}")
            print(f"Role: {existing.role}")
            return

        admin = User(
            id=uuid.uuid4(),
            name="Admin User",
            email="rabiyahumayon@gmail.com",
            password_hash=hash_password("83645200"),
            role=RoleEnum.admin,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("✅ Admin created successfully")
        print("Email: admin@hrlms.com")
        print("Password: Admin@123456")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()