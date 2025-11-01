const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.post('/api/citas', async (req, res) => {
  try {

    const {fecha, idCliente, idProveedor, idServicio, costo, especificaciones} = req.body;
    
    // Validate required fields
    if (!fecha || !idCliente || !idProveedor || !idServicio || !costo || !especificaciones) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { fecha, idCliente, idProveedor, idServicio, costo, especificaciones }
      });
    }

    let estado = "pendiente"

    const [result] = await pool.query(
      'INSERT INTO citas (fecha, idCliente, idProveedor, idServicio, estado) VALUES (?, ?, ?, ?, ?)',
      [fecha, idCliente, idProveedor, idServicio, estado]
    );
    
    console.log("cita created with ID:", result.insertId);
    
    res.status(201).json({ 
      id: result.insertId, 
      fecha, 
      idCliente, 
      idProveedor, 
      idServicio, 
      estado
    });

  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: 'Error al crear la cita', details: error.message });
  }
});

router.post('api/contrato', async (req, res) => {
    try {

    const {idCita, fecha, idCliente, idProveedor, idServicio, costo, especificaciones} = req.body;
    
    // Validate required fields
    if (!idCita || !fecha || !idCliente || !idProveedor || !idServicio || !costo || !especificaciones) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { fecha, idCliente, idProveedor, idServicio, costo, especificaciones }
      });
    }

    const [result] = await pool.query(
        'INSERT INTO contrato (idCita, fecha, idCliente, idProveedor, idServicio, costo, especificaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [idCita, fecha, idCliente, idProveedor, idServicio, costo, especificaciones]
    )
    
    console.log("contrato created with ID:", result.insertId);
    
    res.status(201).json({ 
      id: result.insertId, 
      idCita,
      fecha, 
      idCliente, 
      idProveedor, 
      idServicio, 
      costo,
      especificaciones
    });

  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: 'Error al crear el contrato', details: error.message });
  }

});

module.exports = router;