document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Leer JSON de servicios
        const response = await fetch("/api/services", {
            method: "GET",
            credentials: "include" // importante para enviar la cookie
        });
        const servicios = await response.json();

        // 2. Contenedor
        const container = document.getElementById("services-container");

        // 3. Generar HTML dinámico
        servicios.forEach(servicio => {
        const col = document.createElement("div");
        col.className = "col-lg-4 col-md-6 align-self-center mb-30 properties-items";

        // clase adicional para filtros (str, rac, adv, etc.)
        // agregar a tabla de servicios imagen
        //             <a href="property-details.html"><img src="${servicio.imagen}" alt=""></a>
        // Agregar Rating a servicios

        col.innerHTML = `
            <div class="item">
            <span class="category">${servicio.idCategoria}</span>
            <h6>$${servicio.precio.toLocaleString()}</h6>
            <ul>
                <li>nombre del Servicio: <span>${servicio.nombre}</span></li>
                <li>Descripcion: <span>${servicio.descripcion}</span></li>
                <li>Provider: <span>${servicio.idUsuario}</span></li>
                <li>Duracion Estimada: <span>${servicio.duracionEstimada}</span></li>
            </ul>
            <div class="main-button">
                <a href="property-details.html">Schedule a visit</a>
            </div>
            </div>
        `;

        container.appendChild(col);
        });
    } catch (error) {
        console.error("Error cargando servicios:", error);
    }
});