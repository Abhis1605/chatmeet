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
  const socketNotifyUrl = process.env.SOCKET_NOTIFY_URL;
  const socketNotifySecret = process.env.SOCKET_NOTIFY_SECRET;
  if (!socketNotifyUrl || !socketNotifySecret) {
    console.error("[socket-notify] SOCKET_NOTIFY_URL and SOCKET_NOTIFY_SECRET must be set");
    return;
  }

  try {
    await fetch(socketNotifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-notify-secret": socketNotifySecret,
      },
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
