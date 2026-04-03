'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';
import LibraryView, { type LibraryViewHandle } from '@/components/LibraryView';
import ChatView from '@/components/ChatView';

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeDocId = searchParams.get('doc');

  const libraryViewRef = useRef<LibraryViewHandle>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [docStatus, setDocStatus] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsGuest(!data.user);
    });
  }, []);

  function handleDocumentOpen(docId: string) {
    setDocName(null);
    setDocStatus(null);
    router.push(`/?doc=${docId}`);
  }

  function handleNavigate(view: 'library') {
    if (view === 'library') router.push('/');
  }

  function handleDocumentLoaded(name: string, status: string) {
    setDocName(name);
    setDocStatus(status);
  }

  const activeView = activeDocId ? 'chat' : 'library';

  const onUpload = () => libraryViewRef.current?.triggerUpload();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onUpload={onUpload}
      />
      <div className="ml-64 flex flex-1 flex-col overflow-hidden bg-obsidian-well">
        <AppHeader
          docName={activeDocId ? docName : null}
          docStatus={activeDocId ? docStatus : null}
        />
        <div className="flex flex-1 overflow-hidden">
          {/* LibraryView always mounted — hidden in chat mode to preserve document list state */}
          <div className={activeDocId ? 'hidden' : 'flex flex-1 flex-col overflow-y-auto'}>
            <LibraryView ref={libraryViewRef} onDocumentOpen={handleDocumentOpen} isGuest={isGuest ?? false} />
          </div>

          {/* ChatView rendered only when a document is selected */}
          {activeDocId && (
            <ChatView
              documentId={activeDocId}
              onDocumentLoaded={handleDocumentLoaded}
            />
          )}
        </div>
      </div>
    </div>
  );
}
