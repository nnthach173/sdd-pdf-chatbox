import os
from collections.abc import AsyncIterator

from openai import AsyncOpenAI

from database.supabase_client import get_supabase

_async_client: AsyncOpenAI | None = None


def _get_async_client() -> AsyncOpenAI:
    global _async_client
    if _async_client is None:
        _async_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _async_client


_SUMMARY_KEYWORDS = {
    # English
    "summarize", "summary", "overview", "outline", "brief", "recap", "describe the pdf",
    "what is this document", "what does this document", "what is the document about",
    "what is this pdf", "what is the pdf about",
    # Vietnamese
    "tóm tắt", "tổng quan", "mô tả", "giới thiệu",
}


def is_summary_question(question: str) -> bool:
    """Return True if the question is asking for a broad summary rather than a specific fact."""
    q = question.lower()
    return any(kw in q for kw in _SUMMARY_KEYWORDS)


def retrieve_chunks(
    document_id: str,
    question_embedding: list[float],
    top_k: int = 5,
) -> list[str]:
    """Return the top-k chunks most similar to the question using cosine distance.

    pgvector's `<=>` operator returns cosine distance; ordering by it ASC gives
    the most semantically similar chunks first.
    """
    db = get_supabase()
    # Use the rpc function for vector similarity search
    result = db.rpc(
        "match_document_chunks",
        {
            "query_embedding": question_embedding,
            "match_document_id": document_id,
            "match_count": top_k,
        },
    ).execute()
    return [row["content"] for row in result.data]


def build_prompt(
    chunks: list[str],
    history: list[dict],
    question: str,
) -> list[dict]:
    """Build the message list to send to the LLM.

    System prompt enforces document-grounded answers (Principle III).
    We include the last 6 messages (3 conversation turns) for context.
    """
    context_block = "\n\n---\n\n".join(chunks) if chunks else "No relevant content found."

    system = (
        "You are a helpful assistant that answers questions strictly based on the "
        "provided document excerpts. If the answer cannot be found in the excerpts, "
        "say so clearly — do not draw on outside knowledge.\n\n"
        f"Document excerpts:\n{context_block}"
    )

    messages: list[dict] = [{"role": "system", "content": system}]

    # Include the last 6 messages (3 turns) for continuity
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": question})
    return messages


async def stream_response(messages: list[dict]) -> AsyncIterator[str]:
    """Stream tokens from gpt-4o-mini one by one."""
    client = _get_async_client()
    stream = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,  # type: ignore[arg-type]
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
