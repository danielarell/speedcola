document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Cargar el JSON con todos los usuarios
        const response = await fetch("users.json");
        const usuarios = await response.json();

        // 2. Recuperar el usuario logeado desde localStorage (hay que parsear)
        const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

        // 3. Buscar al usuario en el JSON por email (o username)
        const usuario = usuarios.find(u => u.email === loggedUser.email);

        if (usuario) {
        // Rellenar el formulario
        document.getElementById("idUsuario").value = usuario.username;
        document.getElementById("nombre").value = usuario.nombre;
        document.getElementById("email").value = usuario.email;
        document.getElementById("telefono").value = usuario.telefono;
        document.getElementById("rol").value = usuario.rol;

        // Rellenar la tarjeta de perfil
        const items = document.querySelectorAll(".list-group-item");
        items[0].innerHTML = `<strong>Name:</strong> ${usuario.nombre}`;
        items[1].innerHTML = `<strong>Email:</strong> ${usuario.email}`;
        items[2].innerHTML = `<strong>Phone:</strong> ${usuario.telefono}`;
        items[3].innerHTML = `<strong>Role:</strong> ${usuario.rol}`;
        items[4].innerHTML = `<strong>User ID:</strong> ${usuario.idUsuario}`;
        } else {
        alert("Usuario no encontrado. Inicia sesión.");
        window.location.href = "../index.html";
        }
    } catch (error) {
        console.error("Error cargando usuarios:", error);
    }
});
