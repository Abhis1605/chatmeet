"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { showError } from "@/lib/toast";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "cmdk";
import { Check, Plus, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useUserSearch } from "@/hooks/queries/use-user-search";
import { useCreateGroup } from "@/hooks/mutations/use-create-group";
import { getAvatarSrc } from "@/lib/avatars";

interface GroupCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GroupCreateModal({ open, onClose }: GroupCreateModalProps) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const debounced = useDebounce(search, 400);

  const { data: results = [] } = useUserSearch(debounced);
  const { mutate: createGroupMutation, isPending: saving } = useCreateGroup();

  const selectedIds = useMemo(
    () => new Set(selectedUsers.map((user) => user.id)),
    [selectedUsers],
  );

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const toggleUser = (user: any) => {
    if (selectedIds.has(user.id)) {
      setSelectedUsers((users) => users.filter((item) => item.id !== user.id));
      return;
    }

    setSelectedUsers((users) => [...users, user]);
  };

  const reset = () => {
    setName("");
    setSearch("");
    setSelectedUsers([]);
  };

  const createGroup = () => {
    if (!name.trim()) {
      showError("Group name is required");
      return;
    }

    createGroupMutation(
      {
        name,
        memberIds: selectedUsers.map((user) => user.id),
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="w-125 bg-surface rounded-xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-foreground text-sm font-semibold">Create Group</p>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg bg-surface-soft px-4 py-3 text-foreground outline-none border border-border focus:border-primary"
          />

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user)}
                  className="flex items-center gap-2 rounded-full bg-primary-soft border border-primary/30 px-3 py-1.5 text-xs text-primary cursor-pointer"
                >
                  {user.name || user.email}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <Command shouldFilter={false} className="rounded-lg border border-border overflow-hidden bg-surface-soft">
            <CommandInput
              placeholder="Search members by email..."
              value={search}
              onValueChange={setSearch}
              className="px-4 py-3 text-foreground bg-transparent outline-none border-b border-border"
            />
            <CommandList className="max-h-58 overflow-y-auto">
              {results.length === 0 && search && (
                <CommandEmpty className="p-4 text-muted text-sm">
                  No user found
                </CommandEmpty>
              )}

              {results.map((user) => {
                const selected = selectedIds.has(user.id);

                return (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.email}`}
                    onSelect={() => toggleUser(user)}
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
                    {selected ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>

          <button
            type="button"
            disabled={saving}
            onClick={createGroup}
            className="btn-primary w-full disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
