"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2, X } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import apiClient from "@/lib/axios";
import { getAvatarSrc } from "@/lib/avatars";

interface InviteDetails {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  expiresAt: string | null;
  invitedEmail: string | null;
  chat: { id: string; name: string; image: string | null };
  invitedBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    profilePhotoType?: string | null;
    avatarFilename?: string | null;
  };
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<"accept" | "reject" | null>(null);
  const [resultStatus, setResultStatus] = useState<string | null>(null);

  const callbackUrl = `/invite/${token}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  useEffect(() => {
    if (!token || sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await apiClient.get<InviteDetails>(
          `/room/invite/token/${token}`
        );
        if (!cancelled) {
          setInvite(data);
          setResultStatus(data.status);
        }
      } catch (err) {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error ?? "This invite is no longer available.";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token, sessionStatus]);

  const respond = async (action: "accept" | "reject") => {
    if (!token) return;
    setResponding(action);
    setError(null);

    try {
      await apiClient.post(`/room/invite/token/${token}/respond`, { action });

      if (action === "accept") {
        const chatId = invite?.chat.id;
        router.push(chatId ? `/chat?room=${chatId}` : "/chat");
        return;
      }

      setResultStatus("REJECTED");
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setResponding(null);
    }
  };

  const inviterName = invite?.invitedBy.name || invite?.invitedBy.email || "Someone";

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-y-auto bg-background px-4 py-6 sm:py-8">
      <AuthCard>
        <div className="text-center mb-4">
          <div className="inline-block">
            <img
              src="/chatmeet-logo.png"
              className="h-24 w-48 object-contain sm:h-30 sm:w-60"
              alt="ChatMeet logo"
            />
          </div>
          <p className="text-sm text-muted">Room invitation</p>
        </div>

        {sessionStatus === "unauthenticated" ? (
          <div className="space-y-4 text-center">
            <p className="text-foreground text-sm">
              Sign in or create an account to view and respond to this room
              invite.
            </p>
            <Link href={loginHref} className="btn-primary block w-full">
              Sign in
            </Link>
            <Link href={registerHref} className="btn-secondary block w-full">
              Create account
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading invite...
          </div>
        ) : !invite ? (
          <div className="space-y-4 text-center">
            <p className="text-foreground text-sm">
              {error ?? "This invite is no longer available."}
            </p>
            <Link href="/chat" className="btn-secondary block w-full">
              Go to ChatMeet
            </Link>
          </div>
        ) : resultStatus === "ACCEPTED" ? (
          <div className="space-y-4 text-center">
            <p className="text-foreground text-sm">
              You have already joined <strong>{invite.chat.name}</strong>.
            </p>
            <Link
              href={`/chat?room=${invite.chat.id}`}
              className="btn-primary block w-full"
            >
              Open room
            </Link>
          </div>
        ) : resultStatus === "REJECTED" ? (
          <div className="space-y-4 text-center">
            <p className="text-foreground text-sm">
              You declined the invite to <strong>{invite.chat.name}</strong>.
            </p>
            <Link href="/chat" className="btn-secondary block w-full">
              Go to ChatMeet
            </Link>
          </div>
        ) : resultStatus === "EXPIRED" ? (
          <div className="space-y-4 text-center">
            <p className="text-foreground text-sm">
              This invite to <strong>{invite.chat.name}</strong> has expired.
            </p>
            <Link href="/chat" className="btn-secondary block w-full">
              Go to ChatMeet
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <img
                  src={invite.chat.image || "/chatmeet-logo.png"}
                  alt=""
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <img
                  src={getAvatarSrc(invite.invitedBy)}
                  alt=""
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-background object-cover"
                />
              </div>
              <p className="text-foreground text-sm">
                <strong>{inviterName}</strong> invited you to join{" "}
                <strong>{invite.chat.name}</strong>
              </p>
              {invite.invitedEmail && (
                <p className="text-muted text-xs">
                  Sent to {invite.invitedEmail}
                </p>
              )}
            </div>

            {error && <p className="text-error text-sm text-center">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => respond("accept")}
                disabled={responding !== null}
                className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
              >
                {responding === "accept" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Accept invite
              </button>
              <button
                onClick={() => respond("reject")}
                disabled={responding !== null}
                className="btn-secondary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
              >
                {responding === "reject" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Decline
              </button>
            </div>
          </div>
        )}
      </AuthCard>
    </div>
  );
}
