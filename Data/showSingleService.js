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
    <div class="property-item">
      <div class="property-thumb">
        <img src="${servicio.imagen}" alt="${servicio.nombreServicio}" class="img-fluid rounded">
      </div>
      <div class="down-content">
        <h2 class="mb-3">${servicio.nombreServicio}</h2>
        <p class="text-muted">${servicio.descripcion}</p>
        <p><strong>Rating:</strong> ${servicio.ratingProveedor}</p>
        <p><strong>Price:</strong> $${servicio.precio}</p>
        <p><strong>Duration:</strong> ${servicio.duracionEstimada}</p>
        <p><strong>Category:</strong> ${servicio.nombreCategoria || "Uncategorized"}</p>
        <p><strong>Provider:</strong> ${servicio.nombreProveedor || "Unknown"}</p>
      </div>
    </div>
  `;
}
