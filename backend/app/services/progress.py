from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.enrollment import Enrollment, LessonProgress, EnrollmentStatusEnum
from app.models.lesson import Lesson
from app.models.certificate import Certificate


def recalculate_progress(enrollment_id, db: Session):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id
    ).first()
    if not enrollment:
        return

    total_lessons = db.query(Lesson).filter(
        Lesson.course_id == enrollment.course_id
    ).count()

    if total_lessons == 0:
        return

    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment_id,
        LessonProgress.is_completed == True  # noqa
    ).count()

    progress = (completed_lessons / total_lessons) * 100
    enrollment.progress_percent = round(progress, 1)

    if completed_lessons == total_lessons:
        enrollment.status = EnrollmentStatusEnum.completed
        enrollment.completed_at = datetime.now(timezone.utc)

        existing_cert = db.query(Certificate).filter(
            Certificate.user_id == enrollment.user_id,
            Certificate.course_id == enrollment.course_id
        ).first()

        if not existing_cert:
            certificate = Certificate(
                user_id=enrollment.user_id,
                course_id=enrollment.course_id
            )
            db.add(certificate)

    elif completed_lessons > 0:
        enrollment.status = EnrollmentStatusEnum.in_progress
    else:
        enrollment.status = EnrollmentStatusEnum.not_started

    db.commit()


def mark_lesson_progress_complete(enrollment_id, lesson_id, db: Session) -> LessonProgress:
    """
    Marks a lesson complete for an enrollment (idempotent - safe to call
    more than once) and recalculates course progress if this is a new
    completion. Used by both direct lesson completion and quiz-passing.
    """
    progress = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment_id,
        LessonProgress.lesson_id == lesson_id
    ).first()

    if not progress:
        progress = LessonProgress(
            enrollment_id=enrollment_id,
            lesson_id=lesson_id
        )
        db.add(progress)

    if not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.now(timezone.utc)
        db.commit()
        recalculate_progress(enrollment_id, db)

    return progress