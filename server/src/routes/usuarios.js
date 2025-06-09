// src/routes/usuarios.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// GET /api/usuarios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const usuarios = await db('usuarios').select('id', 'username');
    return res.json(usuarios);
  } catch (err) {
    console.error('Error en /api/usuarios:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
