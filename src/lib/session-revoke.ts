import { notifySocket } from "@/lib/socket-notify";

// Tell the socket server to sign out and disconnect every live connection
// of this user, except (optionally) the one making the change.
export async function kickUserSockets(userId: string, keepSocketId?: string) {
  await notifySocket(
    "session-revoked",
    { keepSocketId },
    { userIds: [userId] }
  );
}
