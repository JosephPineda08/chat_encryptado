let token = null;
let socket = null;
let usuarioActual = null;
let receptorId = null;

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) return mostrarError('Campos obligatorios');

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

async function register() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const username = prompt("Ingresa tu nombre de usuario:");

  if (!email || !password || !username) return mostrarError('Todos los campos son obligatorios');

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

function iniciarChat() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('chat').style.display = 'flex';

  socket = io({ auth: { token } });

  socket.on('connect', () => {
    console.log('Conectado al chat');
  });

  socket.on('mensaje_recibido', (data) => {
    if (data.emisor === usuarioActual.username) return;
    agregarMensajeLocal(data.emisor, data.texto_cifrado, false, data.timestamp);
  });

  cargarUsuarios();
}

async function cargarUsuarios() {
  const res = await fetch('/api/usuarios', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const usuarios = await res.json();

  const contenedor = document.getElementById('usuarios');
  const botonesDiv = document.createElement('div');
  botonesDiv.id = 'lista-usuarios';
  botonesDiv.innerHTML = '<h3>Enviar a:</h3>';

  usuarios.forEach(u => {
    if (u.id !== usuarioActual.id) {
      const btn = document.createElement('button');
      btn.innerText = u.username;
      btn.onclick = () => {
        receptorId = u.id;
        document.getElementById('nombreReceptor').innerText = u.username;
      };
      botonesDiv.appendChild(btn);
    }
  });

  // Eliminar lista previa si existe
  const anterior = document.getElementById('lista-usuarios');
  if (anterior) contenedor.removeChild(anterior);

  contenedor.insertBefore(botonesDiv, document.getElementById('btnLogout'));
}

function enviarMensaje() {
  const input = document.getElementById('texto');
  const texto = input.value.trim();
  if (!texto) return;

  socket.emit('mensaje_publico', {
    texto_cifrado: texto,
    receptorId: receptorId || null
  });

  agregarMensajeLocal('Tú', texto, true);
  input.value = '';
}

function agregarMensajeLocal(nombre, texto, esPropio, timestamp = null) {
  const div = document.createElement('div');
  div.className = 'mensaje ' + (esPropio ? 'saliente' : 'entrante');

  const hora = new Date(timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  div.innerHTML = `<strong>${nombre}</strong>: ${texto}<br><small>${hora}</small>`;
  const contenedor = document.getElementById('mensajes');
  contenedor.appendChild(div);
  contenedor.scrollTo({ top: contenedor.scrollHeight, behavior: 'smooth' });
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  location.reload();
}

function mostrarError(msg) {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.innerText = msg;
  setTimeout(() => errorDiv.innerText = '', 4000);
}

// Asignar eventos
document.getElementById('btnLogin')?.addEventListener('click', login);
document.getElementById('btnRegister')?.addEventListener('click', register);
document.getElementById('btnEnviar')?.addEventListener('click', enviarMensaje);
document.getElementById('btnLogout')?.addEventListener('click', logout);

// Restaurar sesión automáticamente
document.addEventListener('DOMContentLoaded', () => {
  const guardado = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');

  if (guardado && usuario) {
    token = guardado;
    usuarioActual = JSON.parse(usuario);
    iniciarChat();
  }
});
