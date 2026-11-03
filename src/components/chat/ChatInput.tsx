"use client";

import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Check, Mic, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import AttachmentMenu from "./AttachmentMenu";

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onUpload: (file: any) => void;
  onVoiceNote?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  showAttachments?: boolean;
}

const MAX_RECORDING_SECONDS = 300;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function ChatInput({
  input,
  onChange,
  onSend,
  onUpload,
  onVoiceNote,
  disabled = false,
  placeholder = "Type a message...",
  showAttachments = true,
}: ChatInputProps) {
  const [openAttachment, setOpenAttachment] = useState(false);
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupRecorder = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const stopRecorder = (discard = false) => {
    discardRef.current = discard;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      cleanupRecorder();
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const startRecording = async () => {
    if (!onVoiceNote || disabled || isRecording) return;
    setRecordError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = candidates.find(
        (candidate) =>
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported(candidate)
      );

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const chunks = chunksRef.current;
        const discarded = discardRef.current;
        const type = recorder.mimeType || mimeType || "audio/webm";

        cleanupRecorder();
        setIsRecording(false);
        setRecordingSeconds(0);

        if (discarded || !chunks.length) return;

        const extension = type.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunks, { type });
        onVoiceNote(
          new File([blob], `voice-note-${Date.now()}.${extension}`, { type })
        );
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((previous) => {
          const next = previous + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            setTimeout(() => stopRecorder(false), 0);
            return MAX_RECORDING_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      cleanupRecorder();
      setIsRecording(false);
      setRecordError(
        error instanceof Error
          ? error.message
          : "Could not access your microphone."
      );
    }
  };

  useEffect(() => {
    return () => {
      discardRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      cleanupRecorder();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative border-t border-border bg-surface">
      {/* Attachment Popup */}
      <AttachmentMenu
        open={openAttachment}
        onClose={() => setOpenAttachment(false)}
        imageInputRef={imageInputRef}
        videoInputRef={videoInputRef}
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
        ref={videoInputRef}
        hidden
        type="file"
        accept="video/*"
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

      {recordError && (
        <p className="px-4 pt-2 text-xs text-error" role="alert">
          {recordError}
        </p>
      )}

      {openEmojiPicker && (
        <div className="absolute bottom-20 left-2 z-50">
          <EmojiPicker
            onEmojiClick={(emoji: EmojiClickData) => {
              onChange(`${input}${emoji.emoji}`);
              setOpenEmojiPicker(false);
            }}
            theme="auto"
            lazyLoadEmojis
          />
        </div>
      )}

      <div className="flex items-center gap-1 p-2 sm:gap-2 sm:p-3">
        {isRecording ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-error/40 bg-error/10 px-4 py-3">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
              <span className="text-sm font-medium text-foreground">
                Recording {formatDuration(recordingSeconds)}
              </span>
              <span className="ml-auto text-xs text-muted">max 5:00</span>
            </div>
            <button
              type="button"
              title="Cancel recording"
              aria-label="Cancel recording"
              onClick={() => stopRecorder(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-soft text-error transition hover:bg-error/10"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Send voice note"
              aria-label="Send voice note"
              onClick={() => stopRecorder(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary transition hover:bg-primary-hover"
            >
              <Check className="h-5 w-5 text-on-primary" />
            </button>
          </>
        ) : (
          <>
            {/* Emoji */}
            <button
              type="button"
              title="Emoji"
              aria-label="Open emoji picker"
              disabled={disabled}
              onClick={() => {
                setOpenEmojiPicker((open) => !open);
                setOpenAttachment(false);
              }}
              className="p-2 rounded-full hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Smile className="w-5 h-5 text-muted" />
            </button>

            {/* Attachment */}
            {showAttachments && (
              <button
                type="button"
                title="Attach file"
                aria-label="Attach file"
                disabled={disabled}
                onClick={() => setOpenAttachment(!openAttachment)}
                className="p-2 rounded-full hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed"
              >
                <Paperclip className="w-5 h-5 text-muted" />
              </button>
            )}

            {/* Input */}
            <input
              value={input}
              onChange={(event) => onChange(event.target.value)}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSend();
                }
              }}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-full bg-surface-soft px-3 py-3 text-foreground outline-none border border-border focus:border-primary disabled:cursor-not-allowed disabled:text-muted sm:px-5"
            />

            {/* Voice note */}
            {onVoiceNote && (
              <button
                type="button"
                title="Record voice note"
                aria-label="Record voice note"
                disabled={disabled}
                onClick={() => void startRecording()}
                className="w-11 h-11 rounded-full bg-surface-soft hover:bg-border disabled:opacity-40 transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                <Mic className="w-5 h-5 text-muted" />
              </button>
            )}

            {/* Send */}
            <button
              type="button"
              title="Send message"
              aria-label="Send message"
              disabled={disabled}
              onClick={onSend}
              className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover disabled:bg-surface-soft transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              <SendHorizontal className="w-5 h-5 text-on-primary" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
