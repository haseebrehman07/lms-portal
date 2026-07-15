from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.Module import Module
from app.models.course import Course
from app.schemas.Module import ModuleCreate, ModuleUpdate, ModuleResponse, ModuleWithLessonsResponse
from app.core.deps import require_admin

router = APIRouter(tags=["Modules"])


@router.get(
    "/courses/{course_id}/modules",
    response_model=List[ModuleWithLessonsResponse]
)
def get_modules(
    course_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Returns every module (week) in a course, each with its lessons
    nested inside, ordered correctly. This is what the course builder
    should load on open to populate the curriculum.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .options(joinedload(Module.lessons))
        .order_by(Module.order_index)
        .all()
    )


@router.post(
    "/courses/{course_id}/modules",
    response_model=ModuleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_module(
    course_id: UUID,
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    module = Module(
        course_id=course_id,
        title=payload.title,
        order_index=payload.order_index
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.patch(
    "/modules/{module_id}",
    response_model=ModuleResponse
)
def update_module(
    module_id: UUID,
    payload: ModuleUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)
    db.commit()
    db.refresh(module)
    return module


@router.delete(
    "/modules/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_module(
    module_id: UUID,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Deletes the module AND every lesson inside it (cascade)."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    db.delete(module)
    db.commit()