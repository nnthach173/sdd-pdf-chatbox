import os

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """Embed a list of text chunks using OpenAI text-embedding-3-small.

    Returns a list of 1536-dimensional vectors in the same order as input.
    All chunks are sent in a single API call to minimise latency and cost.
    """
    response = _get_client().embeddings.create(
        model="text-embedding-3-small",
        input=chunks,
    )
    # Sort by index to guarantee order matches the input list.
    sorted_data = sorted(response.data, key=lambda d: d.index)
    return [item.embedding for item in sorted_data]
