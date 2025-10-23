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


function renderUserService(servicio) {
  const container = document.getElementById("service-container") || document.createElement("div");
  container.id = "service-container";

  container.className = "card shadow-sm mt-4"; 
  container.innerHTML = `
    <div class="card-body">
        <h5 class="card-title mb-3" style="font-weight: 600;">My Service Information</h5>
        <div class="row mb-2">
            <div class="col-md-6">
                <p><strong>Nombre del Servicio:</strong> ${servicio.nombreServicio}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Categoría:</strong> ${servicio.nombreCategoria || "N/A"}</p>
            </div>
        </div>

        <div class="row mb-2">
            <div class="col-md-6">
                <p><strong>Duración Estimada:</strong> ${servicio.duracionEstimada}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Precio:</strong> $${Number(servicio.precio).toLocaleString()}</p>
            </div>
        </div>

        <div class="row mb-2">
            <div class="col-md-12">
                <p><strong>Descripción:</strong> ${servicio.descripcion}</p>
            </div>
        </div>

        <div class="row mb-2">
            <div class="col-md-12">
                <p><strong>Imagen (URL):</strong> <a href="${servicio.imagen}" target="_blank">${servicio.imagen}</a></p>
            </div>
        </div>

        <div class="row mb-2">
            <div class="col-md-6">
                <p><strong>Proveedor:</strong> ${servicio.nombreProveedor}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Rating:</strong> ${servicio.ratingProveedor || "N/A"}</p>
            </div>
        </div>

        <div class="mt-3 text-end">
            <button class="btn btn-sm btn-warning me-2" onclick="editService(${servicio.idServicio})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteService(${servicio.idServicio})">Eliminar</button>
        </div>
    </div>
  `;

  const userSection = document.querySelector(".contact-page .row");
  if (userSection && !document.getElementById("service-container")) {
    userSection.appendChild(container);
  }
}

