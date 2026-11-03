"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Phone, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveCall } from "@/hooks/queries/use-active-call";
import { useStartCall } from "@/hooks/mutations/use-start-call";
import { getCallToken } from "@/services/call.service";
import { queryKeys } from "@/lib/query-keys";
import { showError } from "@/lib/toast";
import CallRoomView from "./CallRoomView";
import type { CallMediaType } from "@/types/dto/call.dto";

interface CallLauncherProps {
  chatId: string;
  callType?: "ONE_TO_ONE" | "GROUP";
}

interface InCallState {
  sessionId: string;
  token: string;
  userName: string;
  isStarter: boolean;
  mediaType: CallMediaType;
}

const BUTTON_CLASS =
  "p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Starts or joins a video/voice call for the given chat from anywhere in the
 * app (DM, group, or room) and renders the call in a full-screen overlay.
 */
export default function CallLauncher({
  chatId,
  callType = "ONE_TO_ONE",
}: CallLauncherProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: activeCall } = useActiveCall(chatId);
  const { mutateAsync: startCallAsync } = useStartCall();
  const [inCall, setInCall] = useState<InCallState | null>(null);
  const [busy, setBusy] = useState<CallMediaType | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!inCall) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [inCall]);

  const startOrJoin = async (mediaType: CallMediaType) => {
    if (busy) return;
    setBusy(mediaType);

    try {
      const sessionId =
        activeCall?.id ??
        (await startCallAsync({ chatId, type: callType, mediaType }))
          .callSessionId;

      const { token, userName, mediaType: tokenMediaType } =
        await getCallToken(sessionId);

      setInCall({
        sessionId,
        token,
        userName,
        isStarter: activeCall
          ? activeCall.startedById === session?.user?.id
          : true,
        mediaType: tokenMediaType ?? mediaType,
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not start the call. Please try again.";
      showError(message);
    } finally {
      setBusy(null);
    }
  };

  const handleLeave = () => {
    setInCall(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.active(chatId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.history });
  };

  const activeMediaType = activeCall?.mediaType;

  return (
    <>
      {activeCall ? (
        <button
          type="button"
          title={
            activeMediaType === "AUDIO"
              ? "Join ongoing voice call"
              : "Join ongoing video call"
          }
          aria-label={
            activeMediaType === "AUDIO"
              ? "Join ongoing voice call"
              : "Join ongoing video call"
          }
          onClick={() => startOrJoin(activeMediaType ?? "VIDEO")}
          disabled={busy !== null}
          className={`${BUTTON_CLASS} text-green-500 hover:text-green-400`}
        >
          {activeMediaType === "AUDIO" ? (
            <Phone className="h-5 w-5" />
          ) : (
            <Video className="h-5 w-5" />
          )}
        </button>
      ) : (
        <>
          <button
            type="button"
            title="Start video call"
            aria-label="Start video call"
            onClick={() => startOrJoin("VIDEO")}
            disabled={busy !== null}
            className={BUTTON_CLASS}
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="Start voice call"
            aria-label="Start voice call"
            onClick={() => startOrJoin("AUDIO")}
            disabled={busy !== null}
            className={BUTTON_CLASS}
          >
            <Phone className="h-5 w-5" />
          </button>
        </>
      )}

      {mounted &&
        inCall &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={
              inCall.mediaType === "AUDIO" ? "Voice call" : "Video call"
            }
          >
            <div className="h-full w-full overflow-hidden bg-surface sm:h-[85vh] sm:max-w-5xl sm:rounded-xl sm:border sm:border-border">
              <CallRoomView
                sessionId={inCall.sessionId}
                token={inCall.token}
                userName={inCall.userName}
                isStarter={inCall.isStarter}
                mediaType={inCall.mediaType}
                onLeave={handleLeave}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
