'use client';

import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';

export default function MetadataExplorer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t">
      {/* Toggle header */}
      <button
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span>Metadata Explorer</span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible body */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">No metadata available</p>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start">
            <Download className="size-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
