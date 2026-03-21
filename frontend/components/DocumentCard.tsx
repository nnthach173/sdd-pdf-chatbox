'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDocument, type DocumentListItem } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  doc: DocumentListItem;
  onDeleted: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type StatusConfig = { bg: string; text: string; label: string };

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case 'ready':
      return { bg: 'bg-primary/10', text: 'text-primary', label: 'Ready' };
    case 'processing':
      return { bg: 'bg-[#391647]', text: 'text-[#c2a0ca]', label: 'Processing' };
    case 'uploading':
      return { bg: 'bg-[#391647]', text: 'text-[#c2a0ca]', label: 'Uploading' };
    case 'failed':
      return { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Failed' };
    default:
      return { bg: 'bg-[#391647]', text: 'text-[#c2a0ca]', label: status };
  }
}

export default function DocumentCard({ doc, onDeleted }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDocument(doc.id);
      setOpen(false);
      onDeleted(doc.id);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  function handleCardClick() {
    if (doc.status === 'ready') {
      router.push(`/chat/${doc.id}`);
    }
  }

  const status = getStatusConfig(doc.status);

  return (
    <div
      className={`group relative flex items-center justify-between gap-4 rounded-xl bg-card px-5 py-4 transition-colors duration-150 ${
        doc.status === 'ready' ? 'cursor-pointer hover:bg-accent' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Left: file icon + info */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#391647]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBytes(doc.file_size)}
            {doc.page_count != null ? ` · ${doc.page_count} pages` : ''}
            {' · '}
            {formatDate(doc.created_at)}
          </p>
        </div>
      </div>

      {/* Right: status chip + delete */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            onClick={(e) => e.stopPropagation()}
            render={
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-[#391647] hover:text-foreground group-hover:opacity-100"
              />
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Delete document?</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{doc.name}</strong> and its entire chat
                history. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-[0.375rem] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-[0.375rem] bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
