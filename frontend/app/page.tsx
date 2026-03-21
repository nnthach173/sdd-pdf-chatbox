'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listDocuments, type DocumentListItem, type DocumentResponse } from '@/lib/api';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

const POLL_INTERVAL_MS = 3000;

function hasPendingStatus(docs: DocumentListItem[]): boolean {
  return docs.some((d) => d.status === 'uploading' || d.status === 'processing');
}

export default function HomePage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      {/* Editorial header */}
      <div className="mb-12">
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-foreground">
          PDF{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #cc97ff, #9c48ea)' }}
          >
            Chatbox
          </span>
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Upload a document. Ask anything. The answers live inside.
        </p>
      </div>

      {/* Upload section */}
      <section className="mb-12">
        <DocumentUpload onUploaded={handleUploaded} />
      </section>

      {loadError && (
        <p className="mb-6 rounded-[0.375rem] bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {loadError}
        </p>
      )}

      {/* Documents section */}
      <section>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your Documents
        </p>
        <DocumentList documents={documents} onDeleted={handleDeleted} />
      </section>
    </main>
  );
}
