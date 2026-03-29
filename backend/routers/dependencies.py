from fastapi import Header, HTTPException


def get_owner_id(x_user_id: str = Header(default="")) -> str:
    """Extract and validate the X-User-ID header.

    Every request must carry a browser-local UUID that scopes all document
    operations to a single visitor. The frontend generates this UUID once per
    browser profile and stores it in localStorage — so incognito windows and
    new browsers each get a fresh identity automatically.
    """
    if not x_user_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Your session could not be identified. Please reload the page.",
        )
    return x_user_id
