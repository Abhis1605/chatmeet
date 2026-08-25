"use client";

import { File, ImageIcon } from "lucide-react";
import React from "react";

interface AttachmentMenuProps {
  open: boolean;
  onClose: () => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function AttachmentMenu({
  open,
  onClose,
  imageInputRef,
  fileInputRef,
}: AttachmentMenuProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-20 left-14 z-50 w-60 rounded-2xl border border-border bg-surface p-2 shadow-2xl">

      <button
        type="button"
        onClick={() => {
          imageInputRef.current?.click();
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-surface-soft cursor-pointer"
      >
        <ImageIcon className="h-5 w-5 text-green-400" />

        <span className="text-foreground">
          Photos & Videos
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          fileInputRef.current?.click();
          onClose();
        }}
        className="mt-1 flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-white/5 cursor-pointer"
      >
        <File className="h-5 w-5 text-blue-400" />

        <span className="text-foreground">
          Documents
        </span>
      </button>

    </div>
  );
}