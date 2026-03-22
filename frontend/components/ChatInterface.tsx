'use client';

import { useEffect, useRef, useState } from 'react';
import { streamChat, type ChatMessage as ChatMessageType } from '@/lib/api';
import ChatMessage from '@/components/ChatMessage';
import { Image, Paperclip, Send } from 'lucide-react';

interface Props {
  documentId: string;
  initialMessages: ChatMessageType[];
}

export default function ChatInterface({ documentId, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message whenever messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit() {
    const question = input.trim();
    if (!question || streaming) return;

    setInput('');
    setError(null);

    // Append the user message immediately.
    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };
    // Add a placeholder for the streaming assistant reply.
    const assistantPlaceholder: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setStreaming(true);

    try {
      const response = await streamChat(documentId, question);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (!json) continue;
          const event = JSON.parse(json) as { type: string; content: string };

          if (event.type === 'token') {
            // Append token to the last (assistant) message.
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: last.content + event.content };
              return updated;
            });
          } else if (event.type === 'error') {
            setError(event.content);
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Ask a question about this document to get started.
          </p>
        )}
        <div className="flex flex-col gap-10">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-8 mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Input bar — matches Stitch design */}
      <footer className="p-8 pt-0 bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className="bg-surface-container-high rounded-2xl p-4 border border-border/10 transition-all focus-within:border-primary/30 focus-within:bg-surface-container-highest shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Obsidian Curator…"
                rows={1}
                disabled={streaming}
                className="w-full bg-transparent border-none focus:outline-none text-foreground font-body placeholder:text-muted-foreground/40 resize-none max-h-32 py-2 pr-20 text-sm leading-relaxed"
              />
              {/* Actions row */}
              <div className="flex items-center mt-2">
                <div className="flex gap-2">
                  <button
                    className="p-2 text-muted-foreground hover:text-primary-dim transition-colors rounded-lg hover:bg-surface-container-highest"
                    aria-label="Attach file"
                  >
                    <Paperclip className="size-4" />
                  </button>
                  <button
                    className="p-2 text-muted-foreground hover:text-primary-dim transition-colors rounded-lg hover:bg-surface-container-highest"
                    aria-label="Upload image"
                  >
                    <Image className="size-4" />
                  </button>
                </div>
              </div>
            </div>
            {/* Gradient circle send button */}
            <button
              onClick={handleSubmit}
              disabled={streaming || !input.trim()}
              className="absolute right-4 bottom-4 primary-gradient text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-primary/40 transition-all active:scale-90 focus-within:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <Send className="size-5" />
            </button>
          </div>
          {/* Verify hint */}
          <div className="flex justify-center mt-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-40">
              {streaming ? 'Thinking…' : 'Verify critical data against source.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
