"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useChats } from "@/hooks/queries/use-chats";
import { useCallHistory } from "@/hooks/queries/use-call-history";
import Spinner from "../Spinner";

const formatDuration = (seconds: number | null) => {
  if (seconds === null) return "In progress";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 1) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
};

const formatStartedAt = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

/**
 * VideoCallListPanel — lets the user pick who to video-call, mirroring the
 * Chats/Groups list panels. Selecting a chat sets activeChatId, which is
 * what VideoCallMainPanel and the call API routes key off of.
 */
export default function VideoCallListPanel() {
  const { data: session } = useSession();
  const { setActiveChatId, activeChatId } = useChatUIStore();
  const [subTab, setSubTab] = useState<"personal" | "history">("personal");
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const { data: chats, isLoading } = useChats("personal");

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCallHistory();

  const historyCalls = useMemo(
    () => historyData?.pages.flatMap((page) => page.calls) ?? [],
    [historyData]
  );

  return (
    <div className="w-[320px] border-r border-border flex flex-col">
      {/* HEADER */}
      <div className="p-3 border-b border-border">
        <h2 className="text-foreground font-semibold mb-3">Video Call</h2>

        <div className="flex gap-1 bg-surface-soft rounded-md p-1">
          <button
            type="button"
            onClick={() => setSubTab("personal")}
            className={`flex-1 py-1.5 text-sm rounded-md transition ${
              subTab === "personal"
                ? "bg-surface text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            Meet
          </button>
          <button
            type="button"
            onClick={() => setSubTab("history")}
            className={`flex-1 py-1.5 text-sm rounded-md transition ${
              subTab === "history"
                ? "bg-surface text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto">
        {subTab === "personal" ? (
          <>
            {isLoading && <Spinner />}

            {Array.isArray(chats) && chats.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted">
                <img
                  src="/empty-state-no-messages.png"
                  alt="No chats"
                  className="w-32 h-32 object-contain opacity-90"
                />
                <p className="text-sm">No personal chats yet</p>
              </div>
            )}

            {Array.isArray(chats) &&
              chats.map((chat) => {
                const otherUser = chat.members?.find(
                  (m) => m.user.id !== session?.user?.id
                )?.user;

                const title = chat.isGroup ? chat.name : otherUser?.name || otherUser?.email;
                const subtitle = chat.isGroup
                  ? `${chat.members?.length ?? 0} members`
                  : otherUser?.isOnline
                    ? "Online"
                    : "Offline";

                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                      activeChatId === chat.id ? "bg-surface-soft" : "hover:bg-surface-soft"
                    }`}
                  >
                    <img
                      alt="avatar-img"
                      src={
                        chat.isGroup
                          ? "/chatmeet-collapsed-logo.png"
                          : otherUser?.image || "/default-avatar.png"
                      }
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{title}</p>
                      <p className="text-xs text-muted truncate">{subtitle}</p>
                    </div>
                  </div>
                );
              })}
          </>
        ) : (
          <>
            {isLoadingHistory && <Spinner />}

            {!isLoadingHistory && historyCalls.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted">
                <img
                  src="/empty-state-no-calls.png"
                  alt="No calls"
                  className="w-32 h-32 object-contain opacity-90"
                />
                <p className="text-sm">No call history yet</p>
              </div>
            )}

            {historyCalls.map((call) => {
              const isExpanded = expandedCallId === call.id;
              const badgeClass =
                call.outcome === "Completed"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : call.outcome === "Active"
                    ? "bg-blue-500/10 text-blue-300"
                    : call.outcome === "Declined"
                      ? "bg-yellow-500/10 text-yellow-300"
                      : "bg-red-500/10 text-red-300";

              return (
                <div key={call.id} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                    className="w-full p-3 text-left hover:bg-surface-soft transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">
                          {call.displayName}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {call.type === "GROUP" ? "Group" : "Personal"} ·{" "}
                          {formatDuration(call.durationSeconds)}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {call.outcome}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-muted">
                      {formatStartedAt(call.startedAt)}
                    </p>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {call.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <img
                              src={participant.image || "/default-avatar.png"}
                              alt="participant"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-foreground truncate">
                              {participant.name || participant.email}
                              {participant.isStarter ? " (host)" : ""}
                            </span>
                          </div>
                          <span className="text-muted shrink-0">
                            {participant.status.toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="m-3 w-[calc(100%-1.5rem)] rounded-md bg-surface-soft py-2 text-sm text-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
