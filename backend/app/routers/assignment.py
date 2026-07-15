from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.models.lesson import Lesson
from app.models.assignment import Assignment, AssignmentSubmission, SubmissionStatusEnum
from app.models.enrollment import Enrollment
from app.models.user import RoleEnum
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentSubmissionCreate,
    AssignmentSubmissionResponse,
    AssignmentGradeInput
)
from app.core.deps import get_current_user, require_admin
from app.services.progress import mark_lesson_progress_complete

router = APIRouter(tags=["Assignments"])


@router.post(
    "/lessons/{lesson_id}/assignment",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_assignment(
    lesson_id: UUID,
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    existing = db.query(Assignment).filter(
        Assignment.lesson_id == lesson_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment already exists for this lesson"
        )

    assignment = Assignment(
        lesson_id=lesson_id,
        title=payload.title,
        instructions=payload.instructions,
        due_date=payload.due_date,
        max_score=payload.max_score
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get(
    "/lessons/{lesson_id}/assignment",
    response_model=AssignmentResponse
)
def get_assignment(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    if current_user.role not in (RoleEnum.admin, RoleEnum.manager):
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == lesson.course_id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course"
            )

    assignment = db.query(Assignment).filter(
        Assignment.lesson_id == lesson_id
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assignment found for this lesson"
        )
    return assignment


@router.post(
    "/assignments/{assignment_id}/submit",
    response_model=AssignmentSubmissionResponse
)
def submit_assignment(
    assignment_id: UUID,
    payload: AssignmentSubmissionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    lesson = assignment.lesson
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == lesson.course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course"
        )

    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.user_id == current_user.id
    ).first()

    if submission:
        # Resubmission overwrites the previous attempt and clears any prior grade.
        submission.submission_text = payload.submission_text
        submission.file_url = payload.file_url
        submission.status = SubmissionStatusEnum.submitted
        submission.submitted_at = datetime.now(timezone.utc)
        submission.score = None
        submission.feedback = None
        submission.graded_at = None
        submission.graded_by = None
    else:
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            user_id=current_user.id,
            submission_text=payload.submission_text,
            file_url=payload.file_url
        )
        db.add(submission)

    db.commit()
    db.refresh(submission)

    # Submitting counts as "done" for progress purposes.
    # Grading (score/feedback) happens separately and doesn't block progress.
    mark_lesson_progress_complete(enrollment.id, lesson.id, db)

    return submission


@router.get(
    "/assignments/{assignment_id}/submissions/me",
    response_model=AssignmentSubmissionResponse
)
def get_my_submission(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.user_id == current_user.id
    ).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not submitted this assignment yet"
        )
    return submission


@router.get(
    "/assignments/{assignment_id}/submissions",
    response_model=List[AssignmentSubmissionResponse]
)
def list_submissions(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    return db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).order_by(AssignmentSubmission.submitted_at.desc()).all()


@router.patch(
    "/assignments/submissions/{submission_id}/grade",
    response_model=AssignmentSubmissionResponse
)
def grade_submission(
    submission_id: UUID,
    payload: AssignmentGradeInput,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    max_score = submission.assignment.max_score
    if payload.score > max_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Score cannot exceed max_score ({max_score})"
        )

    submission.score = payload.score
    submission.feedback = payload.feedback
    submission.status = SubmissionStatusEnum.graded
    submission.graded_at = datetime.now(timezone.utc)
    submission.graded_by = admin.id

    db.commit()
    db.refresh(submission)
    return submission