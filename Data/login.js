// login.js

async function getUsers() {
  const response = await fetch("users.json");
  return await response.json();
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#loginModal form");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evitar refresh de la página

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const users = await getUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Guardamos los datos simulando "cookies" en localStorage
      localStorage.setItem("loggedUser", JSON.stringify({
        email: user.email,
        username: user.username
      }));

      alert(`✅ Bienvenido ${user.username}`);
      window.location.href = "user-details.html"; // Redirigir a página de perfil
    } else {
      alert("❌ Credenciales incorrectas");
    }
  });
});

// Función para saber si hay un usuario logueado
function getLoggedUser() {
  return JSON.parse(localStorage.getItem("loggedUser"));
}

// Ejemplo: mostrar el nombre en la consola
const loggedUser = getLoggedUser();
if (loggedUser) {
  console.log(`Usuario logueado: ${loggedUser.username} (${loggedUser.email})`);
}
