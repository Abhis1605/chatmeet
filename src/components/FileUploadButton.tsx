"use client";

import { UploadButton } from "@uploadthing/react";
import { UploadRouter } from "@/app/api/uploadthing/core";

interface FileUploadButtonProps {
  onUploadComplete: (file: any) => void;
}

export default function FileUploadButton({
  onUploadComplete,
}: FileUploadButtonProps) {
  return (
    <UploadButton<UploadRouter>
      endpoint="messageUploader"
      onClientUploadComplete={(res) => {
        if (!res?.length) return;

        onUploadComplete(res[0]);
      }}
      onUploadError={(error) => {
        console.error(error);
        alert(error.message);
      }}
      appearance={{
        button:
          "bg-transparent text-white hover:bg-white/10 rounded-lg px-3 py-2",
        allowedContent: "hidden",
      }}
    />
  );
}