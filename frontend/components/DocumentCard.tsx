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

type StatusConfig = { bg: string; text: string; border: string; label: string };

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case 'ready':
      return {
        bg: 'bg-[#293f46]/30',
        text: 'text-[#b3cad4]',
        border: 'border border-[#b3cad4]/20',
        label: 'Ready',
      };
    case 'processing':
    case 'uploading':
      return {
        bg: 'bg-primary/10',
        text: 'text-primary',
        border: 'border border-primary/20',
        label: status === 'processing' ? 'Analyzing' : 'Uploading',
      };
    case 'failed':
      return {
        bg: 'bg-destructive/10',
        text: 'text-destructive',
        border: 'border border-destructive/20',
        label: 'Failed',
      };
    default:
      return { bg: 'bg-[#22262e]', text: 'text-muted-foreground', border: '', label: status };
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

  const status = getStatusConfig(doc.status);
  const isReady = doc.status === 'ready';
  const isPending = doc.status === 'processing' || doc.status === 'uploading';

  return (
    <div className="group relative flex flex-col bg-[#111319] rounded-[1.5rem] p-6 transition-all ghost-border hover:bg-[#1c2027] hover:-translate-y-1 duration-200">
      {/* Top row: PDF icon + status chip */}
      <div className="flex justify-between items-start mb-6">
        {/* PDF icon card */}
        <div className="w-12 h-16 bg-[#22262e] rounded-lg flex flex-col items-center justify-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-primary to-transparent" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-6 text-primary-dim relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <div className="absolute bottom-1 right-1 text-[8px] font-bold text-primary opacity-60 z-10">PDF</div>
        </div>

        {/* Status chip */}
        <span
          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${status.bg} ${status.text} ${status.border} ${
            isPending ? 'animate-pulse' : ''
          }`}
        >
          {status.label}
        </span>
      </div>

      {/* Title */}
      <h4
        className={`text-base font-bold mb-2 line-clamp-1 transition-colors ${
          isReady ? 'group-hover:text-primary cursor-pointer' : ''
        }`}
        onClick={() => isReady && router.push(`/chat/${doc.id}`)}
      >
        {doc.name}
      </h4>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-body font-medium mb-8">
        {doc.page_count != null && (
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {doc.page_count} pages
          </div>
        )}
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          {formatBytes(doc.file_size)}
        </div>
      </div>

      {/* Action buttons */}
      <div className={`mt-auto flex gap-3 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <button
          onClick={() => isReady && router.push(`/chat/${doc.id}`)}
          disabled={!isReady}
          className="flex-1 py-3 bg-[#22262e] hover:bg-primary hover:text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:pointer-events-none"
        >
          {isPending ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Processing…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Open Chat
            </>
          )}
        </button>

        {/* Delete */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            onClick={(e) => e.stopPropagation()}
            render={
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-[#22262e] hover:bg-destructive/20 hover:text-destructive rounded-xl transition-colors text-muted-foreground"
              />
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Delete document?</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{doc.name}</strong> and its entire chat history. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
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
