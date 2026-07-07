from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.models.lesson import Lesson
from app.schemas.quiz import (
    QuizCreate,
    QuizResponse,
    QuizAttemptCreate,
    QuizAttemptResponse
)
from app.core.deps import get_current_user, require_admin

router = APIRouter(tags=["Quizzes"])


@router.post(
    "/lessons/{lesson_id}/quiz",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED
)
def create_quiz(
    lesson_id: UUID,
    payload: QuizCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    existing_quiz = db.query(Quiz).filter(
        Quiz.lesson_id == lesson_id
    ).first()
    if existing_quiz:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz already exists for this lesson"
        )

    quiz = Quiz(
        lesson_id=lesson_id,
        title=payload.title,
        passing_score=payload.passing_score
    )
    db.add(quiz)
    db.flush()

    for q in payload.questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question=q.question,
            options=q.options,
            correct_option=q.correct_option
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)
    return quiz


@router.get(
    "/lessons/{lesson_id}/quiz",
    response_model=QuizResponse
)
def get_quiz(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(
        Quiz.lesson_id == lesson_id
    ).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz found for this lesson"
        )
    # correct_option is stripped by QuizQuestionResponse schema
    return quiz


@router.post(
    "/quizzes/{quiz_id}/attempt",
    response_model=QuizAttemptResponse
)
def submit_quiz_attempt(
    quiz_id: UUID,
    payload: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    questions = db.query(QuizQuestion).filter(
        QuizQuestion.quiz_id == quiz_id
    ).all()

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions"
        )

    # score entirely on server side
    # never trust client to calculate score
    correct_count = 0
    for question in questions:
        submitted_answer = payload.answers.get(str(question.id))
        if submitted_answer is not None:
            if submitted_answer == question.correct_option:
                correct_count += 1

    score = int((correct_count / len(questions)) * 100)
    passed = score >= quiz.passing_score

    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=score,
        passed=passed
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt