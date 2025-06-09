// src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar si el email ya está registrado
    const existente = await db('usuarios').where({ email }).first();
    if (existente) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Crear hash de la contraseña
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario en la base de datos
    const [usuario] = await db('usuarios')
      .insert({ username, email, password_hash })
      .returning(['id', 'username']);

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res
      .status(201)
      .json({ usuario: { id: usuario.id, username: usuario.username }, token });
  } catch (err) {
    console.error('Error en /api/auth/register:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Buscar usuario por email
    const usuario = await db('usuarios').where({ email }).first();
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar contraseña
    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ usuario: { id: usuario.id, username: usuario.username }, token });
  } catch (err) {
    console.error('Error en /api/auth/login:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
