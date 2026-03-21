import io
import uuid

import pypdf
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile
from fastapi.responses import Response

from database.supabase_client import get_supabase
from models.schemas import DocumentDetail, DocumentListItem, DocumentResponse
from services.embedding_service import embed_chunks
from services.pdf_service import ScannedPDFError, chunk_text, extract_text

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


# ---------------------------------------------------------------------------
# Background processing pipeline
# ---------------------------------------------------------------------------


def _process_document(document_id: str, file_bytes: bytes) -> None:
    """Extract, chunk, embed, and store document content.

    Runs as a FastAPI BackgroundTask so the upload response is returned
    immediately while the heavy work happens asynchronously.
    """
    db = get_supabase()
    try:
        # 1. Extract text and count pages
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        page_count = len(reader.pages)
        text = extract_text(file_bytes)

        # 2. Split into chunks
        chunks = chunk_text(text)

        # 3. Embed all chunks in a single API call
        vectors = embed_chunks(chunks)

        # 4. Insert chunks into the database
        rows = [
            {
                "document_id": document_id,
                "content": chunk,
                "embedding": vector,
                "chunk_index": idx,
            }
            for idx, (chunk, vector) in enumerate(zip(chunks, vectors))
        ]
        db.table("document_chunks").insert(rows).execute()

        # 5. Mark document as ready
        db.table("documents").update(
            {"status": "ready", "page_count": page_count}
        ).eq("id", document_id).execute()

    except ScannedPDFError as e:
        db.table("documents").update(
            {"status": "failed", "error_msg": str(e)}
        ).eq("id", document_id).execute()
    except Exception as e:
        db.table("documents").update(
            {"status": "failed", "error_msg": f"Processing error: {e}"}
        ).eq("id", document_id).execute()


# ---------------------------------------------------------------------------
# POST /documents/upload
# ---------------------------------------------------------------------------


@router.post("/upload", response_model=DocumentResponse, status_code=200)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
) -> DocumentResponse:
    # Validate file type
    if file.content_type != "application/pdf" and not (
        file.filename or ""
    ).lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_file_type", "message": "Only PDF files are supported. Please upload a .pdf file."},
        )

    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"error": "file_too_large", "message": "File exceeds the 50 MB limit."},
        )

    # Re-check MIME by reading the PDF header
    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_file_type", "message": "Only PDF files are supported. Please upload a .pdf file."},
        )

    db = get_supabase()
    doc_id = str(uuid.uuid4())
    storage_path = f"{doc_id}/{file.filename}"

    # Upload to Supabase Storage (bucket: pdfs)
    print(f"DEBUG: uploading {file.filename} ({len(file_bytes)} bytes) to storage path {storage_path}")
    try:
        db.storage.from_("pdfs").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf"},
        )
    except Exception as e:
        print(f"DEBUG storage error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "upload_failed", "message": f"Could not store the file: {e}"},
        )

    print("DEBUG: storage upload ok, inserting DB record")
    # Create the database record
    row = db.table("documents").insert(
        {
            "id": doc_id,
            "name": file.filename,
            "file_path": storage_path,
            "file_size": len(file_bytes),
            "status": "processing",
        }
    ).execute()

    doc = row.data[0]

    # Kick off background processing
    background_tasks.add_task(_process_document, doc_id, file_bytes)

    return DocumentResponse(**doc)


# ---------------------------------------------------------------------------
# GET /documents
# ---------------------------------------------------------------------------


@router.get("", response_model=list[DocumentListItem])
def list_documents() -> list[DocumentListItem]:
    db = get_supabase()
    rows = (
        db.table("documents")
        .select("id, name, file_size, page_count, status, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return [DocumentListItem(**r) for r in rows.data]


# ---------------------------------------------------------------------------
# GET /documents/{id}
# ---------------------------------------------------------------------------


@router.get("/{doc_id}", response_model=DocumentDetail)
def get_document(doc_id: str) -> DocumentDetail:
    db = get_supabase()
    rows = (
        db.table("documents")
        .select("*")
        .eq("id", doc_id)
        .execute()
    )
    if not rows.data:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Document not found."},
        )
    return DocumentDetail(**rows.data[0])


# ---------------------------------------------------------------------------
# DELETE /documents/{id}
# ---------------------------------------------------------------------------


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: str) -> Response:
    db = get_supabase()

    # Confirm document exists first
    rows = db.table("documents").select("file_path").eq("id", doc_id).execute()
    if not rows.data:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Document not found."},
        )

    file_path = rows.data[0]["file_path"]

    try:
        # Remove from storage (best-effort — don't fail the delete if missing)
        db.storage.from_("pdfs").remove([file_path])
    except Exception:
        pass

    try:
        # Cascade in DB removes document_chunks and chat_messages automatically
        db.table("documents").delete().eq("id", doc_id).execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "delete_failed", "message": f"Could not delete document: {e}"},
        )

    return Response(status_code=204)
