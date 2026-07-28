"use client";

import { canManageGroup, GROUP_ROLES } from "@/lib/groupPermissions";
import { useDebounce } from "@/hooks/useDebounce";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "cmdk";
import { Shield, Trash2, UserPlus, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useUserSearch } from "@/hooks/queries/use-user-search";
import {
  useAddGroupMember,
  useUpdateGroupMember,
  useRemoveGroupMember,
  useDeleteGroup,
} from "@/hooks/mutations/use-group-member";
import type { ChatMemberRole } from "@/types/dto/chat.dto";

interface GroupMembersModalProps {
  open: boolean;
  onClose: () => void;
  chat: any;
  currentUserId?: string;
}

export default function GroupMembersModal({
  open,
  onClose,
  chat,
  currentUserId,
}: GroupMembersModalProps) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);

  const { data: allSearchResults = [] } = useUserSearch(debounced);

  const { mutate: addMember, isPending: isAdding } = useAddGroupMember();
  const { mutate: updateMember, isPending: isUpdating } = useUpdateGroupMember();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveGroupMember();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();

  const [workingId, setWorkingId] = useState<string | null>(null);

  const currentMember = chat?.members?.find(
    (member: any) => member.userId === currentUserId || member.user?.id === currentUserId,
  );
  const canManage = canManageGroup(currentMember?.role);
  const memberUserIds = useMemo(
    () => new Set(chat?.members?.map((member: any) => member.userId) ?? []),
    [chat?.members],
  );

  const results = useMemo(() => {
    return allSearchResults.filter((user) => !memberUserIds.has(user.id));
  }, [allSearchResults, memberUserIds]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleAddMember = (user: any) => {
    setWorkingId(user.id);
    addMember(
      { chatId: chat.id, userId: user.id },
      {
        onSettled: () => setWorkingId(null),
        onSuccess: () => {
          setSearch("");
        },
      }
    );
  };

  const handleUpdateMember = (member: any, body: any) => {
    setWorkingId(member.id);
    updateMember(
      { chatId: chat.id, memberId: member.id, ...body },
      {
        onSettled: () => setWorkingId(null),
      }
    );
  };

  const handleRemoveMember = (member: any) => {
    setWorkingId(member.id);
    removeMember(
      { chatId: chat.id, memberId: member.id },
      {
        onSettled: () => setWorkingId(null),
      }
    );
  };

  const handleDeleteGroup = () => {
    setWorkingId(chat.id);
    deleteGroup(
      { chatId: chat.id },
      {
        onSettled: () => setWorkingId(null),
        onSuccess: () => onClose(),
      }
    );
  };

  if (!open || !chat) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16">
      <div className="w-140 max-w-[92vw] bg-[#111827] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-white text-sm font-semibold">{chat.name}</p>
            <p className="text-gray-400 text-xs">{chat.members?.length ?? 0} members</p>
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
          {canManage && (
            <Command shouldFilter={false} className="rounded-lg border border-white/10 overflow-hidden bg-[#0f172a]">
              <CommandInput
                placeholder="Add member by email..."
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
                    onSelect={() => handleAddMember(user)}
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
          )}

          <div className="space-y-2 max-h-90 overflow-y-auto pr-1">
            {chat.members?.map((member: any) => {
              const isCreator = member.role === GROUP_ROLES.CREATOR;
              const isAdmin = member.role === GROUP_ROLES.ADMIN;
              const disabled = !canManage || isCreator || workingId === member.id || isUpdating || isRemoving || isAdding;

              return (
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

                  <button
                    type="button"
                    disabled={disabled}
                    title={isAdmin ? "Make member" : "Make admin"}
                    aria-label={isAdmin ? "Make member" : "Make admin"}
                    onClick={() =>
                      handleUpdateMember(member, {
                        role: isAdmin ? GROUP_ROLES.MEMBER : GROUP_ROLES.ADMIN,
                      })
                    }
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition"
                  >
                    <Shield className="w-4 h-4" />
                  </button>

                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={isCreator || isAdmin || Boolean(member.canSend)}
                      disabled={disabled || isAdmin}
                      onChange={(e) =>
                        handleUpdateMember(member, {
                          canSend: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-blue-600"
                    />
                    Message
                  </label>

                  <button
                    type="button"
                    disabled={disabled}
                    title="Remove member"
                    aria-label="Remove member"
                    onClick={() => handleRemoveMember(member)}
                    className="p-2 rounded-md text-gray-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {canManage && (
            <button
              type="button"
              disabled={workingId === chat.id || isDeleting}
              onClick={handleDeleteGroup}
              className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-60 transition"
            >
              {workingId === chat.id || isDeleting ? "Deleting..." : "Delete Group"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
