// Typed wrappers around all backend API endpoints.
// Base URL is injected from the environment so the same code works
// in local dev (localhost:8000) and production (Render URL).

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface DocumentResponse {
  id: string;
  name: string;
  file_size: number;
  status: string;
  created_at: string;
}

export interface DocumentListItem {
  id: string;
  name: string;
  file_size: number;
  page_count: number | null;
  status: string;
  created_at: string;
}

export interface DocumentDetail extends DocumentListItem {
  error_msg: string | null;
  signed_url: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ApiError {
  error: string;
  message: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      error: 'unknown',
      message: res.statusText,
    }));
    throw new Error(body.message ?? body.error);
  }
  return res.json() as Promise<T>;
}

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    body: form,
  });
  return handleResponse<DocumentResponse>(res);
}

export async function listDocuments(): Promise<DocumentListItem[]> {
  const res = await fetch(`${BASE_URL}/documents`);
  return handleResponse<DocumentListItem[]>(res);
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`${BASE_URL}/documents/${id}`);
  return handleResponse<DocumentDetail>(res);
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      error: 'unknown',
      message: res.statusText,
    }));
    throw new Error(body.message ?? body.error);
  }
}

export async function getChatHistory(
  documentId: string
): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE_URL}/chat/${documentId}/history`);
  return handleResponse<ChatMessage[]>(res);
}

// Returns the raw Response so the caller can consume it as a ReadableStream.
export async function streamChat(
  documentId: string,
  question: string
): Promise<Response> {
  const res = await fetch(`${BASE_URL}/chat/${documentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      error: 'unknown',
      message: res.statusText,
    }));
    throw new Error(body.message ?? body.error);
  }
  return res;
}
