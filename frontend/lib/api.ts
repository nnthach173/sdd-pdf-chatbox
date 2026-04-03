// Typed wrappers around all backend API endpoints.
// Base URL is injected from the environment so the same code works
// in local dev (localhost:8000) and production (Render URL).

import { createClient } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Guest identity constants
// ---------------------------------------------------------------------------

export const GUEST_ID_KEY = 'guest-uuid';
export const GUEST_MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

async function requestHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return { 'X-Guest-ID': getGuestId() };
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
  if (res.status === 401) {
    // Only redirect if we had an active session (session expired).
    // Guests get a plain error — no redirect.
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = '/auth';
    }
    throw new Error('Session expired. Please sign in again.');
  }
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
  const headers = await requestHeaders();
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers,
    body: form,
  });
  return handleResponse<DocumentResponse>(res);
}

export async function listDocuments(): Promise<DocumentListItem[]> {
  const headers = await requestHeaders();
  const res = await fetch(`${BASE_URL}/documents`, { headers });
  return handleResponse<DocumentListItem[]>(res);
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const headers = await requestHeaders();
  const res = await fetch(`${BASE_URL}/documents/${id}`, { headers });
  return handleResponse<DocumentDetail>(res);
}

export async function deleteDocument(id: string): Promise<void> {
  const headers = await requestHeaders();
  const res = await fetch(`${BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (res.status === 401) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = '/auth';
    }
    throw new Error('Session expired. Please sign in again.');
  }
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
  const headers = await requestHeaders();
  const res = await fetch(`${BASE_URL}/chat/${documentId}/history`, { headers });
  return handleResponse<ChatMessage[]>(res);
}

// Returns the raw Response so the caller can consume it as a ReadableStream.
export async function streamChat(
  documentId: string,
  question: string
): Promise<Response> {
  const headers = await requestHeaders();
  const res = await fetch(`${BASE_URL}/chat/${documentId}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (res.status === 401) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = '/auth';
    }
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      error: 'unknown',
      message: res.statusText,
    }));
    throw new Error(body.message ?? body.error);
  }
  return res;
}
