"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { showError, showSuccess } from "@/lib/toast";
import { useChatStore } from "@/store/useChatStore";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "cmdk";
import { Check, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface GroupCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GroupCreateModal({ open, onClose }: GroupCreateModalProps) {
  const { addChat, setSelectedChat } = useChatStore();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const debounced = useDebounce(search, 400);

  const selectedIds = useMemo(
    () => new Set(selectedUsers.map((user) => user.id)),
    [selectedUsers],
  );

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debounced) {
        setResults([]);
        return;
      }

      const res = await fetch(`/api/user/search?email=${debounced}`);
      const data = await res.json();
      setResults(data);
    };

    if (open) fetchUsers();
  }, [debounced, open]);

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
    setResults([]);
    setSelectedUsers([]);
  };

  const createGroup = async () => {
    if (!name.trim()) {
      showError("Group name is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          memberIds: selectedUsers.map((user) => user.id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Could not create group");
        return;
      }

      addChat(data);
      setSelectedChat(data);
      showSuccess("Group created");
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="w-125 bg-[#111827] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-white text-sm font-semibold">Create Group</p>
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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white outline-none border border-white/10 focus:border-blue-500"
          />

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user)}
                  className="flex items-center gap-2 rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-100"
                >
                  {user.name || user.email}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <Command shouldFilter={false} className="rounded-lg border border-white/10 overflow-hidden bg-[#0f172a]">
            <CommandInput
              placeholder="Search members by email..."
              value={search}
              onValueChange={setSearch}
              className="px-4 py-3 text-white bg-transparent outline-none border-b border-white/10"
            />
            <CommandList className="max-h-58 overflow-y-auto">
              {results.length === 0 && search && (
                <CommandEmpty className="p-4 text-gray-400 text-sm">
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
                    {selected ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Plus className="w-4 h-4 text-gray-400" />
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
