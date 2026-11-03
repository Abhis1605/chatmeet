"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useChats } from "@/hooks/queries/use-chats";
import { useRooms } from "@/hooks/queries/use-rooms";
import { useForwardMessage } from "@/hooks/mutations/use-forward-message";
import { getAvatarSrc } from "@/lib/avatars";
import { showError } from "@/lib/toast";

interface ForwardModalProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  message: any;
}

type ForwardTarget = {
  id: string;
  title: string;
  image?: string | null;
  subtitle: string;
  otherUser?: any;
};

function getChatTitle(chat: any, currentUserId?: string) {
  if (chat.isGroup) return chat.name || "Group";
  const other = chat.members?.find(
    (member: any) =>
      (member.userId || member.user?.id) !== currentUserId
  )?.user;
  return other?.name || other?.email || "Direct chat";
}

export default function ForwardModal({
  open,
  onClose,
  chatId,
  message,
}: ForwardModalProps) {
  const { data: session } = useSession();
  const { data: personal = [] } = useChats("personal");
  const { data: groups = [] } = useChats("group");
  const { data: rooms = [] } = useRooms();
  const { mutate: forward, isPending } = useForwardMessage(chatId);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const targets = useMemo<ForwardTarget[]>(() => {
    const currentUserId = session?.user?.id;
    const all: ForwardTarget[] = [
      ...personal
        .filter((chat) => chat.id !== chatId)
        .map((chat) => ({
          id: chat.id,
          title: getChatTitle(chat, currentUserId),
          image: chat.isGroup
            ? chat.image
            : getAvatarSrc(
                chat.members?.find(
                  (member: any) =>
                    (member.userId || member.user?.id) !== currentUserId
                )?.user
              ),
          subtitle: chat.isGroup
            ? `${chat.members?.length ?? 0} members`
            : "Direct message",
        })),
      ...groups
        .filter((chat) => chat.id !== chatId)
        .map((chat) => ({
          id: chat.id,
          title: getChatTitle(chat, currentUserId),
          image: chat.image || "/chatmeet-collapsed-logo.png",
          subtitle: `${chat.members?.length ?? 0} members`,
        })),
      ...rooms
        .filter((room) => room.id !== chatId)
        .map((room) => ({
          id: room.id,
          title: room.name || "Room",
          image: room.image || "/chatmeet-collapsed-logo.png",
          subtitle: `${room.members?.length ?? 0} members · Room`,
        })),
    ];

    const term = search.trim().toLowerCase();
    return term
      ? all.filter((target) => target.title.toLowerCase().includes(term))
      : all;
  }, [personal, groups, rooms, chatId, session?.user?.id, search]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((candidate) => candidate !== id)
        : [...previous, id]
    );
  };

  const handleForward = () => {
    if (!selected.length) return;
    forward(
      { messageId: message.id, targetChatIds: selected },
      {
        onSuccess: () => {
          toast.success(
            `Forwarded to ${selected.length} ${selected.length === 1 ? "chat" : "chats"}`
          );
          onClose();
        },
        onError: () => showError("Could not forward that message."),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Forward message"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Forward message</h2>
            <p className="text-xs text-muted">
              {selected.length > 0
                ? `${selected.length} selected`
                : "Pick one or more chats"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-muted hover:bg-surface-soft hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-soft px-3">
            <Search size={15} className="text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent py-2 text-sm text-foreground outline-none"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {targets.length === 0 && (
            <p className="p-6 text-center text-sm text-muted">No chats found.</p>
          )}
          {targets.map((target) => {
            const isSelected = selected.includes(target.id);
            return (
              <button
                key={target.id}
                type="button"
                onClick={() => toggle(target.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                  isSelected ? "bg-primary-soft" : "hover:bg-surface-soft"
                }`}
              >
                <img
                  src={target.image || "/chatmeet-collapsed-logo.png"}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {target.title}
                  </p>
                  <p className="truncate text-xs text-muted">{target.subtitle}</p>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border text-transparent"
                  }`}
                >
                  <Check size={12} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border p-3">
          <button
            type="button"
            disabled={!selected.length || isPending}
            onClick={handleForward}
            className="btn-primary w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Forwarding..." : "Forward"}
          </button>
        </div>
      </div>
    </div>
  );
}
