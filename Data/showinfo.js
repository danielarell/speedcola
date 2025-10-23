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
      const serviceResp = await fetch(`/api/serviceProv/${usuario.email}`, {
        method: "GET",
        credentials: "include"
      });

      console.log(usuario.id)
      console.log(usuario)
      console.log(usuario.email)
      console.log(serviceResp)

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
    <div class="card shadow-sm p-4 rounded-3">
      <h4 class="mb-3">My Service Information</h4>
      <form id="service-form">
        <div class="form-group mb-3">
          <label for="nombreServicio">Service Name</label>
          <input type="text" id="nombreServicio" name="nombreServicio" class="form-control" 
                 value="${servicio.nombreServicio || ''}">
        </div>

        <div class="form-group mb-3">
          <label for="descripcion">Description</label>
          <textarea id="descripcion" name="descripcion" class="form-control" rows="3">${servicio.descripcion || ''}</textarea>
        </div>

        <div class="form-group mb-3">
          <label for="imagen">Image Link</label>
          <input type="text" id="imagen" name="imagen" class="form-control" 
                 value="${servicio.imagen || ''}">
        </div>

        <div class="form-group mb-3">
          <label for="duracionEstimada">Estimated Duration</label>
          <input type="text" id="duracionEstimada" name="duracionEstimada" class="form-control" 
                 value="${servicio.duracionEstimada || ''}">
        </div>

        <div class="form-group mb-3">
          <label for="nombreCategoria">Category</label>
          <input type="text" id="nombreCategoria" name="nombreCategoria" class="form-control" 
                 value="${servicio.nombreCategoria || 'N/A'}" readonly>
        </div>

        <div class="form-group mb-3">
          <label for="ratingProveedor">Rating</label>
          <input type="text" id="ratingProveedor" name="ratingProveedor" class="form-control" 
                 value="${servicio.ratingProveedor || 'N/A'}" readonly>
        </div>

        <div class="form-group mb-3">
          <label for="precio">Price</label>
          <input type="number" id="precio" name="precio" class="form-control" 
                 value="${servicio.precio || 0}">
        </div>

        <div class="d-flex justify-content-end">
          <button type="button" class="btn btn-warning me-2" onclick="editService(${servicio.idServicio})">Edit</button>
          <button type="button" class="btn btn-danger" onclick="deleteService(${servicio.idServicio})">Delete</button>
        </div>
      </form>
    </div>
  `;
}



