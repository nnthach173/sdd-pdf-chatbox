import io

import pypdf
from langchain_text_splitters import RecursiveCharacterTextSplitter


class ScannedPDFError(Exception):
    """Raised when a PDF contains no extractable text (likely a scanned image)."""


def extract_text(file_bytes: bytes) -> str:
    """Extract all text from a PDF given its raw bytes.

    Raises ScannedPDFError if the PDF yields no text — this usually means
    it is a scanned document without an embedded text layer.
    """
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages_text = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages_text).strip()
    if not text:
        raise ScannedPDFError(
            "No text could be extracted from this PDF. "
            "Scanned PDFs without a text layer are not supported."
        )
    return text


def chunk_text(text: str) -> list[str]:
    """Split text into ~500-token chunks with 50-token overlap.

    Uses tiktoken-aware splitting so token counts are accurate for the
    OpenAI embedding model (cl100k_base tokenizer).
    """
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        model_name="text-embedding-3-small",
        chunk_size=500,
        chunk_overlap=50,
    )
    return splitter.split_text(text)
