const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const authenticateToken = require('./middleware/auth');

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

// GET - Servicio Unico en Base a ID
app.get("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT \
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
      JOIN categoria c ON s.idCategoria = c.idCategoria;
      WHERE s.idServicio = ?;
      `,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Service not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching single service:", error);
    res.status(500).json({ message: "Error fetching service" });
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
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: 'Error al crear servicio', details: error.message });
  }
});


// POST - Crear usuario
app.post('/api/users', async (req, res) => {
  try {
    const { name, isprovider, email, password, phone, foto } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, contrasenia, telefono, rol, fotoperfil) VALUES (?, ?, ?, ?, ?, ?)',
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
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
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
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
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

// Iniciar servidor
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

start();