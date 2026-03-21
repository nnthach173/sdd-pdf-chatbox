'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getChatHistory, getDocument, type ChatMessage, type DocumentDetail } from '@/lib/api';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [docData, msgs] = await Promise.all([
          getDocument(documentId),
          getChatHistory(documentId),
        ]);
        setDoc(docData);
        setHistory(msgs);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load document.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">{error ?? 'Document not found.'}</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push('/')}
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{doc.name}</h1>
          {doc.page_count != null && (
            <p className="text-xs text-muted-foreground">{doc.page_count} pages</p>
          )}
        </div>
      </header>

      {/* Chat area */}
      <ChatInterface documentId={documentId} initialMessages={history} />
    </div>
  );
}
