'use client';

interface Props {
  activeView: 'library' | 'chat';
  onNavigate: (view: 'library') => void;
  onUpload: () => void;
}

export default function AppSidebar({ activeView, onNavigate, onUpload }: Props) {
  const isLibrary = activeView === 'library';
  const isChat = activeView === 'chat';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col p-4 bg-[#0c0e12] z-50">
      {/* Brand */}
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-bold tracking-tight font-headline text-primary">
          Obsidian PDF
        </h1>
        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">
          AI Research Studio
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {/* Documents */}
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isLibrary
              ? 'bg-[#22262e] text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-[#22262e]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span>Documents</span>
        </button>

        {/* Chat — no-op when in library */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
            isChat
              ? 'bg-[#22262e] text-primary'
              : 'text-muted-foreground/40 cursor-default'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <span>Chat</span>
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto space-y-2 pt-6" style={{ borderTop: '1px solid rgba(68,72,81,0.1)' }}>
        <button
          type="button"
          onClick={onUpload}
          className="w-full flex items-center justify-center gap-2 primary-gradient text-white py-3 px-6 rounded-full font-bold mb-4 transition-transform hover:scale-[1.02] active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Upload PDF</span>
        </button>

        <a href="#" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-[#22262e] transition-all duration-200 rounded-lg font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </a>
      </div>
    </aside>
  );
}
