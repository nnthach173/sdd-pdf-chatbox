'use client';

import { type DocumentListItem } from '@/lib/api';
import DocumentCard from '@/components/DocumentCard';

interface Props {
  documents: DocumentListItem[];
  onDeleted: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function DocumentList({ documents, onDeleted, onOpen }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#22262e] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-7 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-bold font-headline text-foreground">No documents yet</p>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            Upload your first PDF to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} onDeleted={onDeleted} onOpen={onOpen} />
      ))}
    </div>
  );
}
