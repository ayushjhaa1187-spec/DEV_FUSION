'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/github-dark.css';

const lowlight = createLowlight(common);

interface RichTextRendererProps {
  content: any;
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  // We use an editor in read-only mode for consistent rendering
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content || '',
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none text-gray-300',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="tiptap-renderer">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-renderer .ProseMirror pre {
          background: #0d1117;
          border-radius: 12px;
          padding: 1.5rem;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          font-size: 0.9rem;
          margin: 1.5rem 0;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .tiptap-renderer .ProseMirror code {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          color: #a78bfa;
        }
        .tiptap-renderer .ProseMirror blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1.5rem;
          color: #94a3b8;
          font-style: italic;
          margin: 1.5rem 0;
        }
        .tiptap-renderer .ProseMirror img {
          max-width: 100%;
          border-radius: 16px;
          margin: 2rem 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .tiptap-renderer .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .tiptap-renderer .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}
