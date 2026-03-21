'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listDocuments, type DocumentListItem, type DocumentResponse } from '@/lib/api';
import DocumentUpload, { type DocumentUploadHandle } from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

const POLL_INTERVAL_MS = 3000;

function hasPendingStatus(docs: DocumentListItem[]): boolean {
  return docs.some((d) => d.status === 'uploading' || d.status === 'processing');
}

export default function HomePage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadRef = useRef<DocumentUploadHandle>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
      setLoadError(null);
      return docs;
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load documents.');
      return null;
    }
  }, []);

  useEffect(() => {
    fetchDocuments().then((docs) => {
      if (docs && hasPendingStatus(docs)) startPolling();
    });
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const docs = await fetchDocuments();
      if (docs && !hasPendingStatus(docs)) stopPolling();
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function handleUploaded(doc: DocumentResponse) {
    setDocuments((prev) => [
      {
        id: doc.id,
        name: doc.name,
        file_size: doc.file_size,
        page_count: null,
        status: doc.status,
        created_at: doc.created_at,
      },
      ...prev,
    ]);
    startPolling();
  }

  function handleDeleted(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col p-4 bg-[#0c0e12] z-50">
        {/* Brand */}
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-bold tracking-tight font-headline text-primary">
            Obsidian PDF
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">
            AI Research Studio
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 bg-[#22262e] rounded-lg text-primary font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span>Documents</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-[#22262e] transition-all duration-200 rounded-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <span>Chat</span>
          </a>
        </nav>

        {/* Bottom actions */}
        <div className="mt-auto space-y-2 pt-6" style={{ borderTop: '1px solid rgba(68,72,81,0.1)' }}>
          <button
            onClick={() => uploadRef.current?.trigger()}
            className="w-full flex items-center justify-center gap-2 primary-gradient text-white py-3 px-6 rounded-full font-bold mb-4 transition-transform hover:scale-[1.02] active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Upload PDF</span>
          </button>

          <a href="#" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-[#22262e] transition-all duration-200 rounded-lg font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="ml-64 flex-1 min-h-screen bg-obsidian-well">
        {/* Top header */}
        <header className="flex justify-between items-center w-full px-12 py-8 sticky top-0 bg-background/80 backdrop-blur-xl z-40">
          <h2 className="text-xl font-black font-headline uppercase tracking-tighter text-primary">
            Obsidian Curator
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search research vault..."
                className="bg-[#1c2027] rounded-full py-2.5 pl-10 pr-5 w-60 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>
        </header>

        {/* Page canvas */}
        <div className="max-w-7xl mx-auto px-12 pb-24">
          {/* Hero upload zone */}
          <section className="mb-16">
            <DocumentUpload ref={uploadRef} onUploaded={handleUploaded} />
          </section>

          {loadError && (
            <p className="mb-8 rounded-xl bg-destructive/10 px-5 py-3 text-sm text-destructive">
              {loadError}
            </p>
          )}

          {/* Documents section */}
          <section>
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-4xl font-headline font-extrabold tracking-tighter mb-2 text-foreground">
                  Your Documents
                </h2>
                <p className="text-muted-foreground font-body font-medium">
                  {documents.length} {documents.length === 1 ? 'artifact' : 'artifacts'} in your vault
                </p>
              </div>
            </div>
            <DocumentList documents={documents} onDeleted={handleDeleted} />
          </section>
        </div>
      </main>
    </div>
  );
}
