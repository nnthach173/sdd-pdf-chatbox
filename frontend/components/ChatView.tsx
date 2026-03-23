'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getChatHistory, getDocument, type ChatMessage, type DocumentDetail } from '@/lib/api';
import ChatInterface from '@/components/ChatInterface';
import PanelDivider from '@/components/PanelDivider';
import { Button } from '@/components/ui/button';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { ssr: false });

interface Props {
  documentId: string;
  onDocumentLoaded?: (name: string, status: string) => void;
}

export default function ChatView({ documentId, onDocumentLoaded }: Props) {
  const router = useRouter();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [leftPct, setLeftPct] = useState(50);
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeTab, setActiveTab] = useState<'pdf' | 'chat'>('chat');

  const containerRef = useRef<HTMLDivElement>(null);

  // T014: Load split ratio from localStorage on mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem('obsidian-split-ratio');
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) setLeftPct(Math.min(80, Math.max(20, parsed)));
    }
  }, []);

  // T015: Detect mobile vs desktop, update on resize
  useEffect(() => {
    function checkDesktop() {
      setIsDesktop(window.innerWidth >= 768);
    }
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Load document + history on documentId change
  useEffect(() => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setDoc(null);
    setHistory([]);

    async function load() {
      try {
        const [docData, msgs] = await Promise.all([
          getDocument(documentId),
          getChatHistory(documentId),
        ]);
        setDoc(docData);
        setHistory(msgs);
        onDocumentLoaded?.(docData.name, docData.status);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load document.';
        if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
          setNotFound(true);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Poll when document is processing
  useEffect(() => {
    if (!doc || doc.status === 'ready') return;
    const id = setInterval(async () => {
      try {
        const updated = await getDocument(documentId);
        setDoc(updated);
        onDocumentLoaded?.(updated.name, updated.status);
        if (updated.status === 'ready') clearInterval(id);
      } catch {
        // ignore transient polling errors
      }
    }, 5000);
    return () => clearInterval(id);
  }, [doc, documentId, onDocumentLoaded]);

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
      setLeftPct((pct) => {
        localStorage.setItem('obsidian-split-ratio', String(pct));
        return pct;
      });
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
      setLeftPct((pct) => {
        localStorage.setItem('obsidian-split-ratio', String(pct));
        return pct;
      });
    };
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Document not found.</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Return to library
        </Button>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">
          {error ?? 'Something went wrong loading this document.'}
        </p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Return to library
        </Button>
      </div>
    );
  }

  // Mobile: tab toggle layout
  if (!isDesktop) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tab strip */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'pdf'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Chat
          </button>
        </div>

        {/* Active panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeTab === 'pdf' ? (
            doc.status === 'ready' && doc.signed_url ? (
              <PdfViewer signedUrl={doc.signed_url} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <p className="text-sm text-muted-foreground">Document is still processing…</p>
              </div>
            )
          ) : (
            <ChatInterface documentId={documentId} initialMessages={history} />
          )}
        </div>
      </div>
    );
  }

  // Desktop: split panel layout
  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* PDF panel */}
      <div className="h-full" style={{ width: `${leftPct}%` }}>
        {doc.status === 'ready' && doc.signed_url ? (
          <PdfViewer signedUrl={doc.signed_url} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">Document is still processing…</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <PanelDivider
        onMouseDown={handleDividerMouseDown}
        onTouchStart={handleDividerTouchStart}
      />

      {/* Chat panel */}
      <div className="flex flex-col overflow-hidden h-full" style={{ width: `${100 - leftPct}%` }}>
        <ChatInterface documentId={documentId} initialMessages={history} />
      </div>
    </div>
  );
}
