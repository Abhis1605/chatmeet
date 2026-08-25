const SOCKET_NOTIFY_URL =
  process.env.SOCKET_NOTIFY_URL ?? "http://localhost:5000/notify";

type NotifyOptions = {
  userIds?: string[];
  chatId?: string;
  broadcast?: boolean;
};

/** Best-effort notify to the standalone socket server (non-blocking for API handlers). */
export async function notifySocket(
  event: string,
  payload: unknown,
  options: NotifyOptions = {}
) {
  try {
    await fetch(SOCKET_NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        payload,
        userIds: options.userIds,
        chatId: options.chatId,
        broadcast: options.broadcast,
      }),
    });
  } catch (error) {
    console.error(`[socket-notify] Failed to emit ${event}:`, error);
  }
}
