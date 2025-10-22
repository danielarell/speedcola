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

function renderSingleService(service) {
  const container = document.getElementById("single-service-container");
  if (!container) return;

  container.innerHTML = `
    <div class="property-item">
      <div class="property-thumb">
        <img src="${service.imagen}" alt="${service.nombre}" class="img-fluid rounded">
      </div>
      <div class="down-content">
        <h2 class="mb-3">${service.nombre}</h2>
        <p class="text-muted">${service.descripcion}</p>
        <p><strong>Price:</strong> $${service.precio}</p>
        <p><strong>Duration:</strong> ${service.duracionEstimada}</p>
        <p><strong>Category:</strong> ${service.categoria || "Uncategorized"}</p>
        <p><strong>Provider:</strong> ${service.proveedor || "Unknown"}</p>
      </div>
    </div>
  `;
}
