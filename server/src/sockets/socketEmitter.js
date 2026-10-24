let ioInstance = null;

export function setSocketIO(io) {
  ioInstance = io;
}

export function getSocketIO() {
  return ioInstance;
}

export function emitToProject(projectId, event, data) {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit(event, data);
  }
}

export function emitToUser(userId, event, data) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}
