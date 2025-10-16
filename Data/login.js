document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include', // 👈 importante para cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Login exitoso: ' + data.user.name);
      // Redirigir o mostrar perfil
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();
    } else {
      alert('❌ ' + data.error);
    }
  } catch (err) {
      console.error(err);
      alert('⚠️ Error en la conexión');
  }
});