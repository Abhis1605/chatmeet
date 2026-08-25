"use client";

import { canManageGroup, GROUP_ROLES } from "@/lib/groupPermissions";
import { useDebounce } from "@/hooks/useDebounce";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "cmdk";
import { Check, Pencil, Shield, Trash2, UserPlus, X } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useUserSearch } from "@/hooks/queries/use-user-search";
import {
  useAddGroupMember,
  useUpdateGroupMember,
  useUpdateGroupDetails,
  useRemoveGroupMember,
  useDeleteGroup,
} from "@/hooks/mutations/use-group-member";
import type { ChatMemberRole } from "@/types/dto/chat.dto";
import { getAvatarSrc } from "@/lib/avatars";
import { useUploadThing } from "@/lib/uploadthing";
import { showError } from "@/lib/toast";

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
  const { mutate: updateDetails, isPending: isSavingDetails } = useUpdateGroupDetails();

  const [workingId, setWorkingId] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { startUpload, isUploading } = useUploadThing("avatarUploader", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url && chat?.id) {
        updateDetails({ chatId: chat.id, image: url });
      }
    },
    onUploadError: () => showError("Failed to upload photo"),
  });

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

  const startEditName = () => {
    setNameDraft(chat.name || "");
    setEditingName(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      showError("Group name cannot be empty");
      return;
    }
    updateDetails(
      { chatId: chat.id, name: trimmed },
      { onSuccess: () => setEditingName(false) },
    );
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await startUpload([file]);
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
      <div className="w-140 max-w-[92vw] bg-surface rounded-xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={chat.image || "/chatmeet-collapsed-logo.png"}
                alt="group avatar"
                className="w-11 h-11 rounded-full object-cover border border-border"
              />
              {canManage && (
                <button
                  type="button"
                  title="Change group photo"
                  aria-label="Change group photo"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-on-primary hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>

            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="min-w-0 flex-1 rounded-md bg-surface-soft px-2 py-1 text-sm text-foreground outline-none border border-border focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={saveName}
                    disabled={isSavingDetails}
                    className="p-1.5 rounded-md bg-primary text-on-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    disabled={isSavingDetails}
                    className="p-1.5 rounded-md border border-border text-muted hover:text-foreground cursor-pointer disabled:cursor-not-allowed"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="text-foreground text-sm font-semibold truncate">{chat.name}</p>
                  {canManage && (
                    <button
                      type="button"
                      title="Edit group name"
                      aria-label="Edit group name"
                      onClick={startEditName}
                      className="text-muted hover:text-foreground shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-muted text-xs">{chat.members?.length ?? 0} members</p>
            </div>
          </div>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {canManage && (
            <Command shouldFilter={false} className="rounded-lg border border-border overflow-hidden bg-surface-soft">
              <CommandInput
                placeholder="Add member by email..."
                value={search}
                onValueChange={setSearch}
                className="px-4 py-3 text-foreground bg-transparent outline-none border-b border-border"
              />
              <CommandList className="max-h-44 overflow-y-auto">
                {results.length === 0 && search && (
                  <CommandEmpty className="p-4 text-muted text-sm">
                    No new user found
                  </CommandEmpty>
                )}

                {results.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.email}`}
                    onSelect={() => handleAddMember(user)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-soft transition"
                  >
                    <img
                      src={getAvatarSrc(user)}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">
                        {user.name || "No Name"}
                      </p>
                      <p className="text-muted text-xs truncate">{user.email}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-muted" />
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

              const canSendChecked = isCreator || isAdmin || Boolean(member.canSend);

              return (
                <div
                  key={member.id}
                  className="rounded-lg bg-surface-soft border border-border p-3 space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarSrc(member.user)}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-foreground text-sm font-medium truncate">
                          {member.user?.name || member.user?.email}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] shrink-0 ${
                            isCreator || isAdmin
                              ? "bg-primary-soft text-primary"
                              : "bg-surface text-muted"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                      <p className="text-muted text-xs truncate">{member.user?.email}</p>
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      title="Remove member"
                      aria-label="Remove member"
                      onClick={() => handleRemoveMember(member)}
                      className="p-2 rounded-md text-muted hover:text-error hover:bg-error-soft disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!isCreator && (
                    <div className="flex items-center gap-2 pl-13">
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
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isAdmin
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border text-muted hover:text-foreground hover:bg-surface"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin
                      </button>

                      <label className="flex items-center gap-2 text-xs text-muted">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={canSendChecked}
                          disabled={disabled || isAdmin}
                          onClick={() =>
                            handleUpdateMember(member, { canSend: !canSendChecked })
                          }
                          className={`relative w-9 h-5 rounded-full transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            canSendChecked ? "bg-primary" : "bg-border"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              canSendChecked ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        Can message
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {canManage && (
            <button
              type="button"
              disabled={workingId === chat.id || isDeleting}
              onClick={handleDeleteGroup}
              className="w-full rounded-lg border border-error/30 bg-error-soft px-4 py-2.5 text-sm text-error hover:bg-error-soft disabled:opacity-60 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {workingId === chat.id || isDeleting ? "Deleting..." : "Delete Group"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
