from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from typing import Optional, List
from app.database import get_db
from app.models.course import Course, CourseTypeEnum
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.core.deps import require_admin

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=List[CourseResponse])
def get_courses(
    search: Optional[str] = Query(None, max_length=100),
    category_id: Optional[UUID] = Query(None),
    type: Optional[CourseTypeEnum] = Query(None),
    is_published: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Course)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Course.title.ilike(search_term),
                Course.description.ilike(search_term)
            )
        )
    if category_id:
        query = query.filter(Course.category_id == category_id)
    if type:
        query = query.filter(Course.type == type)
    if is_published is not None:
        query = query.filter(Course.is_published == is_published)

    return query.order_by(
        Course.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: UUID,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = Course(
        **payload.model_dump(),
        created_by=admin.id
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: UUID,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.delete(
    "/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_course(
    course_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    db.delete(course)
    db.commit()


@router.post("/{course_id}/publish", response_model=CourseResponse)
def publish_course(
    course_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    if course.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course is already published"
        )
    course.is_published = True
    db.commit()
    db.refresh(course)
    return course