'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  signedUrl: string;
}

function LoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading PDF…
    </div>
  );
}

export default function PdfViewer({ signedUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Could not display this PDF.
        </p>
        <a
          href={signedUrl}
          download
          className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Download PDF
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto">
      <Document
        file={signedUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setError(true)}
        loading={<LoadingSpinner />}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page key={i + 1} pageNumber={i + 1} width={containerWidth} />
        ))}
      </Document>
    </div>
  );
}
