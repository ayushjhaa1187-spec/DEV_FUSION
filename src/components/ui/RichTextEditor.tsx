'use client';

import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useTheme } from 'next-themes';
import { Camera, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import * as commands from "@uiw/react-md-editor/commands";

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface RichTextEditorProps {
  content: string | any; // MDEditor uses string, but allow any for compatibility
  onChange: (json: any, text: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // If content is an object (old Tiptap JSON), we try to fall back to a text representation, 
  // or just use empty string to avoid crashes.
  const stringContent = typeof content === 'string' ? content : '';

  const uploadImage = async (file: File) => {
    setUploading(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        // Simple way to insert at cursor by appending for now, 
        // or we can use the MDEditor API if we had the ref.
        const markdownImage = `\n![image](${data.secure_url})\n`;
        onChange(stringContent + markdownImage, stringContent + markdownImage);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const imageCommand = {
    name: "image-upload",
    keyCommand: "image-upload",
    buttonProps: { "aria-label": "Upload image", "title": "Upload Image" },
    icon: uploading ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Camera size={16} />,
    execute: (state: any, api: any) => {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 relative" data-color-mode="dark">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
        }}
      />
      <MDEditor
        value={stringContent}
        onChange={(val) => {
          const text = val || '';
          onChange(text, text);
        }}
        preview="edit"
        height={300}
        textareaProps={{
          placeholder: placeholder || 'What exactly are you struggling with? Add blocks of code or details here.'
        }}
        commands={[
          ...Object.values(commands).filter(c => c && (c as any).name !== 'image'),
          imageCommand
        ] as any}
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      />
      <style jsx global>{`
        .w-md-editor {
          background-color: rgba(0, 0, 0, 0.2) !important;
          border-radius: 1rem !important;
        }
        .w-md-editor-toolbar {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 8px 12px !important;
          gap: 4px !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
        }
        .w-md-editor-toolbar ul {
          display: flex !important;
          align-items: center !important;
          gap: 2px !important;
          padding: 0 4px !important;
          margin: 0 !important;
          flex-wrap: wrap !important;
        }
        .w-md-editor-toolbar ul + ul {
          border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
          margin-left: 4px !important;
          padding-left: 8px !important;
        }
        .w-md-editor-toolbar li {
          margin: 0 1px !important;
        }
        .w-md-editor-toolbar li > button {
          color: #9ca3af !important;
          padding: 5px 7px !important;
          border-radius: 6px !important;
          height: 28px !important;
          min-width: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .w-md-editor-toolbar li.active > button, 
        .w-md-editor-toolbar li > button:hover {
          color: #a78bfa !important;
          background-color: rgba(167, 139, 250, 0.12) !important;
        }
        .w-md-editor-text-pre > code, .w-md-editor-text-input {
          font-family: 'Fira Code', 'Courier New', Courier, monospace !important;
        }
      `}</style>
    </div>
  );
}
