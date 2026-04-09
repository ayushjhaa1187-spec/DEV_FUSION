'use client';

import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useState } from 'react';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="md-editor-wrapper" data-color-mode="dark">
      <MDEditor
        value={content || ''}
        onChange={(val) => onChange(val || '')}
        preview="edit"
        height={300}
        textareaProps={{
          placeholder: placeholder || 'Type your doubt here...'
        }}
      />
      <style jsx global>{`
        .md-editor-wrapper .w-md-editor {
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid var(--color-border) !important;
          border-radius: 16px !important;
          overflow: hidden;
        }
        .md-editor-wrapper .w-md-editor-toolbar {
          background: rgba(255, 255, 255, 0.05) !important;
          border-bottom: 1px solid var(--color-border) !important;
        }
        .md-editor-wrapper .w-md-editor-content {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
