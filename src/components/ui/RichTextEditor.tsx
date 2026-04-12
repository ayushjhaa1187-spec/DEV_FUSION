'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/github-dark.css';
import { 
  Bold, Italic, Code, List, ListOrdered, 
  Heading2, Heading3, Image as ImageIcon,
  Terminal, Quote, Undo, Redo 
} from 'lucide-react';
import { useCallback } from 'react';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: any;
  onChange: (json: any, text: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.url) {
            editor.chain().focus().setImage({ src: data.url }).run();
          }
        } catch (error) {
          console.error('Image upload failed', error);
        }
      }
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-white/5 sticky top-0 z-10">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('bold') ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('italic') ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('code') ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Inline Code"
      >
        <Code size={18} />
      </button>
      <div className="w-px h-6 bg-white/10 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 2 }) ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 3 }) ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Heading 3"
      >
        <Heading3 size={18} />
      </button>
      <div className="w-px h-6 bg-white/10 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('bulletList') ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('orderedList') ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>
      <div className="w-px h-6 bg-white/10 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('codeBlock') ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Code Block"
      >
        <Terminal size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-white/10 ${editor.isActive('blockquote') ? 'text-indigo-400 bg-white/10' : 'text-gray-400'}`}
        title="Quote"
      >
        <Quote size={18} />
      </button>
      <div className="w-px h-6 bg-white/10 mx-1 self-center" />
      <button
        type="button"
        onClick={addImage}
        className="p-2 rounded hover:bg-white/10 text-gray-400"
        title="Upload Image"
      >
        <ImageIcon size={18} />
      </button>
      <div className="ml-auto flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded hover:bg-white/10 text-gray-400 disabled:opacity-30"
          disabled={!editor.can().undo()}
        >
          <Undo size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded hover:bg-white/10 text-gray-400 disabled:opacity-30"
          disabled={!editor.can().redo()}
        >
          <Redo size={18} />
        </button>
      </div>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
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
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4 text-gray-300',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getText());
    },
    immediatelyRender: false,
  });

  return (
    <div className="tiptap-editor-container border border-white/10 rounded-2xl bg-black/20 focus-within:border-indigo-500/30 transition-all overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-editor-container .ProseMirror pre {
          background: #0d1117;
          border-radius: 8px;
          padding: 1rem;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          font-size: 0.9rem;
          margin-top: 1rem;
        }
        .tiptap-editor-container .ProseMirror code {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          color: #a78bfa;
        }
        .tiptap-editor-container .ProseMirror p {
          margin-bottom: 0.5rem;
        }
        .tiptap-editor-container .ProseMirror ul, 
        .tiptap-editor-container .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .tiptap-editor-container .ProseMirror blockquote {
          border-left: 3px solid #6366f1;
          padding-left: 1rem;
          color: #94a3b8;
          font-style: italic;
        }
        .tiptap-editor-container .ProseMirror img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
