const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const router = express.Router();

// GET - Obtener todos los usuarios
router.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
});

// POST - Crear usuario
router.post('/api/users', async (req, res) => {
  try {
    const { name, isprovider, email, password, phone, foto } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, contrasenia, telefono, rol, fotoPerfil) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, isprovider, foto]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
});

// PUT - Actualizar usuario
router.put('/api/users/:id', async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;

    await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ?, telefono = ? WHERE idUsuario = ?',
      [nombre, email, telefono, req.params.id]
    );

    res.json({ message: 'Usuario actualizado correctamente' });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar usuario', 
      details: error.message 
    });
  }
});

// DELETE - Eliminar usuario
router.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE idUsuario=?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario', details: error.message });
  }
});

module.exports = router;
