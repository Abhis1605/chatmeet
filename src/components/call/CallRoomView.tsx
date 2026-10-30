"use client";

import { useEffect, useRef, useState } from "react";
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectPeers,
  selectIsConnectedToRoom,
  useVideo,
  useAVToggle,
  useScreenShare,
} from "@100mslive/react-sdk";
import type { HMSPeer } from "@100mslive/react-sdk";
import { Mic, MicOff, Video, VideoOff, PhoneOff, LogOut, MonitorUp, MonitorStop } from "lucide-react";
import { useEndCall } from "@/hooks/mutations/use-end-call";

interface CallRoomViewProps {
  sessionId: string;
  token: string;
  userName: string;
  isStarter: boolean;
  onLeave: () => void;
}

// Each mount of CallRoomInner creates its own HMSRoomProvider/SDK instance
// (see the default export below), and the previous instance's leave() on
// unmount is fire-and-forget. Without this, a quick leave->rejoin can call
// join() (and getUserMedia) before the old instance has actually released
// the camera, surfacing as a DeviceInUse (3003) error from the SDK. Track
// the in-flight leave() across mounts so the next join() waits for it.
let pendingLeave: Promise<void> | null = null;

function PeerTile({ peer }: { peer: HMSPeer }) {
  const { videoRef } = useVideo({ trackId: peer.videoTrack });

  return (
    <div className="relative bg-black/40 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
      <video ref={videoRef} autoPlay muted={peer.isLocal} playsInline className="w-full h-full object-cover" />
      <span className="absolute bottom-1 left-2 text-xs text-white/90 bg-black/50 px-2 py-0.5 rounded">
        {peer.name} {peer.isLocal && "(You)"}
      </span>
    </div>
  );
}

function ScreenShareTile({ trackId, name }: { trackId: string; name: string }) {
  const { videoRef } = useVideo({ trackId });

  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-black/50 aspect-video">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-contain" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {name} is sharing their screen
      </span>
    </div>
  );
}

function CallRoomInner({ sessionId, token, userName, isStarter, onLeave }: CallRoomViewProps) {
  const [joinError, setJoinError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isTogglingScreenShare, setIsTogglingScreenShare] = useState(false);
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const {
    isLocalAudioEnabled,
    isLocalVideoEnabled,
    toggleAudio,
    toggleVideo,
  } = useAVToggle((error) => {
    console.error("Call media control failed:", error);
    if (error.message.includes("Device in use") || error.name === "DeviceInUse") {
      setMediaError("Your camera is being used by another app or browser tab. Close it there, then try again.");
      return;
    }
    setMediaError("Your camera could not be accessed. Check browser permissions and try again.");
  });
  const {
    amIScreenSharing,
    toggleScreenShare,
    screenShareVideoTrackId,
    screenSharingPeerName,
  } = useScreenShare((error) => {
    console.warn("Screen sharing was not started:", error);
    setShareError("Screen sharing was not started. Allow screen capture in your browser and try again.");
  });
  const { mutate: endCallMutation, isPending: isEnding } = useEndCall();

  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    let cancelled = false;

    (async () => {
      if (pendingLeave) {
        await pendingLeave;
      }
      if (cancelled) return;

      try {
        await hmsActions.join({ userName, authToken: token });
      } catch (error) {
        console.error("Failed to join call:", error);
        setJoinError("Could not join the call. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
      pendingLeave = hmsActions.leave().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = async () => {
    pendingLeave = hmsActions.leave().catch(() => {});
    await pendingLeave;
    onLeave();
  };

  const handleEndCall = () => {
    endCallMutation(sessionId, {
      onSettled: async () => {
        pendingLeave = hmsActions.leave().catch(() => {});
        await pendingLeave;
        onLeave();
      },
    });
  };

  if (joinError) {
    return (
      <div className="p-6 text-center text-error">
        {joinError}
        <button
          onClick={onLeave}
          className="mt-4 block mx-auto btn-primary py-1.5 px-4 text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6 text-center text-muted">Joining call...</div>
    );
  }

  const handleScreenShare = async () => {
    if (!toggleScreenShare) return;
    try {
      setShareError(null);
      setIsTogglingScreenShare(true);
      await toggleScreenShare();
    } catch (error) {
      console.warn("Screen sharing was not started:", error);
      setShareError("Screen sharing was not started. Allow screen capture in your browser and try again.");
    } finally {
      setIsTogglingScreenShare(false);
    }
  };

  const peerCount = peers.length;
  // Grid columns scale with participant count so tiles grow/shrink to fill
  // the available space instead of staying pinned to a fixed 2-col layout.
  const gridColsClass =
    peerCount <= 1
      ? "grid-cols-1"
      : peerCount === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : peerCount <= 4
      ? "grid-cols-2"
      : peerCount <= 9
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="flex flex-col h-full">
      <div
        className={`flex-1 overflow-y-auto p-4 grid ${gridColsClass} auto-rows-fr gap-3 place-content-center`}
      >
        {mediaError && (
          <p className="col-span-full rounded-md border border-error/30 bg-error/10 px-3 py-2 text-center text-xs text-error" role="alert">
            {mediaError}
          </p>
        )}
        {shareError && (
          <p className="col-span-full rounded-md border border-error/30 bg-error/10 px-3 py-2 text-center text-xs text-error" role="alert">
            {shareError}
          </p>
        )}
        {screenShareVideoTrackId && screenSharingPeerName && (
          <div className="col-span-full">
            <ScreenShareTile trackId={screenShareVideoTrackId} name={screenSharingPeerName} />
          </div>
        )}
        {peers.map((peer) => (
          <PeerTile key={peer.id} peer={peer} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 p-4 border-t border-border flex-wrap">
        <button
          type="button"
          onClick={toggleAudio}
          disabled={!toggleAudio}
          title={isLocalAudioEnabled ? "Mute" : "Unmute"}
          className="p-3 rounded-full border border-border bg-surface-soft text-foreground hover:bg-primary-soft transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLocalAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          type="button"
          onClick={handleScreenShare}
          disabled={!toggleScreenShare || isTogglingScreenShare}
          title={amIScreenSharing ? "Stop sharing screen" : "Share screen"}
          className={`p-3 rounded-full transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            amIScreenSharing
              ? "bg-primary text-on-primary hover:bg-primary-hover"
              : "border border-border bg-surface-soft text-foreground hover:bg-primary-soft"
          }`}
        >
          {amIScreenSharing ? <MonitorStop size={18} /> : <MonitorUp size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          disabled={!toggleVideo}
          title={isLocalVideoEnabled ? "Turn camera off" : "Turn camera on"}
          className="p-3 rounded-full border border-border bg-surface-soft text-foreground hover:bg-primary-soft transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLocalVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          type="button"
          onClick={handleLeave}
          title="Leave call"
          className="p-3 rounded-full border border-border bg-surface-soft text-foreground hover:bg-primary-soft transition flex items-center gap-2 px-4 cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-sm">Leave</span>
        </button>

        {isStarter && (
          <button
            type="button"
            onClick={handleEndCall}
            disabled={isEnding}
            title="End call for everyone"
            className="p-3 rounded-full bg-error text-on-primary hover:opacity-90 transition flex items-center gap-2 px-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhoneOff size={18} />
            <span className="text-sm">{isEnding ? "Ending..." : "End Call"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CallRoomView(props: CallRoomViewProps) {
  return (
    <HMSRoomProvider>
      <CallRoomInner {...props} />
    </HMSRoomProvider>
  );
}
