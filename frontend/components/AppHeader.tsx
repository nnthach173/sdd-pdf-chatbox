'use client';

import UserMenu from '@/components/UserMenu';

interface Props {
  docName?: string | null;
  docStatus?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const isPending = status === 'processing' || status === 'uploading';
  const isError = status === 'error' || status === 'failed';

  const classes = isPending
    ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse'
    : isError
    ? 'bg-destructive/10 text-destructive border border-destructive/20'
    : 'bg-[#293f46]/30 text-[#b3cad4] border border-[#b3cad4]/20';

  const label = isPending ? 'Processing…' : isError ? 'Error' : 'Ready';

  return (
    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${classes}`}>
      {label}
    </span>
  );
}

export default function AppHeader({ docName, docStatus }: Props) {
  return (
    <header className="flex justify-between items-center w-full px-12 py-8 sticky top-0 bg-background/80 backdrop-blur-xl z-40 border-b border-border/40">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-black font-headline uppercase tracking-tighter text-primary">
          Obsidian Curator
        </h2>
        {docName && (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground/40 text-lg font-light">/</span>
            <span className="text-sm font-semibold text-foreground truncate max-w-xs">
              {docName}
            </span>
            {docStatus && <StatusBadge status={docStatus} />}
          </div>
        )}
      </div>
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
        <UserMenu />
      </div>
    </header>
  );
}
