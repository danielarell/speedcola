let servicios = [];
let categories = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Cargar servicios
        const resp = await fetch("/api/servicesUsers", { method: "GET", credentials: "include" });
        servicios = await resp.json();

        // Cargar categorías
        await loadServiceCategories();

        // Render inicial
        renderServices(servicios);

        // Eventos de filtro
        document.querySelector('#filterBtn').addEventListener('click', applyFilters);
        document.querySelector('#resetFilters').addEventListener('click', resetFilters);

        // Filtro de texto en vivo (cada vez que el usuario escribe)
        document.querySelector('#searchText').addEventListener('input', applyFilters);

        // Actualizar labels de los sliders
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        priceRange.addEventListener('input', () => { 
            priceValue.textContent = priceRange.value; 
            applyFilters(); // aplicar en vivo si cambian el rango
        });

        const ratingRange = document.getElementById('ratingRange');
        const ratingValue = document.getElementById('ratingValue');
        ratingRange.addEventListener('input', () => { 
            ratingValue.textContent = ratingRange.value; 
            applyFilters(); // aplicar en vivo si cambian el rating
        });

    } catch (error) {
        console.error("Error cargando servicios:", error);
    }
});

async function loadServiceCategories() {
    try {
        const resp = await fetch("/api/categories", { method: "GET", credentials: "include" });
        categories = await resp.json();

        const categorySelect = document.getElementById('categorySelect');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.idCategoria;
            option.textContent = cat.descripcion;
            categorySelect.appendChild(option);
        });

        // Refiltrar si se cambia la categoría
        categorySelect.addEventListener('change', applyFilters);

    } catch (err) {
        console.error('Error cargando categorías:', err);
    }
}

function applyFilters() {
    let filtered = servicios.slice();

    const searchText = document.getElementById('searchText').value.toLowerCase();
    const selectedCategory = document.getElementById('categorySelect').value;
    const maxPrice = parseFloat(document.getElementById('priceRange').value);
    const minRating = parseFloat(document.getElementById('ratingRange').value);

    // Filtro por texto (nombre, descripción o proveedor)
    if (searchText.trim() !== "") {
        filtered = filtered.filter(s =>
            s.nombreServicio.toLowerCase().includes(searchText) ||
            s.descripcion.toLowerCase().includes(searchText) ||
            (s.nombreProveedor && s.nombreProveedor.toLowerCase().includes(searchText))
        );
    }

    // Filtro por categoría
    if (selectedCategory !== "0") {
        filtered = filtered.filter(s => s.idCategoria.toString() === selectedCategory);
    }

    // Filtro por precio máximo
    filtered = filtered.filter(s => s.precio <= maxPrice);

    // Filtro por rating mínimo
    filtered = filtered.filter(s => (s.ratingProveedor || 0) >= minRating);

    // Renderizar resultados filtrados
    renderServices(filtered);
}

function resetFilters() {
    document.getElementById('categorySelect').value = "0";
    document.getElementById('searchText').value = "";
    document.getElementById('priceRange').value = 2000;
    document.getElementById('priceValue').textContent = 2000;
    document.getElementById('ratingRange').value = 0;
    document.getElementById('ratingValue').textContent = 0;

    renderServices(servicios);
}

function renderServices(list) {
    const container = document.getElementById('services-container');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p class="text-center mt-4">No se encontraron servicios que coincidan con los filtros.</p>`;
        return;
    }

    list.forEach(servicio => {
        const col = document.createElement("div");
        col.className = "col-lg-4 col-md-6 align-self-center mb-30 properties-items";

        col.innerHTML = `
            <div class="item">
                <a href="property-details.html"><img src="${servicio.imagen}" alt="${servicio.nombreServicio}"></a>
                <span class="category">${servicio.idCategoria}</span>
                <h6>$${servicio.precio.toLocaleString()}</h6>
                <ul>
                    <li>Nombre del Servicio: <span>${servicio.nombreServicio}</span></li>
                    <li>Descripción: <span>${servicio.descripcion}</span></li>
                    <li>Proveedor: <span>${servicio.nombreProveedor}</span></li>
                    <li>Duración Estimada: <span>${servicio.duracionEstimada}</span></li>
                    <li>Rating: <span>${servicio.ratingProveedor || 'N/A'}</span></li>
                </ul>
                <div class="main-button">
                    <a href="property-details.html">Schedule a visit</a>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}
