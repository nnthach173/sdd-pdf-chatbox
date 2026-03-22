'use client';

import { Bell, FileText, Search, UserCircle } from 'lucide-react';

const STATUS_CONFIG = {
  ready:      { label: 'Ready',      className: 'bg-secondary-container text-foreground' },
  processing: { label: 'Processing', className: 'bg-muted text-muted-foreground' },
  error:      { label: 'Error',      className: 'bg-destructive/20 text-destructive' },
};

interface Props {
  documentName: string;
  documentStatus: 'processing' | 'ready' | 'error';
}

export default function ChatPageHeader({ documentName, documentStatus }: Props) {
  const status = STATUS_CONFIG[documentStatus] ?? STATUS_CONFIG.processing;

  return (
    <header className="flex justify-between items-center w-full px-8 py-4 shrink-0 bg-background/50 backdrop-blur-md border-b border-border/5 z-40">
      {/* Left: Document info pill */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-low rounded-xl ghost-border">
          <FileText className="size-4 text-primary-dim shrink-0" />
          <h2 className="font-headline font-bold text-sm tracking-wide truncate max-w-[280px]">
            {documentName.toUpperCase()}
          </h2>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter shrink-0 ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Right: Search + icons */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-surface-container-highest/50 px-4 py-2 rounded-full border border-border/10">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search document…"
            className="bg-transparent border-none focus:outline-none text-sm w-44 font-body placeholder:text-muted-foreground/50"
            readOnly
          />
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="hover:text-primary transition-colors opacity-80 hover:opacity-100" aria-label="Notifications">
            <Bell className="size-5" />
          </button>
          <button className="hover:text-primary transition-colors opacity-80 hover:opacity-100" aria-label="Account">
            <UserCircle className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
