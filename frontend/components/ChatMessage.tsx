import { type ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { type ChatMessage as ChatMessageType } from '@/lib/api';

interface Props {
  message: ChatMessageType;
}

const markdownComponents = {
  a: ({ href, children }: ComponentProps<'a'>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  ),
  h1: ({ children }: ComponentProps<'h1'>) => (
    <h1 className="text-lg font-bold mt-2 mb-1">{children}</h1>
  ),
  h2: ({ children }: ComponentProps<'h2'>) => (
    <h2 className="text-base font-bold mt-1.5 mb-0.5">{children}</h2>
  ),
  h3: ({ children }: ComponentProps<'h3'>) => (
    <h3 className="text-sm font-semibold mt-1 mb-0.5">{children}</h3>
  ),
  code: ({ children, className, ...props }: ComponentProps<'code'>) => {
    const isBlock = Boolean(className?.startsWith('language-'));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={`${className ?? ''} bg-muted/50 rounded px-1 py-0.5 text-xs`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, className, ...props }: ComponentProps<'pre'>) => (
    <pre className={`${className ?? ''} bg-muted/50 rounded p-3 overflow-x-auto text-xs my-2`} {...props}>
      {children}
    </pre>
  ),
  table: ({ children }: ComponentProps<'table'>) => (
    <table className="text-xs border-collapse w-full my-2">{children}</table>
  ),
};

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground prose prose-sm dark:prose-invert max-w-none'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
