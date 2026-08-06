"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Video, X } from "lucide-react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useActiveCall } from "@/hooks/queries/use-active-call";
import { useStartCall } from "@/hooks/mutations/use-start-call";
import { getCallToken } from "@/services/call.service";
import CallRoomView from "./CallRoomView";

/**
 * SidebarCallPanel — video-call entry point for the currently active chat.
 * Self-contained: does not read or mutate chat, message, group, room, or
 * socket state. Manual join/start/end only (no signaling, no ringing).
 */
export default function SidebarCallPanel() {
  const activeChatId = useChatUIStore((state) => state.activeChatId);
  const { data: session } = useSession();

  const { data: activeCall, isLoading: isLoadingActiveCall } = useActiveCall(activeChatId);
  const { mutate: startCallMutation, isPending: isStarting } = useStartCall();

  const [open, setOpen] = useState(false);
  const [joinState, setJoinState] = useState<{
    token: string;
    userName: string;
    isStarter: boolean;
  } | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closePanel = () => {
    setOpen(false);
    setJoinState(null);
    setError(null);
  };

  const joinSession = async (sessionId: string, isStarter: boolean) => {
    setJoinLoading(true);
    setError(null);
    try {
      const { token, userName } = await getCallToken(sessionId);
      setJoinState({ token, userName, isStarter });
    } catch {
      setError("Could not join the call. Please try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleStart = () => {
    if (!activeChatId) return;
    setError(null);
    startCallMutation(activeChatId, {
      onSuccess: (result) => {
        joinSession(result.callSessionId, true);
      },
      onError: () => setError("Could not start the call. Please try again."),
    });
  };

  const handleJoin = () => {
    if (!activeCall) return;
    const isStarter = activeCall.startedById === session?.user?.id;
    joinSession(activeCall.id, isStarter);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!activeChatId}
        title={activeChatId ? "Video Call" : "Select a chat first"}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-white/5 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Video size={18} />
        <span>Video Call</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-lg w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">Video Call</h3>
              <button
                type="button"
                onClick={closePanel}
                title="Close"
                className="p-1.5 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 min-h-0">
              {!activeChatId ? (
                <div className="p-6 text-center text-gray-400">
                  Select a chat to start or join a video call.
                </div>
              ) : joinState ? (
                <CallRoomView
                  sessionId={activeCall?.id ?? ""}
                  token={joinState.token}
                  userName={joinState.userName}
                  isStarter={joinState.isStarter}
                  onLeave={closePanel}
                />
              ) : (
                <div className="p-6 flex flex-col items-center justify-center gap-4 h-full">
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                  {isLoadingActiveCall ? (
                    <p className="text-gray-400 text-sm">Checking for an active call...</p>
                  ) : activeCall ? (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joinLoading}
                      className="btn-primary py-2 px-5 text-sm disabled:opacity-50"
                    >
                      {joinLoading ? "Joining..." : "Join Call"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={isStarting || joinLoading}
                      className="btn-primary py-2 px-5 text-sm disabled:opacity-50"
                    >
                      {isStarting || joinLoading ? "Starting..." : "Start Video Call"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
