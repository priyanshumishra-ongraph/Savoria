import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

/**
 * Map from userId (string) → Set of socket IDs for that user.
 * Allows a user to be connected from multiple tabs simultaneously.
 */
const userSockets = new Map<string, Set<string>>();

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer, clientOrigin: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── JWT auth middleware ──────────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: no token'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      (socket as any).userId = decoded.id;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId: string = (socket as any).userId;

    // Track socket → user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    console.log(`[Socket] User ${userId} connected (${socket.id})`);

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
      console.log(`[Socket] User ${userId} disconnected (${socket.id})`);
    });
  });

  return io;
}

/**
 * Emit a notification payload to every open socket of the target user.
 */
export function emitToUser(recipientId: string, event: string, payload: unknown): void {
  const sockets = userSockets.get(recipientId);
  if (sockets && sockets.size > 0) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, payload);
    }
  }
}

export { io };
