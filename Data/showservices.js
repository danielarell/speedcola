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
        if (servicio.categoria.toLowerCase().includes("mechanic")) col.classList.add("str");
        if (servicio.categoria.toLowerCase().includes("construction")) col.classList.add("rac");
        if (servicio.categoria.toLowerCase().includes("plumbing")) col.classList.add("adv");

        col.innerHTML = `
            <div class="item">
            <a href="property-details.html"><img src="${servicio.imagen}" alt=""></a>
            <span class="category">${servicio.categoria}</span>
            <h6>$${servicio.precio.toLocaleString()}</h6>
            <h4><a href="property-details.html">${servicio.ubicacion}</a></h4>
            <ul>
                <li>Pay method: <span>${servicio.payMethod}</span></li>
                <li>Provider: <span>${servicio.provider}</span></li>
                <li>Rating: <span>${servicio.rating}</span></li>
                <li>Review: <span>${servicio.review}</span></li>
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