"use client";

import {
  Command,
  CommandList,
  CommandInput,
  CommandItem,
  CommandEmpty,
} from "cmdk";

import { useDebounce } from "@/hooks/useDebounce";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useUserSearch } from "@/hooks/queries/use-user-search";
import { useCreateChat } from "@/hooks/mutations/use-create-chat";

export default function ChatSearchCommand({
  open,
  setOpen,
}: any) {
  const { data: session } = useSession();

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);

  const { data: results = [] } = useUserSearch(debounced);
  const { mutate: createChat } = useCreateChat();

  const formatPresence = (user: any) => {
    if (user?.isOnline) return "Online";
    if (!user?.lastSeen) return "Offline";

    return `Last seen ${new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(user.lastSeen))}`;
  };

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, setOpen]);

  // Start chat
  const startChat = (user: any) => {
    if (!session?.user?.id) return;
    
    createChat(user.id, {
      onSuccess: () => {
        setOpen(false);
        setSearch("");
      }
    });
  };

  // Don't render if closed
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24">

      <div className="w-125 bg-[#111827] rounded-xl shadow-2xl border border-white/10 overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-white text-sm font-semibold">
            Search Users
          </p>

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white text-lg transition"
          >
            ✕
          </button>
        </div>

        <Command shouldFilter={false}>

          {/* INPUT */}
          <CommandInput
            autoFocus
            placeholder="Search by name or email..."
            value={search}
            onValueChange={setSearch}
            className="px-4 py-3 text-white bg-transparent outline-none border-b border-white/10"
          />

          {/* LIST */}
          <CommandList className="max-h-75 overflow-y-auto">

            {/* EMPTY */}
            {results.length === 0 && search && (
              <CommandEmpty className="p-4 text-gray-400 text-sm">
                No user found
              </CommandEmpty>
            )}

            {/* RESULTS */}
            {results.map((user) => (
              <CommandItem
                key={user.id}
                value={`${user.name} ${user.email}`} 
                onSelect={() => startChat(user)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/10 transition"
              >
                {/* AVATAR */}
                <img
                  src={user.image || "/default-avatar.png"}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover"
                />

                {/* NFO */}
                <div className="flex flex-col">
                  <span className="text-white text-sm font-medium">
                    {user.name || "No Name"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {user.email}
                  </span>
                  <span className={`text-xs ${user.isOnline ? "text-green-400" : "text-gray-500"}`}>
                    {formatPresence(user)}
                  </span>
                </div>
              </CommandItem>
            ))}

          </CommandList>
        </Command>
      </div>
    </div>
  );
}