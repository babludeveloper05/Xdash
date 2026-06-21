"""Notes CRUD router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
import uuid

from database import get_db
from models import Note, User
from schemas import NoteCreate, NoteUpdate, NoteOut
from routers.auth import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
def list_notes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.execute(select(Note).where(Note.user_id == user.id).order_by(Note.updated_at.desc())).scalars().all()


@router.post("", response_model=NoteOut)
def create_note(body: NoteCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = Note(user_id=user.id, **body.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: str, body: NoteUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.execute(select(Note).where(Note.id == note_id, Note.user_id == user.id)).scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(note, key, val)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
def delete_note(note_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.execute(select(Note).where(Note.id == note_id, Note.user_id == user.id)).scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"ok": True}
