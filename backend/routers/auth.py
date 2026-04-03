from fastapi import APIRouter, Depends

from database.supabase_client import get_supabase
from models.schemas import UserProfile
from routers.dependencies import get_authenticated_user

router = APIRouter()


@router.get("/me", response_model=UserProfile)
def get_me(user: UserProfile = Depends(get_authenticated_user)) -> UserProfile:
    db = get_supabase()
    rows = db.table("profiles").select("*").eq("id", user.id).execute()
    if rows.data:
        profile = rows.data[0]
        return UserProfile(
            id=profile["id"],
            email=profile["email"],
            display_name=profile.get("display_name"),
            avatar_url=profile.get("avatar_url"),
        )
    # Fallback to basic info from JWT if profile row doesn't exist yet
    return user
