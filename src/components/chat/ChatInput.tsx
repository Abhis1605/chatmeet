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
    <div className="relative border-t border-white/10 bg-[#0f172a]">
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
          className="p-2 rounded-full hover:bg-white/10 transition"
        >
          <Smile className="w-5 h-5 text-gray-400" />
        </button>

        {/* Attachment */}
        <button
          type="button"
          title="Attach file"
          aria-label="Attach file"
          disabled={disabled}
          onClick={() => setOpenAttachment(!openAttachment)}
          className="p-2 rounded-full hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition"
        >
          <Paperclip className="w-5 h-5 text-gray-400" />
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
          className="flex-1 rounded-full bg-white/5 px-5 py-3 text-white outline-none border border-white/10 focus:border-blue-500 disabled:cursor-not-allowed disabled:text-gray-500"
        />

        {/* Send */}

        <button
          type="button"
          title="Send message"
          aria-label="Send message"
          disabled={disabled}
          onClick={onSend}
          className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:cursor-not-allowed transition flex items-center justify-center"
        >
          <SendHorizontal className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
