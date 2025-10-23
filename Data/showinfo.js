document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Hacer fetch a la ruta protegida para obtener el usuario logeado
    const response = await fetch("/api/check-session", {
      method: "GET",
      credentials: "include" // importante para enviar la cookie
    });

    if (!response.ok) {
      alert("Usuario no logeado. Inicia sesión.");
      window.location.href = "../index.html";
      return;
    }

    const data = await response.json();
    const usuario = data.user; // aquí viene {id, name, email} desde el JWT

    // 2. Rellenar el formulario
    document.getElementById("idUsuario").value = usuario.id;
    document.getElementById("nombre").value = usuario.name;
    document.getElementById("email").value = usuario.email;
    document.getElementById("telefono").value = usuario.phone;
    document.getElementById("rol").value = usuario.isprovider ? "Proveedor" : "Cliente";

    // 3. Rellenar la tarjeta de perfil
    const items = document.querySelectorAll(".list-group-item");
    items[0].innerHTML = `<strong>Name:</strong> ${usuario.name}`;
    items[1].innerHTML = `<strong>Email:</strong> ${usuario.email}`;
    items[2].innerHTML = `<strong>Phone:</strong> ${usuario.phone || "N/A"}`;
    items[3].innerHTML = `<strong>Role:</strong> ${usuario.isprovider ? "Proveedor" : "Cliente"}`;
    items[4].innerHTML = `<strong>User ID:</strong> ${usuario.id}`;


    if (usuario.isprovider) {
      const serviceResp = await fetch(`/api/services/${usuario.id}`, {
        method: "GET",
        credentials: "include"
      });

      if (serviceResp.ok) {
        const servicio = await serviceResp.json(); 
        renderUserService(servicio);
      } else {
        console.warn("No se pudo obtener el servicio del proveedor");
      }
    }

  } catch (error) {
    console.error("Error cargando usuario logeado:", error);
    alert("Ocurrió un error. Intenta de nuevo.");
  }

});

function renderUserService(servicio) {
  const container = document.getElementById("service-container");
  if (!container) return;

  container.innerHTML = `
    <div class="item text-center shadow-sm p-3 rounded-3">
        <h4 class="service-title" style="font-size: 1.4rem; font-weight: bold; margin-top: 10px;">
            ${servicio.nombreServicio}
        </h4>
        <ul style="text-align: left; margin-top: 10px;">
            
            <li>Descripción: <span>${servicio.descripcion}</span></li>
            <li>Imagen Link: <span>${servicio.imagen}</span></li>
            <li>Duración Estimada: <span>${servicio.duracionEstimada}</span></li>
            <li>Categoria: <span>${servicio.nombreCategoria || 'N/A'}</span></li>
            <li>Rating: <span>${servicio.ratingProveedor || 'N/A'}</span></li>
            <li>Precio: <span>$${servicio.precio.toLocaleString()}</span></li>
        </ul>
        <div class="mt-2">
            <button class="btn btn-sm btn-warning me-2" onclick="editService(${servicio.idServicio})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteService(${servicio.idServicio})">Eliminar</button>
        </div>
    </div>
  `;
  // Insertar debajo del formulario del usuario
  document.querySelector(".contact-page .row").appendChild(container);
}