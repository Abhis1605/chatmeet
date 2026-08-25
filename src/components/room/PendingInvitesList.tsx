"use client";

import { usePendingInvites } from "@/hooks/queries/use-pending-invites";
import { useRespondInvite } from "@/hooks/mutations/use-respond-invite";
import { getAvatarSrc } from "@/lib/avatars";

export default function PendingInvitesList() {
  const { data: invites = [], isLoading } = usePendingInvites();
  const { mutate: respond, isPending } = useRespondInvite();

  if (isLoading) {
    return null;
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-white/10">
      <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
        Pending Invites
      </div>
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="px-3 py-3 border-t border-white/5 flex items-center gap-3"
        >
          <img
            src={getAvatarSrc(invite.invitedBy)}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{invite.chat.name}</p>
            <p className="text-xs text-muted truncate">
              From {invite.invitedBy.name || invite.invitedBy.email}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                respond({
                  inviteId: invite.id,
                  action: "accept",
                  chatId: invite.chatId,
                })
              }
              className="px-2 py-1 text-xs rounded bg-primary text-on-primary hover:bg-primary-hover cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                respond({ inviteId: invite.id, action: "reject", chatId: invite.chatId })
              }
              className="px-2 py-1 text-xs rounded bg-surface-soft text-muted hover:bg-border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
