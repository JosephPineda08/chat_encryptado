let token = null;
let socket = null;
let usuarioActual = null;
let receptorId = null;

// Mostrar error temporalmente
function mostrarError(msg) {
  const err = document.getElementById('auth-error');
  err.innerText = msg;
  setTimeout(() => err.innerText = '', 4000);
}

// Inicializar chat tras login
function iniciarChat() {
  document.getElementById('auth').style.display = 'none';
  const chat = document.getElementById('chat');
  chat.hidden = false;
  
  socket = io({ auth: { token } });

  socket.on('connect', () => console.log('Conectado al chat'));
  socket.on('mensaje_recibido', data => {
    if (data.emisor === usuarioActual.username) return;
    agregarMensajeLocal(data.emisor, data.texto_cifrado, false, data.timestamp);
  });

  cargarUsuarios();
}

// Cargar lista de usuarios
async function cargarUsuarios() {
  const res = await fetch('/api/usuarios', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const usuarios = await res.json();
  const cont = document.getElementById('usuarios');
  // Limpiar y reinsertar encabezado
  cont.innerHTML = '<h3>Chats</h3>';

  usuarios.forEach(u => {
    if (u.id !== usuarioActual.id) {
      const btn = document.createElement('button');
      btn.innerText = u.username;
      btn.onclick = () => {
        receptorId = u.id;
        document.getElementById('nombreReceptor').innerText = u.username;
      };
      cont.appendChild(btn);
    }
  });

  // Agregar logout siempre al final
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'btnLogout';
  logoutBtn.innerText = 'Cerrar sesión';
  logoutBtn.onclick = logout;
  cont.appendChild(logoutBtn);
}

// Enviar mensaje
function enviarMensaje() {
  const input = document.getElementById('texto');
  const texto = input.value.trim();
  if (!texto) return;
  socket.emit('mensaje_publico', { texto_cifrado: texto, receptorId });
  agregarMensajeLocal('Tú', texto, true);
  input.value = '';
}

// Insertar mensaje en DOM
function agregarMensajeLocal(nombre, texto, esPropio, timestamp = null) {
  const div = document.createElement('div');
  div.className = 'mensaje ' + (esPropio ? 'saliente' : 'entrante');
  const hora = new Date(timestamp || Date.now())
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `<strong>${nombre}</strong>: ${texto}<br><small>${hora}</small>`;
  const cont = document.getElementById('mensajes');
  cont.appendChild(div);
  cont.scrollTo({ top: cont.scrollHeight, behavior: 'smooth' });
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  location.reload();
}

// Login
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!email || !password) return mostrarError('Completar campos');
  
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    usuarioActual = data.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioActual));
    iniciarChat();
  } else {
    mostrarError(data.error || 'Error al iniciar sesión');
  }
}

// Registro
async function register() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const username = prompt('Ingresa tu nombre de usuario:');
  if (!email || !password || !username) return mostrarError('Completar todos los campos');

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    usuarioActual = data.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioActual));
    iniciarChat();
  } else {
    mostrarError(data.error || 'Error al registrarse');
  }
}

// Restaurar sesión al recargar
document.addEventListener('DOMContentLoaded', () => {
  const t = localStorage.getItem('token');
  const u = localStorage.getItem('usuario');
  if (t && u) {
    token = t;
    usuarioActual = JSON.parse(u);
    iniciarChat();
  }
});

// Asociar eventos
document.getElementById('btnLogin').addEventListener('click', login);
document.getElementById('btnRegister').addEventListener('click', register);
document.getElementById('btnEnviar').addEventListener('click', enviarMensaje);
