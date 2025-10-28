const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const authenticateToken = require('./middleware/auth');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use(cookieParser());

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

let pool;

// Conectar a base de datos
async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Conectado a la base de datos');
  } catch (error) {
    console.error('❌ Error conectando:', error);
    process.exit(1);
  }
}

app.use(express.static(__dirname)); // sirve todo el proyecto

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// GET - Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
});

// GET - Obtener todos los servicios
app.get('/api/services', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM servicios');
    res.json(rows);
  } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al mostrar Servicios', details: error.message });
  }
});

// GET - Obtener todos los categorias
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categoria');
    res.json(rows);
  } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al mostrar Categorias', details: error.message });
  }
});

// GET - Obtener todos los servicios con el nombre del proveedor
app.get('/api/servicesUsers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT  \
      s.idServicio, \
      s.nombre AS nombreServicio, \
      s.descripcion, \
      s.precio, \
      s.duracionEstimada, \
      s.imagen, \
      s.idCategoria, \
      u.nombre AS nombreProveedor, \
      u.calificacion AS ratingProveedor, \
      c.descripcion AS nombreCategoria \
    FROM servicios s \
    JOIN usuarios u ON s.idUsuario = u.idUsuario \
    JOIN categoria c ON s.idCategoria = c.idCategoria;');
    res.json(rows);
  } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al mostrar Servicios', details: error.message });
  }
});

// GET - Obtener top 3 servicios
app.get('/api/servicesIndex', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT  \
      s.idServicio, \
      s.nombre AS nombreServicio, \
      s.descripcion, \
      s.precio, \
      s.duracionEstimada, \
      s.imagen, \
      s.idCategoria, \
      u.nombre AS nombreProveedor, \
      u.calificacion AS ratingProveedor, \
      c.descripcion AS nombreCategoria \
    FROM servicios s \
    JOIN usuarios u ON s.idUsuario = u.idUsuario \
    JOIN categoria c ON s.idCategoria = c.idCategoria \
    WHERE u.calificacion IS NOT NULL \
    ORDER BY s.precio ASC \
    LIMIT 3;');
    res.json(rows);
  } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al mostrar Servicios', details: error.message });
  }
});

// GET - Servicio Unico en Base a ID del servicio
app.get("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        s.idServicio, 
        s.idUsuario,
        s.nombre AS nombreServicio, 
        s.descripcion, 
        s.precio, 
        s.duracionEstimada, 
        s.imagen, 
        s.idCategoria, 
        u.nombre AS nombreProveedor, 
        u.calificacion AS ratingProveedor,
        c.descripcion AS nombreCategoria
      FROM servicios s
      LEFT JOIN usuarios u ON s.idUsuario = u.idUsuario
      LEFT JOIN categoria c ON s.idCategoria = c.idCategoria
      WHERE s.idServicio = ?;
      `,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Service not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching single service:", error);
    res.status(500).json({ message: "Error fetching service", error: error.message });
  }
});

// GET - Servicio Unico en Base a EMAIL
app.get("/api/serviceProv/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        s.idServicio, 
        s.nombre AS nombreServicio, 
        s.descripcion, 
        s.precio, 
        s.duracionEstimada, 
        s.imagen, 
        s.idCategoria, 
        u.nombre AS nombreProveedor, 
        u.calificacion AS ratingProveedor, 
        c.descripcion AS nombreCategoria
      FROM servicios s
      JOIN usuarios u ON s.idUsuario = u.idUsuario
      JOIN categoria c ON s.idCategoria = c.idCategoria
      WHERE u.email = ?;
      `,
      [email]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "El proveedor no tiene servicios" });

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching service by email:", error);
    res.status(500).json({ message: "Error fetching service", error: error.message });
  }
});





// POST - Crear Servicio
app.post('/api/services', async (req, res) => {
  try {
    console.log("Session:", req.session);
    console.log("Request body:", req.body);

    const { nombre, descripcion, precio, duracionEstimada, imagen, idCategoria, email } = req.body;
    
    // Validate required fields
    if (!nombre || !precio || !duracionEstimada || !idCategoria) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { nombre, precio, duracionEstimada, idCategoria }
      });
    }

    // Get idUsuario from database using email
    const [users] = await pool.query(
      'SELECT idUsuario FROM usuarios WHERE email = ?',
      [email || req.session.user.email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const idUsuario = users[0].idUsuario;
    console.log("Creating service for user ID:", idUsuario);

    const [result] = await pool.query(
      'INSERT INTO servicios (nombre, descripcion, precio, duracionEstimada, imagen, idUsuario, idCategoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, duracionEstimada, imagen, idUsuario, idCategoria]
    );
    
    console.log("Service created with ID:", result.insertId);
    
    res.status(201).json({ 
      id: result.insertId, 
      nombre, 
      descripcion, 
      precio, 
      duracionEstimada, 
      imagen, 
      idUsuario, 
      idCategoria 
    });

    const io = req.app.get("io");
    io.emit("newService", {
      message: `Nuevo servicio creado: ${nombre}`,
      data: { nombre, precio, idCategoria }
    });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: 'Error al crear servicio', details: error.message });
  }
});

// PUT - Actualizar Servicios
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, duracionEstimada, imagen, idCategoria } = req.body;

    // Validar campos requeridos
    if (!nombre || !precio || !duracionEstimada || !idCategoria) {
      return res.status(400).json({
        error: 'Missing required fields',
        received: { nombre, precio, duracionEstimada, idCategoria }
      });
    }

    // Actualizar servicio
    const [result] = await pool.query(
      `UPDATE servicios 
       SET nombre = ?, descripcion = ?, precio = ?, duracionEstimada = ?, imagen = ?, idCategoria = ?
       WHERE idServicio = ?`,
      [nombre, descripcion, precio, duracionEstimada, imagen, idCategoria, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      message: 'Service updated successfully',
      updated: { id, nombre, descripcion, precio, duracionEstimada, imagen, idCategoria }
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: 'Error updating service', details: error.message });
  }
});

// DELETE - Eliminar Servicio
app.delete('/api/services/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM servicios WHERE idServicio = ?', [req.params.id]);
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});



// POST - Crear usuario
app.post('/api/users', async (req, res) => {
  try {
    const { name, isprovider, email, password, phone, foto } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, contrasenia, telefono, rol, fotoPerfil) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, isprovider, foto]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
});

// PUT - Actualizar usuario
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ? WHERE idUsuario = ?',
      [name, email, req.params.id]
    );
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// DELETE - Eliminar usuario
app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE idUsuario = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    console.log(user.contrasenia)
    // Comparar contraseña
    const validPassword = await bcrypt.compare(password, user.contrasenia);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Crear token JWT
    const token = jwt.sign(
    { 
        id: user.id,
        name: user.nombre,
        email: user.email,
        phone: user.telefono,   
        isprovider: user.rol
    },
    process.env.JWT_SECRET || 'mi_clave_secreta',
    { expiresIn: '1h' }
    );

    // Guardar token en cookie HTTP-only
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true si usas HTTPS
      maxAge: 3600000 // 1 hora
    });

    res.json({ message: 'Login exitoso', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en login' });
  }
});

app.get('/api/check-session', authenticateToken, (req, res) => {
  // Si el middleware pasa, significa que el usuario está logeado
  res.json({ loggedIn: true, user: req.user });
});

app.get("/api/socket-token", (req, res) => {
  const token = req.cookies.token; // Recupera el token guardado en la cookie
  
  if (!token) {
    return res.status(401).json({ error: "No token found" });
  }

  res.json({ token }); // Devuelve el token al frontend
});

// ========================== SERVIDOR Y SOCKETS ==========================

// Almacenar usuarios conectados: Map(userId -> socketId)
const connectedUsers = new Map();

async function start() {
  await initDB();
  
  const server = http.createServer(app);
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
        
        // Registrar automáticamente para chat
        connectedUsers.set(currentUserId, socket.id);
        console.log(`👤 Usuario ${currentUserId} autenticado y registrado`);
        
        socket.emit('authenticated', { userId: currentUserId, name: decoded.name });
      } catch (error) {
        console.error('Error de autenticación:', error);
        socket.emit('auth_error', { message: 'Token inválido' });
        socket.disconnect();
      }
    });

    // ========== ENVIAR MENSAJE PRIVADO ==========
socket.on("send_private_message", async (data) => {
  if (!isAuthenticated) {
    socket.emit('error', { message: 'No autenticado' });
    return;
  }
  
  // 🔥 CONVERTIR A NÚMEROS
  const toUserId = parseInt(data.toUserId);
  const fromUserId = parseInt(currentUserId);
  const { message, isProvider } = data;
  
  console.log("📩 ENVIAR MENSAJE:");
  console.log("- De:", fromUserId, "Para:", toUserId);
  console.log("- Mensaje:", message);
  console.log("- Es proveedor quien envía:", isProvider);
  
  // Validar que los IDs sean números válidos
  if (isNaN(toUserId) || isNaN(fromUserId)) {
    console.error("❌ IDs inválidos:", { toUserId, fromUserId });
    socket.emit('error', { message: 'IDs de usuario inválidos' });
    return;
  }
  
  try {
    // 1. Determinar quién es cliente y quién proveedor
    const idCliente = isProvider ? toUserId : fromUserId;
    const idProveedor = isProvider ? fromUserId : toUserId;
    
    console.log("👥 Roles: Cliente =", idCliente, "| Proveedor =", idProveedor);
    
    // 2. Buscar o crear el chat entre estos dos usuarios
    let chatId;
    
    const [existingChats] = await pool.query(
      'SELECT idChat FROM chats WHERE idCliente = ? AND idProveedor = ?',
      [idCliente, idProveedor]
    );
    
    if (existingChats.length > 0) {
      chatId = existingChats[0].idChat;
      console.log("💬 Chat existente encontrado:", chatId);
    } else {
      // Crear nuevo chat
      const [newChat] = await pool.query(
        'INSERT INTO chats (idCliente, idProveedor) VALUES (?, ?)',
        [idCliente, idProveedor]
      );
      chatId = newChat.insertId;
      console.log("✨ Nuevo chat creado:", chatId);
    }
    
    // 3. Guardar el mensaje
    const [insertResult] = await pool.query(
      'INSERT INTO mensajes (idChat, idUsuario, contenido) VALUES (?, ?, ?)',
      [chatId, fromUserId, message]
    );
    
    console.log("✅ Mensaje guardado con ID:", insertResult.insertId);
    
    // 4. Enviar mensaje si el destinatario está conectado
    const recipientSocketId = connectedUsers.get(toUserId);
    
    const messageData = {
      from: fromUserId,
      message: message,
      timestamp: new Date(),
      chatId: chatId
    };
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', messageData);
      console.log("📤 Mensaje enviado al destinatario");
      
      socket.emit('message_delivered', {
        ...messageData,
        to: toUserId,
        status: 'delivered'
      });
    } else {
      console.log("⚠️ Destinatario offline");
      socket.emit('message_delivered', {
        ...messageData,
        to: toUserId,
        status: 'offline'
      });
    }
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    console.error('Stack:', error.stack);
    socket.emit('error', { 
      message: 'Error al enviar mensaje',
      details: error.message 
    });
  }
});

// ========== OBTENER HISTORIAL DE CHAT ==========
socket.on("get_chat_history", async (data) => {
    // 🔥 CONVERTIR A NÚMEROS
    const userId1 = parseInt(data.userId1);
    const userId2 = parseInt(data.userId2);
    const { isProvider } = data;
    
    console.log("SOLICITUD DE HISTORIAL:");
    console.log("- Usuario 1:", userId1, "Usuario 2:", userId2);
    console.log("- Usuario 1 es proveedor:", isProvider);
    
    try {
      // Determinar quién es cliente y quién proveedor
      const idCliente = isProvider ? userId2 : userId1;
      const idProveedor = isProvider ? userId1 : userId2;
      
      console.log("👥 Roles: Cliente =", idCliente, "| Proveedor =", idProveedor);
      
      // Buscar el chat
      const [chats] = await pool.query(
        'SELECT idChat FROM chats WHERE idCliente = ? AND idProveedor = ?',
        [idCliente, idProveedor]
      );
      
      if (chats.length === 0) {
        console.log("📭 No hay chat entre estos usuarios");
        socket.emit('chat_history', []);
        return;
      }
      
      const chatId = chats[0].idChat;
      console.log("💬 Chat encontrado:", chatId);
      
      //CORREGIR QUERY: usar idUsuario en lugar de idEmisor
      const [messages] = await pool.query(
        `SELECT 
          m.idMensaje,
          m.idUsuario,
          m.contenido as mensaje,
          m.timestampEnvio as fechaEnvio,
          u.nombre as nombreUsuario
        FROM mensajes m
        JOIN usuarios u ON m.idUsuario = u.idUsuario
        WHERE m.idChat = ?
        ORDER BY m.timestampEnvio ASC
        LIMIT 100`,
        [chatId]
      );
      
      console.log(`📨 ${messages.length} mensajes encontrados`);
      socket.emit('chat_history', messages);
    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        console.error('Stack:', error.stack);
        socket.emit('chat_history', []);
    }
});

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

  // Guarda la instancia globalmente
  app.set("io", io);

  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

// // Iniciar servidor
// async function start() {
//   await initDB();
//   app.listen(PORT, () => {
//     console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
//   });
// }

start();