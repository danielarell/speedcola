let categories = [];


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
      <h4 class="mb-3">Service Overview</h4>
      <ul class="list-group">
        <li class="list-group-item"><strong>Service Name:</strong> ${servicio.nombreServicio || 'N/A'}</li>
        <li class="list-group-item"><strong>Description:</strong> ${servicio.descripcion || 'N/A'}</li>
        <li class="list-group-item"><strong>Image Link:</strong> <a href="${servicio.imagen || '#'}" target="_blank">View Image</a></li>
        <li class="list-group-item"><strong>Estimated Duration:</strong> ${servicio.duracionEstimada || 'N/A'}</li>
        <li class="list-group-item"><strong>Category:</strong> ${servicio.nombreCategoria || 'N/A'}</li>
        <li class="list-group-item"><strong>Rating:</strong> ${servicio.ratingProveedor || 'N/A'}</li>
        <li class="list-group-item"><strong>Price:</strong> $${servicio.precio?.toLocaleString() || '0'}</li>
        <li class="list-group-item"><strong>Service ID:</strong> ${servicio.idServicio}</li>
      </ul>
      <div class="mt-3 d-flex justify-content-end" id="service-buttons-container"></div>
    </div>
  `;

  const buttonsContainer = document.getElementById("service-buttons-container");

  // Edit Button
  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "btn btn-sm btn-warning me-2";
  editBtn.style.backgroundColor = "orangered";
  editBtn.setAttribute("data-bs-toggle", "modal");
  editBtn.setAttribute("data-bs-target", "#editServiceModal");
  editBtn.addEventListener("click", () => editService(servicio.idServicio));
  buttonsContainer.appendChild(editBtn);

    // Delete Button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "btn btn-sm btn-danger";
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("¿Estás seguro que quieres eliminar este servicio?")) return;

    try {
      const response = await fetch(`/api/services/${servicio.idServicio}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        alert("Servicio eliminado correctamente");
        // Opcional: remover la tarjeta del DOM
        container.remove();
      } else {
        alert("Error eliminando servicio: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      alert("Error eliminando servicio. Intenta nuevamente.");
    }
  });
  buttonsContainer.appendChild(deleteBtn);

}

async function loadCategoriesForModal() {
  try {
    const response = await fetch("/api/categories", { method: "GET", credentials: "include" });
    const categories = await response.json();

    const select = document.getElementById('editServiceCategory');
    if (!select) return;
    select.innerHTML = '<option value="">Select a category</option>'; // Limpiar opciones previas

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.idCategoria;
      option.textContent = cat.descripcion;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories for modal:", error);
  }
}



async function editService(idServicio) {
  try {
    const res = await fetch(`/api/services/${idServicio}`, { method: "GET", credentials: "include" });
    const servicio = await res.json();

    // Llenar campos del modal
    document.getElementById("editServiceId").value = servicio.idServicio;
    document.getElementById("editServiceName").value = servicio.nombreServicio;
    document.getElementById("editServiceDescription").value = servicio.descripcion;
    document.getElementById("editServicePrice").value = servicio.precio;
    document.getElementById("editServiceDuration").value = servicio.duracionEstimada;
    document.getElementById("editServiceImage").value = servicio.imagen;

    // Cargar categorías en el dropdown y seleccionar la actual
    await loadCategoriesForModal();
    const categorySelect = document.getElementById("editServiceCategory");
    if (categorySelect) categorySelect.value = servicio.idCategoria;

    // Mostrar modal usando Bootstrap API
    const modalEl = document.getElementById('editServiceModal');

    // Obtener instancia existente o crear nueva
    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) modal = new bootstrap.Modal(modalEl);

    modal.show();

    // Reset formulario y restaurar foco al cerrar modal
    modalEl.addEventListener('hidden.bs.modal', () => {
      document.getElementById("editServiceForm").reset();
      const openButton = document.getElementById(`editServiceButton-${idServicio}`);
      if (openButton) openButton.focus(); // Devuelve el foco al botón que abrió el modal
    }, { once: true });

  } catch (err) {
    console.error("Error loading service:", err);
    alert("Error loading service data");
  }
}






// Manejar el envío del formulario (PUT)
async function handleEditService(e) {
  e.preventDefault();
  const form = e.target;

  const updatedService = {
    nombre: form.nombre.value,
    descripcion: form.descripcion.value,
    precio: parseFloat(form.precio.value),
    duracionEstimada: form.duracionEstimada.value,
    imagen: form.imagen.value,
    idCategoria: parseInt(form.idCategoria.value)
  };

  const idServicio = document.getElementById("editServiceId").value;

  try {
    const response = await fetch(`/api/services/${idServicio}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updatedService)
    });

    const data = await response.json();

    if (response.ok) {
      // Cierra modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editServiceModal'));
      modal.hide();

      alert("Service updated successfully!");
      // Recargar la vista del servicio actualizado
      location.reload();
    } else {
      alert("Error updating service: " + (data.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error updating service:", error);
    alert("Unexpected error updating service.");
  }
}

// Asigna el handler al formulario del modal
document.getElementById("editServiceForm").addEventListener("submit", handleEditService);





