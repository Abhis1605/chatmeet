import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const isSameOriginSocket =
    typeof window !== "undefined" && socketUrl === window.location.origin;
  const socketPath =
    process.env.NEXT_PUBLIC_SOCKET_PATH ||
    (isSameOriginSocket ? "/api/socket-io/socket.io" : "/socket.io");

  if (!socketUrl) {
    throw new Error(
      "NEXT_PUBLIC_SOCKET_URL must be set when connecting outside a browser"
    );
  }

  if (!socket) {
    socket = io(socketUrl, {
      auth: {
        token,
      },
      path: socketPath,
      transports: ["websocket"],
    });
  } else {
    // Keep the latest signed token so reconnects don't use an expired one
    socket.auth = { token };
    if (!socket.connected && !socket.active) {
      socket.connect();
    }
  }
  return socket;
};

export const getSocket = () => socket;
