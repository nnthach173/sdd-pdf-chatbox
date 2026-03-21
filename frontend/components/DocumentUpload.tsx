'use client';

import { useRef, useState } from 'react';
import { uploadDocument, type DocumentResponse } from '@/lib/api';

interface Props {
  onUploaded: (doc: DocumentResponse) => void;
}

export default function DocumentUpload({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 50 * 1024 * 1024;

  function validate(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return 'Only PDF files are supported.';
    }
    if (file.size > MAX_SIZE) {
      return 'File exceeds the 50 MB limit.';
    }
    return null;
  }

  async function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(10);

    try {
      const tick = setInterval(() => setProgress((p) => Math.min(p + 15, 85)), 300);
      const doc = await uploadDocument(file);
      clearInterval(tick);
      setProgress(100);
      onUploaded(doc);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  return (
    <div className="w-full">
      {/* Drop zone — background shift, no border */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-4 rounded-xl p-12 transition-colors duration-200 ${
          dragging ? 'bg-accent' : 'bg-card'
        }`}
      >
        {/* Icon in surface-variant circle */}
        <div className="flex size-14 items-center justify-center rounded-full bg-[#391647]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop your PDF here, or{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer text-primary underline-offset-2 hover:underline"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Max 50 MB · PDF only</p>
        </div>

        {!uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 rounded-[0.375rem] px-5 py-2 text-sm font-semibold text-[#1b0425] transition-opacity hover:opacity-90"
            style={{ backgroundImage: 'linear-gradient(135deg, #cc97ff, #9c48ea)' }}
          >
            Select PDF
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#391647]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundImage: 'linear-gradient(135deg, #cc97ff, #9c48ea)',
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
