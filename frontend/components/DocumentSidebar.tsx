'use client';

import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  documentName: string;
  documentStatus: 'processing' | 'ready' | 'error';
}

const STATUS_CONFIG = {
  ready: { label: 'Ready', variant: 'secondary' as const },
  processing: { label: 'Processing', variant: 'outline' as const },
  error: { label: 'Error', variant: 'destructive' as const },
};

export default function DocumentSidebar({ documentName, documentStatus }: Props) {
  const { label, variant } = STATUS_CONFIG[documentStatus];

  return (
    <div className="w-64 h-full flex flex-col bg-muted/30 border-r overflow-hidden">
      {/* Document info */}
      <div className="px-3 py-4 border-b">
        <p className="text-sm font-semibold truncate mb-2" title={documentName}>
          {documentName}
        </p>
        <Badge variant={variant}>{label}</Badge>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search…"
            className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
