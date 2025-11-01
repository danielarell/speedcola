const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET - Obtener todos los servicios
router.get('/api/services', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM servicios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al mostrar servicios', details: error.message });
  }
});

// GET - Obtener servicios con usuarios
router.get('/api/servicesUsers', async (req, res) => {
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
    res.status(500).json({ error: 'Error al mostrar servicios', details: error.message });
  }
});

// GET - Top 3 servicios
router.get('/api/servicesIndex', async (req, res) => {
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
    res.status(500).json({ error: 'Error al mostrar servicios destacados', details: error.message });
  }
});

// GET - Servicio por ID
router.get("/api/services/:id", async (req, res) => {
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

// GET - Servicio por email del proveedor
router.get("/api/serviceProv/:email", async (req, res) => {
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

// POST - Crear servicio
router.post('/api/services', async (req, res) => {
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

// PUT - Actualizar servicio
router.put('/api/services/:id', async (req, res) => {
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

// DELETE - Eliminar servicio
router.delete('/api/services/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM servicios WHERE idServicio = ?', [req.params.id]);
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;
