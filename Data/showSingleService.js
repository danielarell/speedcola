// ===================== showSingleService.js =====================

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("id");

  if (!serviceId) {
    console.error("No service ID found in URL");
    return;
  }

  try {
    const resp = await fetch(`/api/services/${serviceId}`, { method: "GET", credentials: "include" });
    if (!resp.ok) throw new Error("Failed to fetch service");
    const service = await resp.json();

    renderSingleService(service);
  } catch (err) {
    console.error("Error fetching service:", err);
  }
});

function renderSingleService(servicio) {
  const container = document.getElementById("single-service-container");
  if (!container) return;

  container.innerHTML = `
    <div class="service-detail mb-5">
      <img src="${servicio.imagen}" alt="${servicio.nombreServicio}">
      <div class="service-content">
        <h2>${servicio.nombreServicio}</h2>
        <p class="description">${servicio.descripcion}</p>
        <div class="service-meta">
          <p><strong>⭐ Rating:</strong> ${servicio.ratingProveedor || "N/A"}</p>
          <p><strong>💰 Price:</strong> $${servicio.precio}</p>
          <p><strong>⏱ Duration:</strong> ${servicio.duracionEstimada}</p>
          <p><strong>🏷 Category:</strong> ${servicio.nombreCategoria || "Uncategorized"}</p>
          <p><strong>👤 Provider:</strong> ${servicio.nombreProveedor || "Unknown"}</p>
        </div>

        <div class="service-actions mt-4">
          <button class="btn btn-chat" onclick="openChat(${servicio.idUsuario})">
            <i class="fa fa-comments"></i> Chat
          </button>
          <button class="btn btn-hire">
            <i class="fa fa-briefcase"></i> Contratar servicio
          </button>
        </div>
      </div>
    </div>
  `;
}

// Función para abrir el chat con el proveedor
async function openChat(proveedorId) {
  try {
    // Verificar sesión
    const response = await fetch('/api/check-session', { credentials: 'include' });
    const data = await response.json();

    if (!data.loggedIn) {
      alert('Debes iniciar sesión para chatear');
      window.location.href = '/index.html';
      return;
    }

    // Obtener token del backend (desde la cookie)
    const tokenResp = await fetch('/api/socket-token', { credentials: 'include' });
    const tokenData = await tokenResp.json();

    if (!tokenData.token) {
      alert('Error: no se encontró el token');
      return;
    }

    // Guardar temporalmente el token (no se expone al usuario)
    sessionStorage.setItem("socketToken", tokenData.token);

    // Redirigir al chat
    window.location.href = `/chat.html?to=${proveedorId}`;
  } catch (error) {
    console.error('Error abriendo chat:', error);
    alert('Error al abrir el chat. Por favor intenta de nuevo.');
  }
}