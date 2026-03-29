// Typed wrappers around all backend API endpoints.
// Base URL is injected from the environment so the same code works
// in local dev (localhost:8000) and production (Render URL).

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Visitor identity
// ---------------------------------------------------------------------------

// Each browser profile gets a stable UUID stored in localStorage so that
// documents uploaded in one browser (or tab) are invisible to others.
// localStorage is intentional: unlike sessionStorage it survives tab closes
// and browser restarts, giving users their files back when they return.
// Incognito windows and new browsers start with empty localStorage, so a
// fresh UUID is generated there — giving a clean slate automatically.
//
// Lazy initialization: getUserId() is only called inside fetch functions, which
// always run in the browser — avoiding the "localStorage is not defined" error
// that occurs when Next.js pre-renders this module on the server.
let _userId: string | null = null;

function getUserId(): string {
  if (!_userId) {
    const STORAGE_KEY = 'pdf-chatbox-user-id';
    // null is returned when the key is absent (incognito, new browser, cleared storage)
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    _userId = id;
  }
  return _userId;
}

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { 'X-User-ID': getUserId() },
    body: form,
  });
  return handleResponse<DocumentResponse>(res);
}

export async function listDocuments(): Promise<DocumentListItem[]> {
  const res = await fetch(`${BASE_URL}/documents`, {
    headers: { 'X-User-ID': getUserId() },
  });
  return handleResponse<DocumentListItem[]>(res);
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`${BASE_URL}/documents/${id}`, {
    headers: { 'X-User-ID': getUserId() },
  });
  return handleResponse<DocumentDetail>(res);
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: { 'X-User-ID': getUserId() },
  });
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
  const res = await fetch(`${BASE_URL}/chat/${documentId}/history`, {
    headers: { 'X-User-ID': getUserId() },
  });
  return handleResponse<ChatMessage[]>(res);
}

// Returns the raw Response so the caller can consume it as a ReadableStream.
export async function streamChat(
  documentId: string,
  question: string
): Promise<Response> {
  const res = await fetch(`${BASE_URL}/chat/${documentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-ID': getUserId() },
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
