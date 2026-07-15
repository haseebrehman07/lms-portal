from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from typing import Optional, List
from app.database import get_db
from app.models.course import Course, CourseTypeEnum
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.user import User, RoleEnum
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.core.deps import require_admin, get_current_user, get_optional_user

router = APIRouter(prefix="/courses", tags=["Courses"])


def _is_staff(user: Optional[User]) -> bool:
    return user is not None and user.role in (RoleEnum.admin, RoleEnum.manager)


@router.get("", response_model=List[CourseResponse])
def get_courses(
    search: Optional[str] = Query(None, max_length=100),
    category_id: Optional[UUID] = Query(None),
    type: Optional[CourseTypeEnum] = Query(None),
    is_published: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
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

    if _is_staff(current_user):
        # Admins/managers may explicitly filter by published state,
        # or see everything (including drafts) if they don't specify.
        if is_published is not None:
            query = query.filter(Course.is_published == is_published)
    else:
        # Everyone else only ever sees published courses,
        # regardless of what they pass in the query string.
        query = query.filter(Course.is_published == True)  # noqa

    return query.order_by(
        Course.created_at.desc()
    ).offset(skip).limit(limit).all()


# IMPORTANT: /search and /detail must be
# BEFORE /{course_id} otherwise FastAPI
# treats "search" and "detail" as a course_id
@router.get("/search", response_model=List[CourseResponse])
def search_courses(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db)
):
    search_term = f"%{q.strip()}%"
    return db.query(Course).filter(
        Course.is_published == True,  # noqa
        or_(
            Course.title.ilike(search_term),
            Course.description.ilike(search_term)
        )
    ).limit(10).all()


@router.get("/{course_id}/detail")
def get_course_detail(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()

    # Draft courses are only visible to staff or a learner already
    # enrolled (e.g. was enrolled before it was unpublished/archived).
    if not course.is_published and not _is_staff(current_user) and not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).order_by(Lesson.order_index).all()

    lesson_progress_map = {}
    if enrollment:
        progresses = db.query(LessonProgress).filter(
            LessonProgress.enrollment_id == enrollment.id
        ).all()
        lesson_progress_map = {
            str(p.lesson_id): p for p in progresses
        }

    can_see_full_content = enrollment is not None or _is_staff(current_user)

    def lesson_payload(lesson):
        progress = lesson_progress_map.get(str(lesson.id))
        # Enrolled users and staff see everything. Everyone else only
        # gets the actual content (video/pdf/text) if this specific
        # lesson is marked as a free preview - otherwise it's locked,
        # though the title/type/order still show so they can see the
        # syllabus before enrolling.
        unlocked = can_see_full_content or lesson.is_free_preview

        return {
            "id": str(lesson.id),
            "title": lesson.title,
            "lesson_type": lesson.lesson_type.value,
            "order_index": lesson.order_index,
            "duration_seconds": lesson.duration_seconds,
            "video_url": lesson.video_url if unlocked else None,
            "pdf_url": lesson.pdf_url if unlocked else None,
            "content": lesson.content if unlocked else None,
            "is_free_preview": lesson.is_free_preview,
            "is_locked": not unlocked,
            "is_completed": progress.is_completed if progress else False,
            "time_spent_seconds": progress.time_spent_seconds if progress else 0
        }

    return {
        "id": str(course.id),
        "title": course.title,
        "description": course.description,
        "thumbnail_url": course.thumbnail_url,
        "instructor_name": course.instructor_name,
        "type": course.type.value if course.type else None,
        "total_lessons": course.total_lessons,
        "is_published": course.is_published,
        "is_enrolled": enrollment is not None,
        "progress_percent": enrollment.progress_percent if enrollment else 0,
        "enrollment_status": (
            enrollment.status.value if enrollment else "not_enrolled"
        ),
        "lessons": [lesson_payload(lesson) for lesson in lessons]
    }


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    if not course.is_published and not _is_staff(current_user):
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