from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserProfile(BaseModel):
    """Authenticated user profile returned by GET /auth/me."""

    id: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_guest: bool = False


class DocumentResponse(BaseModel):
    """Returned after a successful upload (status = processing)."""

    id: str
    name: str
    file_size: int
    status: str
    created_at: datetime


class DocumentListItem(BaseModel):
    """Returned in GET /documents list."""

    id: str
    name: str
    file_size: int
    page_count: Optional[int]
    status: str
    created_at: datetime


class DocumentDetail(DocumentListItem):
    """Returned in GET /documents/{id} — includes error_msg for polling."""

    error_msg: Optional[str]
    signed_url: Optional[str] = None


class ChatRequest(BaseModel):
    question: str


class ChatMessageResponse(BaseModel):
    """A single message turn in the persistent chat history."""

    id: str
    role: str
    content: str
    created_at: datetime
