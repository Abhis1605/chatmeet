import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket']
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
