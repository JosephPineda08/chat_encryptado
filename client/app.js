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
    // Si el mensaje es del usuario actual, ignorar (ya lo mostramos con "Tú:")
    if (data.emisor === usuarioActual.username) return;

    const div = document.createElement('div');
    div.className = 'mensaje';
    div.innerText = `De ${data.emisor}: ${data.texto_cifrado}`;
    document.getElementById('mensajes').appendChild(div);
  });


  cargarUsuarios();
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

  const div = document.createElement('div');
  div.className = 'mensaje';
  div.innerText = `Tú: ${texto}`;
  document.getElementById('mensajes').appendChild(div);

  document.getElementById('texto').value = '';
}

// Asociar eventos
document.getElementById('btnLogin').addEventListener('click', login);
document.getElementById('btnRegister').addEventListener('click', register);
document.getElementById('btnEnviar').addEventListener('click', enviarMensaje);
