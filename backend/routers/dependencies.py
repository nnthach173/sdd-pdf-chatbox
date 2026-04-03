import uuid as _uuid

from fastapi import Header, HTTPException

from database.supabase_client import get_supabase
from models.schemas import UserProfile


def get_user_or_guest(
    authorization: str = Header(default=""),
    x_guest_id: str = Header(default=""),
) -> UserProfile:
    """Return an authenticated UserProfile or a guest UserProfile.

    Tries Bearer JWT first; falls back to X-Guest-ID header (a browser-local UUID).
    Raises 401 if neither header is present or valid.
    """
    if authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        if token:
            db = get_supabase()
            try:
                result = db.auth.get_user(token)
                user = result.user
            except Exception:
                raise HTTPException(
                    status_code=401,
                    detail={"error": "unauthorized", "message": "Please sign in to continue."},
                )
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail={"error": "unauthorized", "message": "Please sign in to continue."},
                )
            return UserProfile(
                id=str(user.id),
                email=user.email or "",
                display_name=user.user_metadata.get("full_name") or user.user_metadata.get("name"),
                avatar_url=user.user_metadata.get("avatar_url"),
                is_guest=False,
            )

    if x_guest_id:
        try:
            _uuid.UUID(x_guest_id)
        except ValueError:
            raise HTTPException(
                status_code=401,
                detail={"error": "unauthorized", "message": "Invalid guest identity."},
            )
        return UserProfile(
            id=x_guest_id,
            email="",
            is_guest=True,
        )

    raise HTTPException(
        status_code=401,
        detail={"error": "unauthorized", "message": "Please sign in to continue."},
    )


def get_authenticated_user(authorization: str = Header(default="")) -> UserProfile:
    """Verify the Supabase JWT and return the authenticated user.

    Expects an Authorization header of the form: Bearer <access-token>.
    Validates the token via Supabase's auth.get_user() which also catches
    revoked tokens.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Please sign in to continue."},
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Please sign in to continue."},
        )

    db = get_supabase()
    try:
        result = db.auth.get_user(token)
        user = result.user
    except Exception:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Please sign in to continue."},
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Please sign in to continue."},
        )

    return UserProfile(
        id=str(user.id),
        email=user.email or "",
        display_name=user.user_metadata.get("full_name") or user.user_metadata.get("name"),
        avatar_url=user.user_metadata.get("avatar_url"),
    )
