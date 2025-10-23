document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1️⃣ Obtener usuario logeado desde la sesión
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
    const usuario = data.user; // { id, name, email, phone, isprovider }

    // 2️⃣ Rellenar los campos del perfil
    document.getElementById("idUsuario").value = usuario.id;
    document.getElementById("nombre").value = usuario.name;
    document.getElementById("email").value = usuario.email;
    document.getElementById("telefono").value = usuario.phone || "";
    document.getElementById("rol").value = usuario.isprovider ? "Proveedor" : "Cliente";

    // 3️⃣ Actualizar la tarjeta de perfil
    const items = document.querySelectorAll(".list-group-item");
    items[0].innerHTML = `<strong>Name:</strong> ${usuario.name}`;
    items[1].innerHTML = `<strong>Email:</strong> ${usuario.email}`;
    items[2].innerHTML = `<strong>Phone:</strong> ${usuario.phone || "N/A"}`;
    items[3].innerHTML = `<strong>Role:</strong> ${usuario.isprovider ? "Proveedor" : "Cliente"}`;
    items[4].innerHTML = `<strong>User ID:</strong> ${usuario.id}`;

    // 4️⃣ Si es proveedor, obtener su servicio único
    if (usuario.isprovider) {
      const serviceResp = await fetch(`/api/serviceProv/${encodeURIComponent(usuario.email)}`, {
        method: "GET",
        credentials: "include"
      });

      console.log("✅ Usuario logeado:", usuario);
      console.log("🌐 Respuesta del servicio:", serviceResp);

      if (serviceResp.ok) {
        const servicio = await serviceResp.json();

        if (servicio && servicio.nombreServicio) {
          renderUserService(servicio);
        } else {
          console.warn("El proveedor no tiene servicios registrados.");
        }

      } else {
        console.warn("No se pudo obtener el servicio del proveedor");
      }
    }

  } catch (error) {
    console.error("⚠️ Error cargando usuario logeado:", error);
    alert("Ocurrió un error. Intenta de nuevo.");
  }
});


// 🔹 Render del servicio único del proveedor
function renderUserService(servicio) {
  const container = document.getElementById("service-container") || document.createElement("div");
  container.id = "service-container";

  container.innerHTML = `
    <div class="item text-center shadow-sm p-3 rounded-3" style="border: 1px solid #ddd; max-width: 500px; margin: 20px auto;">
        <img src="${servicio.imagen}" alt="${servicio.nombreServicio}" style="max-width: 100%; border-radius: 10px; margin-bottom: 10px;">
        <h4 class="service-title" style="font-size: 1.4rem; font-weight: bold; margin-top: 10px;">
            ${servicio.nombreServicio}
        </h4>
        <ul style="text-align: left; margin-top: 10px;">
            <li><strong>Descripción:</strong> <span>${servicio.descripcion}</span></li>
            <li><strong>Duración Estimada:</strong> <span>${servicio.duracionEstimada}</span></li>
            <li><strong>Categoría:</strong> <span>${servicio.nombreCategoria || 'N/A'}</span></li>
            <li><strong>Rating:</strong> <span>${servicio.ratingProveedor || 'N/A'}</span></li>
            <li><strong>Precio:</strong> <span>$${Number(servicio.precio).toLocaleString()}</span></li>
        </ul>
        <div class="mt-3">
            <button class="btn btn-sm btn-warning me-2" onclick="editService(${servicio.idServicio})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteService(${servicio.idServicio})">Eliminar</button>
        </div>
    </div>
  `;

  // Lo inserta debajo del formulario de usuario (si no existía)
  const userSection = document.querySelector(".contact-page .row");
  if (userSection && !document.getElementById("service-container")) {
    userSection.appendChild(container);
  }
}
