const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatSocket = require('./chatSocket');
const serviceSocket = require('./serviceSocket');

// Usuarios conectados: Map(userId -> socketId)
const connectedUsers = new Map();

function initSockets(server, pool) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado al socket:", socket.id);
    
    let currentUserId = null;
    let isAuthenticated = false;

    // ========== AUTENTICAR USUARIO ==========
    socket.on("authenticate", async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_clave_secreta');
        currentUserId = decoded.id;
        isAuthenticated = true;

        connectedUsers.set(currentUserId, socket.id);
        console.log(`Usuario ${currentUserId} autenticado y registrado`);
        socket.emit('authenticated', { userId: currentUserId, name: decoded.name });
      } catch (error) {
        console.error('Error de autenticación:', error);
        socket.emit('auth_error', { message: 'Token inválido' });
        socket.disconnect();
      }
    });

    // Montar módulos de sockets
    chatSocket(io, socket, pool, connectedUsers, () => isAuthenticated, () => currentUserId);
    serviceSocket(io, socket, pool);

    // ========== DESCONEXIÓN ==========
    socket.on("disconnect", () => {
      if (currentUserId) {
        connectedUsers.delete(currentUserId);
        console.log(`🔴 Usuario ${currentUserId} desconectado`);
      } else {
        console.log("🔴 Usuario desconectado:", socket.id);
      }
    });
  });

  return io;
}

module.exports = initSockets;
