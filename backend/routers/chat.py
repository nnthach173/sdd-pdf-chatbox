import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from database.supabase_client import get_supabase
from models.schemas import ChatMessageResponse, ChatRequest
from models.schemas import UserProfile
from routers.dependencies import get_user_or_guest
from services.embedding_service import embed_chunks
from services.rag_service import build_prompt, is_summary_question, retrieve_chunks, stream_response

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /chat/{document_id}  — SSE streaming endpoint
# ---------------------------------------------------------------------------


@router.post("/{document_id}")
async def chat(
    document_id: str,
    body: ChatRequest,
    user: UserProfile = Depends(get_user_or_guest),
) -> StreamingResponse:
    owner_id = user.id
    if not body.question.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": "empty_question", "message": "Question cannot be empty."},
        )

    db = get_supabase()

    # Verify document exists, is owned by the caller, and is ready
    rows = db.table("documents").select("status, owner_id").eq("id", document_id).execute()
    if not rows.data or rows.data[0]["owner_id"] != owner_id:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Document not found."},
        )
    if rows.data[0]["status"] != "ready":
        raise HTTPException(
            status_code=409,
            detail={
                "error": "document_not_ready",
                "message": "Document is still processing. Please wait until it is ready.",
            },
        )

    # Embed the question
    try:
        [question_embedding] = embed_chunks([body.question])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "chat_failed", "message": f"Embedding failed: {e}"},
        )

    # Retrieve more chunks for broad/summary questions
    top_k = 15 if is_summary_question(body.question) else 5
    chunks = retrieve_chunks(document_id, question_embedding, top_k=top_k)

    # Fetch last 6 messages for context
    history_rows = (
        db.table("chat_messages")
        .select("role, content")
        .eq("document_id", document_id)
        .order("created_at", desc=False)
        .limit(6)
        .execute()
    )
    history = history_rows.data or []

    messages = build_prompt(chunks, history, body.question)

    async def event_stream():
        full_response = []
        try:
            async for token in stream_response(messages):
                full_response.append(token)
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'content': ''})}\n\n"

            # Persist both turns after streaming completes
            assistant_content = "".join(full_response)
            db.table("chat_messages").insert([
                {"document_id": document_id, "role": "user", "content": body.question},
                {"document_id": document_id, "role": "assistant", "content": assistant_content},
            ]).execute()

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# GET /chat/{document_id}/history
# ---------------------------------------------------------------------------


@router.get("/{document_id}/history", response_model=list[ChatMessageResponse])
def get_chat_history(
    document_id: str,
    user: UserProfile = Depends(get_user_or_guest),
) -> list[ChatMessageResponse]:
    owner_id = user.id
    db = get_supabase()

    # Verify document belongs to the caller before returning its messages
    ownership = (
        db.table("documents").select("owner_id").eq("id", document_id).execute()
    )
    if not ownership.data or ownership.data[0]["owner_id"] != owner_id:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Document not found."},
        )

    rows = (
        db.table("chat_messages")
        .select("id, role, content, created_at")
        .eq("document_id", document_id)
        .order("created_at", desc=False)
        .execute()
    )
    return [ChatMessageResponse(**r) for r in rows.data]
