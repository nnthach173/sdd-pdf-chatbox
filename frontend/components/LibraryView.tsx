'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { listDocuments, type DocumentListItem, type DocumentResponse } from '@/lib/api';
import DocumentUpload, { type DocumentUploadHandle } from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

interface Props {
  onDocumentOpen: (docId: string) => void;
}

export interface LibraryViewHandle {
  triggerUpload: () => void;
}

const POLL_INTERVAL_MS = 3000;

function hasPendingStatus(docs: DocumentListItem[]): boolean {
  return docs.some((d) => d.status === 'uploading' || d.status === 'processing');
}

const LibraryView = forwardRef<LibraryViewHandle, Props>(function LibraryView(
  { onDocumentOpen },
  ref
) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadRef = useRef<DocumentUploadHandle>(null);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => uploadRef.current?.trigger(),
  }));

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
        <DocumentList documents={documents} onDeleted={handleDeleted} onOpen={onDocumentOpen} />
      </section>
    </div>
  );
});

export default LibraryView;
