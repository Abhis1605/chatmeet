"use client";

import { useEffect, useMemo, useState } from "react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "cmdk";
import { Trash2, UserPlus, X } from "lucide-react";
import type { RoomDto } from "@/types/dto/room.dto";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserSearch } from "@/hooks/queries/use-user-search";
import { useSendInvite } from "@/hooks/mutations/use-send-invite";
import { useLeaveRoom } from "@/hooks/mutations/use-leave-room";
import { useDeleteRoom } from "@/hooks/mutations/use-delete-room";

interface RoomMembersModalProps {
  open: boolean;
  onClose: () => void;
  room: RoomDto;
  currentUserId?: string;
}

export default function RoomMembersModal({
  open,
  onClose,
  room,
  currentUserId,
}: RoomMembersModalProps) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);

  const { data: allSearchResults = [] } = useUserSearch(debounced);
  const { mutate: sendInvite, isPending: isInviting } = useSendInvite();
  const { mutate: leaveRoom, isPending: isLeaving } = useLeaveRoom();
  const { mutate: deleteRoom, isPending: isDeleting } = useDeleteRoom();

  const [workingId, setWorkingId] = useState<string | null>(null);

  const currentMember = room.members.find(
    (member) => member.userId === currentUserId || member.user?.id === currentUserId
  );
  const isCreator = currentMember?.role === "CREATOR";

  const memberUserIds = useMemo(
    () => new Set(room.members.map((member) => member.userId)),
    [room.members]
  );

  const results = useMemo(
    () => allSearchResults.filter((user) => !memberUserIds.has(user.id)),
    [allSearchResults, memberUserIds]
  );

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleInvite = (user: { id: string }) => {
    setWorkingId(user.id);
    sendInvite(
      { chatId: room.id, invitedUserId: user.id },
      {
        onSettled: () => setWorkingId(null),
        onSuccess: () => setSearch(""),
      }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16">
      <div className="w-140 max-w-[92vw] bg-[#111827] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-white text-sm font-semibold">{room.name}</p>
            <p className="text-gray-400 text-xs">{room.members.length} members</p>
          </div>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <Command shouldFilter={false} className="rounded-lg border border-white/10 overflow-hidden bg-[#0f172a]">
            <CommandInput
              placeholder="Invite member by email..."
              value={search}
              onValueChange={setSearch}
              className="px-4 py-3 text-white bg-transparent outline-none border-b border-white/10"
            />
            <CommandList className="max-h-44 overflow-y-auto">
              {results.length === 0 && search && (
                <CommandEmpty className="p-4 text-gray-400 text-sm">
                  No new user found
                </CommandEmpty>
              )}

              {results.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.email}`}
                  onSelect={() => handleInvite(user)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/10 transition"
                >
                  <img
                    src={user.image || "/default-avatar.png"}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {user.name || "No Name"}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{user.email}</p>
                  </div>
                  <UserPlus className="w-4 h-4 text-gray-400" />
                </CommandItem>
              ))}
            </CommandList>
          </Command>

          <div className="space-y-2 max-h-90 overflow-y-auto pr-1">
            {room.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3"
              >
                <img
                  src={member.user?.image || "/default-avatar.png"}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">
                      {member.user?.name || member.user?.email}
                    </p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                      {member.role}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs truncate">{member.user?.email}</p>
                </div>
              </div>
            ))}
          </div>

          {!isCreator && (
            <button
              type="button"
              disabled={isLeaving}
              onClick={() =>
                leaveRoom(room.id, {
                  onSuccess: () => onClose(),
                })
              }
              className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200 hover:bg-amber-500/20 disabled:opacity-60 transition"
            >
              {isLeaving ? "Leaving..." : "Leave Room"}
            </button>
          )}

          {isCreator && (
            <button
              type="button"
              disabled={isDeleting || workingId === room.id || isInviting}
              onClick={() =>
                deleteRoom(room.id, {
                  onSuccess: () => onClose(),
                })
              }
              className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete Room"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
