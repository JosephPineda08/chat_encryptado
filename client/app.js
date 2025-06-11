let token = null;
let socket = null;
let usuarioActual = null;
let receptorId = null;

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    usuarioActual = data.usuario;

    // 🔐 Guardar sesión
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioActual));

    iniciarChat();
  } else {
    document.getElementById('auth-error').innerText = data.error || 'Error al iniciar sesión';
  }
}

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = prompt("Ingresa tu nombre de usuario:");
  if (!username) return;

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    usuarioActual = data.usuario;

    // 🔐 Guardar sesión
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioActual));

    iniciarChat();
  } else {
    document.getElementById('auth-error').innerText = data.error || 'Error al registrarse';
  }
}

function iniciarChat() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('chat').style.display = 'block';

  socket = io({ auth: { token } });

  socket.on('connect', () => {
    console.log('Conectado al chat');
  });

  socket.on('mensaje_recibido', (data) => {
    if (data.emisor === usuarioActual.username) return;

    agregarMensajeLocal(data.emisor, data.texto_cifrado, false, data.timestamp);
  });

  cargarUsuarios();
  btn.onclick = () => {
  receptorId = u.id;
  document.getElementById('nombreReceptor').innerText = u.username;
};

}

async function cargarUsuarios() {
  const res = await fetch('/api/usuarios', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const usuarios = await res.json();

  const div = document.getElementById('usuarios');
  div.innerHTML = '<strong>Enviar a:</strong><br />';
  usuarios.forEach(u => {
    if (u.id !== usuarioActual.id) {
      const btn = document.createElement('button');
      btn.innerText = u.username;
      btn.onclick = () => {
        receptorId = u.id;
        alert('Ahora estás chateando con ' + u.username);
      };
      div.appendChild(btn);
    }
  });
}

function enviarMensaje() {
  const texto = document.getElementById('texto').value;
  if (!texto.trim()) return;

  socket.emit('mensaje_publico', {
    texto_cifrado: texto,
    receptorId: receptorId || null
  });

  agregarMensajeLocal(`Tú`, texto, true);
  document.getElementById('texto').value = '';
}


function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  location.reload();
}

// Asociar eventos
document.getElementById('btnLogin').addEventListener('click', login);
document.getElementById('btnRegister').addEventListener('click', register);
document.getElementById('btnEnviar').addEventListener('click', enviarMensaje);
document.getElementById('btnLogout')?.addEventListener('click', logout);

// 🔁 Cargar sesión persistente al iniciar
document.addEventListener('DOMContentLoaded', () => {
  const guardado = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');

  if (guardado && usuario) {
    token = guardado;
    usuarioActual = JSON.parse(usuario);
    iniciarChat();
  }


function agregarMensajeLocal(nombre, texto, esPropio, timestamp = null) {
  const div = document.createElement('div');
  div.className = 'mensaje ' + (esPropio ? 'saliente' : 'entrante');

  const hora = new Date(timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  div.innerHTML = `<strong>${nombre}</strong>: ${texto} <br><small>${hora}</small>`;
  document.getElementById('mensajes').appendChild(div);

  // Autoscroll al fondo
  const mensajesDiv = document.getElementById('mensajes');
  mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
}

});
