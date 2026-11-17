import React, { useEffect, useRef } from 'react';
import {
  Bold,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write detailed product overview, clinical applications, and warranty notes...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL (e.g. https://buydenmed.in/specs)');
    if (url) exec('createLink', url);
  };

  const tools = [
    { icon: Bold, label: 'Bold', action: () => exec('bold') },
    { icon: Italic, label: 'Italic', action: () => exec('italic') },
    { icon: Heading3, label: 'Subheading', action: () => exec('formatBlock', '<h3>') },
    { icon: List, label: 'Bullet List', action: () => exec('insertUnorderedList') },
    { icon: ListOrdered, label: 'Numbered List', action: () => exec('insertOrderedList') },
    { icon: Link2, label: 'Insert Link', action: handleLink },
    { icon: RemoveFormatting, label: 'Clear Formatting', action: () => exec('removeFormat') },
  ];

  return (
    <div className="rounded-lg border border-[#DCE6F2] bg-white overflow-hidden focus-within:border-[#1D5FAF] focus-within:ring-2 focus-within:ring-[#1D5FAF]/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#DCE6F2] bg-[#F6F9FD] px-2.5 py-1.5">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              type="button"
              onClick={t.action}
              title={t.label}
              className="rounded-md p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF] transition-colors"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        data-placeholder={placeholder}
        className="min-h-[160px] max-h-[340px] overflow-y-auto px-3.5 py-3 text-sm text-[#12263F] leading-relaxed focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-2"
      />
    </div>
  );
}
