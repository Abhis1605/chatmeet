import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (token: any) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: {
        token,
      },
      transports: ['websocket']
    });
  } else if (!socket.connected && !socket.active) {
    socket.connect();
  }
  return socket;
};

export const getSocket = () => socket;