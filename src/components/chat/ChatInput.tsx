"use client";

import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useState, useRef } from "react";
import AttachmentMenu from "./AttachmentMenu";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onUpload: (file: any) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  input,
  onChange,
  onSend,
  onUpload,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [openAttachment, setOpenAttachment] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative border-t border-border bg-surface">
      {/* Attachment Popup */}
      <AttachmentMenu
        open={openAttachment}
        onClose={() => setOpenAttachment(false)}
        imageInputRef={imageInputRef}
        fileInputRef={fileInputRef}
      />

      <input
        ref={imageInputRef}
          hidden
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);

          e.target.value = "";
        }}
      />

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);

          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-2 p-3">
        {/* Emoji */}
        <button
          type="button"
          title="Emoji"
          aria-label="Open emoji picker"
          className="p-2 rounded-full hover:bg-surface-soft transition"
        >
          <Smile className="w-5 h-5 text-muted" />
        </button>

        {/* Attachment */}
        <button
          type="button"
          title="Attach file"
          aria-label="Attach file"
          disabled={disabled}
          onClick={() => setOpenAttachment(!openAttachment)}
          className="p-2 rounded-full hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent transition"
        >
          <Paperclip className="w-5 h-5 text-muted" />
        </button>

        {/* Input */}

        <input
          value={input}
          onChange={onChange}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-full bg-surface-soft px-5 py-3 text-foreground outline-none border border-border focus:border-primary disabled:cursor-not-allowed disabled:text-muted"
        />

        {/* Send */}

        <button
          type="button"
          title="Send message"
          aria-label="Send message"
          disabled={disabled}
          onClick={onSend}
          className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover disabled:bg-surface-soft disabled:cursor-not-allowed transition flex items-center justify-center"
        >
          <SendHorizontal className="w-5 h-5 text-on-primary" />
        </button>
      </div>
    </div>
  );
}
