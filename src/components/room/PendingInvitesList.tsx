"use client";

import { usePendingInvites } from "@/hooks/queries/use-pending-invites";
import { useRespondInvite } from "@/hooks/mutations/use-respond-invite";

export default function PendingInvitesList() {
  const { data: invites = [], isLoading } = usePendingInvites();
  const { mutate: respond, isPending } = useRespondInvite();

  if (isLoading) {
    return <div className="p-3 text-xs text-gray-500">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-white/10">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Pending Invites
      </div>
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="px-3 py-3 border-t border-white/5 flex items-center gap-3"
        >
          <img
            src={invite.invitedBy.image || "/default-avatar.png"}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{invite.chat.name}</p>
            <p className="text-xs text-gray-400 truncate">
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
              className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                respond({ inviteId: invite.id, action: "reject", chatId: invite.chatId })
              }
              className="px-2 py-1 text-xs rounded bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
