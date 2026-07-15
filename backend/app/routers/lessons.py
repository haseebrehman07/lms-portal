from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.lesson import Lesson
from app.models.Module import Module
from app.models.course import Course
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.core.deps import require_admin

router = APIRouter(tags=["Lessons"])


def update_course_lesson_count(course_id: UUID, db: Session):
    count = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).count()
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        course.total_lessons = count
        db.commit()


@router.get(
    "/courses/{course_id}/lessons",
    response_model=List[LessonResponse]
)
def get_lessons(
    course_id: UUID,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).order_by(Lesson.order_index).all()


@router.post(
    "/courses/{course_id}/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED
)
def create_lesson(
    course_id: UUID,
    payload: LessonCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    module = db.query(Module).filter(
        Module.id == payload.module_id,
        Module.course_id == course_id
    ).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="module_id does not belong to this course"
        )

    lesson = Lesson(
        **payload.model_dump(),
        course_id=course_id
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    update_course_lesson_count(course_id, db)
    return lesson


@router.patch(
    "/lessons/{lesson_id}",
    response_model=LessonResponse
)
def update_lesson(
    lesson_id: UUID,
    payload: LessonUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "module_id" in update_data:
        module = db.query(Module).filter(
            Module.id == update_data["module_id"],
            Module.course_id == lesson.course_id
        ).first()
        if not module:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="module_id does not belong to this lesson's course"
            )

    for field, value in update_data.items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete(
    "/lessons/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_lesson(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    course_id = lesson.course_id
    db.delete(lesson)
    db.commit()
    update_course_lesson_count(course_id, db)