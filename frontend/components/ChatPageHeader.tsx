'use client';

import { Bell, UserCircle } from 'lucide-react';

type Tab = 'documents' | 'chat' | 'settings' | 'support';

interface Props {
  documentName: string;
  activeTab?: Tab;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'documents', label: 'Documents' },
  { id: 'chat', label: 'Chat' },
  { id: 'settings', label: 'Settings' },
  { id: 'support', label: 'Support' },
];

export default function ChatPageHeader({ documentName, activeTab = 'chat' }: Props) {
  return (
    <header className="flex items-center gap-4 border-b bg-background px-4 py-2 shrink-0">
      {/* Branding */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold whitespace-nowrap">
          Obsidian Curator | AI Research Studio
        </span>
        {documentName && (
          <span className="hidden lg:block text-xs text-muted-foreground truncate max-w-[200px]">
            — {documentName}
          </span>
        )}
      </div>

      {/* Tab navigation */}
      <nav className="flex items-center gap-1 flex-1" aria-label="Page tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === id
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Right side: user profile + notification */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          <UserCircle className="size-5 text-muted-foreground" />
          <span className="hidden md:block text-xs text-muted-foreground">
            Research Lead — Pro Plan
          </span>
        </div>
      </div>
    </header>
  );
}
