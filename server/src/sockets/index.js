import { Server } from 'socket.io';
import cookie from 'cookie';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { setSocketIO } from './socketEmitter.js';

export function setupSocketIO(httpServer, clientUrl) {
  const allowedOrigins = [
    clientUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  setSocketIO(io);

  // Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let sessionToken = null;

      if (cookieHeader) {
        const parsedCookies = cookie.parse(cookieHeader);
        sessionToken = parsedCookies.devcollab_session;
      }

      // Check auth handshake token as alternative fallback
      if (!sessionToken && socket.handshake.auth?.token) {
        sessionToken = socket.handshake.auth.token;
      }

      if (!sessionToken) {
        return next(new Error('Authentication required'));
      }

      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: {
          user: {
            include: { profile: true }
          }
        }
      });

      if (!session || new Date() > new Date(session.expiresAt) || session.user.isSuspended) {
        return next(new Error('Invalid or expired session'));
      }

      const { passwordHash, ...safeUser } = session.user;
      socket.user = safeUser;
      return next();
    } catch (err) {
      logger.error('Socket authentication error', { error: err.message });
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`Socket connected for user ${user.username} (${user.id})`);

    // Join user's personal private room
    socket.join(`user:${user.id}`);

    // Join project room with membership validation
    socket.on('project:join', async ({ projectId }, callback) => {
      try {
        if (!projectId) return;

        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { members: true }
        });

        if (!project) {
          if (callback) callback({ success: false, error: 'Project not found' });
          return;
        }

        const isMember = project.members.some(m => m.userId === user.id);
        const isOwner = project.ownerId === user.id;
        const isAdmin = user.role === 'ADMIN';

        if (!isMember && !isOwner && !isAdmin) {
          if (callback) callback({ success: false, error: 'Unauthorized to join project room' });
          socket.emit('error:unauthorized', { message: 'You are not a member of this project' });
          return;
        }

        const roomName = `project:${projectId}`;
        socket.join(roomName);
        logger.info(`User ${user.username} joined ${roomName}`);

        if (callback) callback({ success: true });
      } catch (err) {
        logger.error('Error joining project room', { error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Leave project room
    socket.on('project:leave', ({ projectId }) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Handle typing indicator
    socket.on('typing:start', ({ projectId }) => {
      socket.to(`project:${projectId}`).emit('typing:start', {
        projectId,
        userId: user.id,
        username: user.profile?.displayName || user.username
      });
    });

    socket.on('typing:stop', ({ projectId }) => {
      socket.to(`project:${projectId}`).emit('typing:stop', {
        projectId,
        userId: user.id
      });
    });

    // Real-time message dispatch with database persistence
    socket.on('discussion:send', async ({ projectId, message }, callback) => {
      try {
        if (!projectId || !message || !message.trim()) {
          if (callback) callback({ success: false, error: 'Invalid message payload' });
          return;
        }

        // Verify membership
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { members: true }
        });

        if (!project) {
          if (callback) callback({ success: false, error: 'Project not found' });
          return;
        }

        const isMember = project.members.some(m => m.userId === user.id);
        const isOwner = project.ownerId === user.id;
        const isAdmin = user.role === 'ADMIN';

        if (!isMember && !isOwner && !isAdmin) {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }

        // Persist message first
        const savedMessage = await prisma.discussionMessage.create({
          data: {
            projectId,
            senderId: user.id,
            message: message.trim()
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: { displayName: true, avatarUrl: true }
                }
              }
            }
          }
        });

        // Broadcast to project room
        io.to(`project:${projectId}`).emit('message:new', savedMessage);

        if (callback) callback({ success: true, data: savedMessage });
      } catch (err) {
        logger.error('Socket message send error', { error: err.message });
        if (callback) callback({ success: false, error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.username}`);
    });
  });

  return io;
}
