'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useState, useRef } from 'react';
import { ImageIcon, Bold, Code, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  content: any;
  onChange: (json: any) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none min-h-[200px] w-full max-w-none',
      },
    },
  });

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        editor?.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="rich-editor-container glass">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'active' : ''}
            title="Code Block"
          >
            <Code size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'active' : ''}
            title="Quote"
          >
            <Quote size={18} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload Image"
          >
            <ImageIcon size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={addImage}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <div className="toolbar-group ml-auto">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo size={18} />
          </button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo size={18} />
          </button>
        </div>
      </div>

      <div className="editor-content-area">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .rich-editor-container {
          border-radius: 12px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
        }
        .editor-toolbar {
          display: flex;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap;
        }
        .toolbar-group {
          display: flex;
          gap: 4px;
        }
        .editor-toolbar button {
          background: none;
          border: none;
          color: var(--color-text-muted);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .editor-toolbar button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text);
        }
        .editor-toolbar button.active {
          background: var(--color-primary);
          color: white;
        }
        .editor-content-area {
          padding: 16px;
        }
        .editor-content-area .ProseMirror {
          min-height: 200px;
          outline: none;
          color: var(--color-text);
          font-size: 1rem;
          line-height: 1.6;
        }
        .editor-content-area .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-text-faint);
          pointer-events: none;
          height: 0;
        }
        .editor-image {
          max-width: 100%;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .ml-auto { margin-left: auto; }
      `}</style>
    </div>
  );
}
