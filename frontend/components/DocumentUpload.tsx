'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { uploadDocument, GUEST_MAX_FILE_SIZE, type DocumentResponse } from '@/lib/api';

interface Props {
  onUploaded: (doc: DocumentResponse) => void;
  isGuest?: boolean;
}

export interface DocumentUploadHandle {
  trigger: () => void;
}

const DocumentUpload = forwardRef<DocumentUploadHandle, Props>(function DocumentUpload(
  { onUploaded, isGuest = false },
  ref
) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    trigger: () => inputRef.current?.click(),
  }));

  function validate(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return 'Only PDF files are supported.';
    }
    const maxSize = isGuest ? GUEST_MAX_FILE_SIZE : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return isGuest
        ? 'File exceeds the 1 MB limit for guests. Sign in to upload larger files.'
        : 'File exceeds the 50 MB limit.';
    }
    return null;
  }

  async function handleFile(file: File) {
    const err = validate(file);
    if (err) { setError(err); return; }
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
      {/* Glow wrapper */}
      <div className="relative group cursor-pointer">
        <div className="absolute -inset-1 bg-primary/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-700" />

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative rounded-[2rem] p-16 flex flex-col items-center justify-center text-center transition-all border-2 border-dashed ${
            dragging
              ? 'bg-[#161a20] border-primary/50'
              : 'bg-[#000000] border-[rgba(68,72,81,0.3)] hover:bg-[#111319] hover:border-primary/40'
          }`}
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#1c2027] flex items-center justify-center mb-6 shadow-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-9 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.076 11.095H6.75z" />
            </svg>
          </div>

          <h3 className="text-3xl font-headline font-bold mb-3 tracking-tight text-foreground">
            Drop your research here
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 font-body font-medium">
            {isGuest
              ? 'Max file size 1 MB for guests · Sign in to upload up to 50 MB.'
              : 'Upload PDF documents to transform them into interactive knowledge artifacts. Max file size 50 MB.'}
          </p>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-8 py-3 bg-[#22262e] hover:bg-[#282c34] text-foreground font-semibold rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
              </svg>
              Browse Files
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground font-body">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#22262e]">
            <div
              className="h-full rounded-full transition-all duration-300 primary-gradient"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-destructive font-body">{error}</p>
      )}
    </div>
  );
});

export default DocumentUpload;
