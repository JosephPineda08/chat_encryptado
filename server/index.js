// index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const db = require('./src/db');
const authRoutes = require('./src/routes/auth');
const usuariosRoutes = require('./src/routes/usuarios');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

// Middlewares de seguridad y parseo
app.set('trust proxy', 1); // ← Habilita confianza en proxy (como Render)
app.use(cors());
app.use(express.json());
const helmet = require('helmet');


const rateLimit = require('express-rate-limit');
app.use(helmet());
app.use(rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

// ✅ 1) Servir archivos estáticos ANTES de las rutas API
const clientPath = path.join(__dirname, '../client');
console.log('[DEBUG] static path:', clientPath);
app.use(express.static(clientPath));

// ✅ 2) Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

// ✅ 3) Catch-all para enviar index.html en rutas no-API
const indexHtmlPath = path.join(clientPath, 'index.html');
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(indexHtmlPath);
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3000;

// ✅ 4) Socket.IO: autenticación con JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Autenticación fallida: no hay token'));
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Token inválido'));
    socket.user = user;
    next();
  });
});

// ✅ 5) Socket.IO: lógica de conexión
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.user.username} (ID: ${socket.user.id})`);
  socket.join(String(socket.user.id));

  socket.on('mensaje_publico', async (data) => {
    const { texto_cifrado, receptorId } = data;
    try {
      await db('mensajes').insert({
        emisor_id: socket.user.id,
        receptor_id: receptorId || null,
        texto_cifrado
      });

      const payload = {
        emisor: socket.user.id,
        texto_cifrado,
        timestamp: new Date()
      };

      if (receptorId) {
        io.to(String(receptorId)).emit('mensaje_recibido', payload);
      } else {
        io.emit('mensaje_recibido', payload);
      }
    } catch (err) {
      console.error('Error al guardar mensaje:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.user.username}`);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
