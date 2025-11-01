const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET - Obtener todas las categorías
router.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categoria');
    res.json(rows);
  } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al mostrar Categorias', details: error.message });
  }
});

module.exports = router;
