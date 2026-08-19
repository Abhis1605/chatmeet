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
} from "@100mslive/react-sdk";
import type { HMSPeer } from "@100mslive/react-sdk";
import { Mic, MicOff, Video, VideoOff, PhoneOff, LogOut } from "lucide-react";
import { useEndCall } from "@/hooks/mutations/use-end-call";

interface CallRoomViewProps {
  sessionId: string;
  token: string;
  userName: string;
  isStarter: boolean;
  onLeave: () => void;
}

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

function CallRoomInner({ sessionId, token, userName, isStarter, onLeave }: CallRoomViewProps) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const { isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const { mutate: endCallMutation, isPending: isEnding } = useEndCall();

  const [joinError, setJoinError] = useState<string | null>(null);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    hmsActions
      .join({ userName, authToken: token })
      .catch((error) => {
        console.error("Failed to join call:", error);
        setJoinError("Could not join the call. Please try again.");
      });

    return () => {
      hmsActions.leave().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = async () => {
    await hmsActions.leave().catch(() => {});
    onLeave();
  };

  const handleEndCall = () => {
    endCallMutation(sessionId, {
      onSettled: async () => {
        await hmsActions.leave().catch(() => {});
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {peers.map((peer) => (
          <PeerTile key={peer.id} peer={peer} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 p-4 border-t border-white/10 flex-wrap">
        <button
          type="button"
          onClick={toggleAudio}
          disabled={!toggleAudio}
          title={isLocalAudioEnabled ? "Mute" : "Unmute"}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-50"
        >
          {isLocalAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          disabled={!toggleVideo}
          title={isLocalVideoEnabled ? "Turn camera off" : "Turn camera on"}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-50"
        >
          {isLocalVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          type="button"
          onClick={handleLeave}
          title="Leave call"
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center gap-2 px-4"
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
            className="p-3 rounded-full bg-error text-on-primary hover:opacity-90 transition flex items-center gap-2 px-4 disabled:opacity-50"
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
