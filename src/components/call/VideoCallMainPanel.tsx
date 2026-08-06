"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useActiveCall } from "@/hooks/queries/use-active-call";
import { useStartCall } from "@/hooks/mutations/use-start-call";
import { getCallToken } from "@/services/call.service";
import CallRoomView from "./CallRoomView";

/**
 * VideoCallMainPanel — the main-content-area counterpart to VideoCallListPanel.
 * Shows start/join for whichever chat is selected via activeChatId, then the
 * live call itself. Manual join/start/end only, no signaling or ringing.
 */
export default function VideoCallMainPanel() {
  const activeChatId = useChatUIStore((state) => state.activeChatId);
  const { data: session } = useSession();

  const { data: activeCall, isLoading: isLoadingActiveCall } = useActiveCall(activeChatId);
  const { mutate: startCallMutation, isPending: isStarting } = useStartCall();

  const [joinState, setJoinState] = useState<{
    token: string;
    userName: string;
    isStarter: boolean;
  } | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetJoinState = () => {
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

  if (!activeChatId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a chat or group to start a video call
      </div>
    );
  }

  if (joinState) {
    return (
      <CallRoomView
        sessionId={activeCall?.id ?? ""}
        token={joinState.token}
        userName={joinState.userName}
        isStarter={joinState.isStarter}
        onLeave={resetJoinState}
      />
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
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
  );
}
