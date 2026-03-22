'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import {
  getChatHistory,
  getDocument,
  type ChatMessage,
  type DocumentDetail,
} from '@/lib/api';
import ChatInterface from '@/components/ChatInterface';
import ChatPageHeader from '@/components/ChatPageHeader';
import DocumentSidebar from '@/components/DocumentSidebar';
import PanelDivider from '@/components/PanelDivider';
import { Button } from '@/components/ui/button';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
});

export default function ChatPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftPct, setLeftPct] = useState(50);
  const [isDesktop, setIsDesktop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  // Poll every 5 s when document is not yet ready
  useEffect(() => {
    if (!doc || doc.status === 'ready') return;
    const id = setInterval(async () => {
      try {
        const updated = await getDocument(documentId);
        setDoc(updated);
        if (updated.status === 'ready') clearInterval(id);
      } catch {
        // ignore transient errors during polling
      }
    }, 5000);
    return () => clearInterval(id);
  }, [doc, documentId]);

  const handleDividerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const onMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(80, Math.max(20, pct)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleDividerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const onTouchMove = (ev: TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = ev.touches[0].clientX;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(80, Math.max(20, pct)));
    };
    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  };

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
        <p className="text-sm text-destructive">
          {error ?? 'Document not found.'}
        </p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top app bar — document info + search + icons */}
      <ChatPageHeader
        documentName={doc.name}
        documentStatus={doc.status as 'processing' | 'ready' | 'error'}
      />

      {/* Three-panel content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Document sidebar */}
        <DocumentSidebar
          documentName={doc.name}
          documentStatus={doc.status as 'processing' | 'ready' | 'error'}
        />

        {/* Center + Right: PDF viewer + divider + chat panel */}
        <div
          ref={containerRef}
          className="flex flex-1 flex-col overflow-hidden md:flex-row"
        >
          {/* PDF panel */}
          <div
            className="w-full h-[50vh] overflow-y-auto md:h-full"
            style={isDesktop ? { width: `${leftPct}%` } : undefined}
          >
            {doc.status === 'ready' && doc.signed_url ? (
              <PdfViewer signedUrl={doc.signed_url} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <p className="text-sm text-muted-foreground">
                  Document is still processing…
                </p>
              </div>
            )}
          </div>

          {/* Divider — hidden on mobile */}
          <PanelDivider
            onMouseDown={handleDividerMouseDown}
            onTouchStart={handleDividerTouchStart}
          />

          {/* Chat panel */}
          <div
            className="w-full flex-1 overflow-y-auto md:h-full flex flex-col"
            style={isDesktop ? { width: `${100 - leftPct}%` } : undefined}
          >
            <ChatInterface documentId={documentId} initialMessages={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
