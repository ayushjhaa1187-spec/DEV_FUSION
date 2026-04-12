'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface RichTextRendererProps {
  content: string | any; // Any in case old Tiptap JSON is passed, but we render string
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  const markdownText = typeof content === 'string' ? content : (content?.text || '');

  return (
    <div className="prose prose-invert max-w-none text-gray-300">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  background: '#0d1117',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                  fontSize: '0.9rem',
                  margin: '1.5rem 0',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code
                {...props}
                className={`${className || ''} bg-white/10 px-1.5 py-0.5 rounded text-indigo-400 font-mono text-sm`}
              >
                {children}
              </code>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote {...props} className="border-l-4 border-indigo-500 pl-6 text-slate-400 italic my-6">
                {children}
              </blockquote>
            );
          },
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt}
                className="max-w-full rounded-2xl my-8 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                {...props}
              />
            );
          },
          h2({ children, ...props }) {
            return <h2 className="text-2xl font-black text-white mt-8 mb-4" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 className="text-xl font-black text-white mt-6 mb-3" {...props}>{children}</h3>;
          }
        }}
      >
        {markdownText}
      </ReactMarkdown>
    </div>
  );
}
