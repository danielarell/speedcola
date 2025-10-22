let servicios = [];
let categories = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verificar sesión
        const response = await fetch("/api/check-session", {
            method: "GET",
            credentials: "include"
        });
        const sessionData = await response.json();
        console.log(sessionData)
        
        if (sessionData.loggedIn && sessionData.user.isprovider) {
            // Crear botón dinámicamente
            console.log("User is provider, creating button...");

            const container = document.querySelector(".row.mb-4.g-3");
            const btn = document.createElement("button");
            btn.textContent = "Crear Servicio";
            btn.style.display = "block";
            btn.style.backgroundColor = '#f35525';
            btn.className = "btn btn-success mb-3";
            btn.setAttribute("data-bs-toggle", "modal");
            btn.setAttribute("data-bs-target", "#createServiceModal");

            // Insertar el botón al inicio del container (antes de los filtros)
            container.insertBefore(btn, container.firstChild);
            
            // O si prefieres insertarlo después del título pero antes de los filtros:
            // const filtersRow = container.querySelector(".row.mb-4.g-3");
            // container.insertBefore(btn, filtersRow);
        } else {
            console.log("User is not provider...");
        }

        try {
            // Cargar servicios
            const resp = await fetch("/api/servicesUsers", { method: "GET", credentials: "include" });
            servicios = await resp.json();

            // Cargar categorías para los filtros
            await loadServiceCategories();
            
            // Cargar categorías para el modal
            await loadCategoriesForModal();

            // Render inicial
            renderServices(servicios);

            // Eventos de filtro
            document.querySelector('#filterBtn').addEventListener('click', applyFilters);
            document.querySelector('#resetFilters').addEventListener('click', resetFilters);

            // Evento para crear servicio
            document.querySelector('#createServiceForm').addEventListener('submit', handleCreateService);

            const priceRange = document.getElementById('priceRange');
            const priceValue = document.getElementById('priceValue');
            priceRange.addEventListener('input', () => { 
                priceValue.textContent = priceRange.value; 
            });

            const ratingRange = document.getElementById('ratingRange');
            const ratingValue = document.getElementById('ratingValue');
            ratingRange.addEventListener('input', () => { 
                ratingValue.textContent = ratingRange.value; 
            });

        } catch (error) {
            console.error("Error cargando servicios:", error);
        }
            
    } catch (error) {
        console.error("Error verificando sesión:", error);
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

        // Ya no aplicamos filtros al cambiar la categoría (solo con el botón)
    } catch (err) {
        console.error('Error cargando categorías:', err);
    }
}

// Función para cargar categorías en el modal
async function loadCategoriesForModal() {
    try {
        const response = await fetch("/api/categories", { method: "GET", credentials: "include" });
        const categories = await response.json();
        console.log("Categories loaded:", categories); // Debug
        
        const select = document.getElementById('serviceCategory');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.idCategoria;
            option.textContent = cat.descripcion; // Changed from cat.nombre to cat.descripcion
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories for modal:", error);
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
    document.getElementById('priceRange').value = 10000;
    document.getElementById('priceValue').textContent = 10000;
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
            <div class="item text-center">
                <a href="property-details.html">
                    <img src="${servicio.imagen}" alt="${servicio.nombreServicio}">
                </a>
                <h4 class="service-title" style="font-size: 1.4rem; font-weight: bold; margin-top: 10px;">
                    ${servicio.nombreServicio}
                </h4>
                <ul style="text-align: left; margin-top: 10px;">
                    <li>Descripción: <span>${servicio.descripcion}</span></li>
                    <li>Proveedor: <span>${servicio.nombreProveedor}</span></li>
                    <li>Duración Estimada: <span>${servicio.duracionEstimada}</span></li>
                    <li>Categoria: <span>${servicio.nombreCategoria || 'N/A'}</span></li>
                    <li>Rating: <span>${servicio.ratingProveedor || 'N/A'}</span></li>
                </ul>
                <h6 style="color: #28a745;">$${servicio.precio.toLocaleString()}</h6>
                <div class="main-button">
                    <a href="property-details.html">Schedule a visit</a>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

async function handleCreateService(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const serviceData = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        precio: parseFloat(formData.get('precio')),
        duracionEstimada: formData.get('duracionEstimada'),
        imagen: formData.get('imagen'),
        idCategoria: parseInt(formData.get('idCategoria'))
    };

    try {
        const response = await fetch("/api/services", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(serviceData)
        });

        if (response.ok) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createServiceModal'));
            modal.hide();
            
            // Limpiar formulario
            e.target.reset();
            
            // Recargar servicios
            const resp = await fetch("/api/servicesUsers", { method: "GET", credentials: "include" });
            servicios = await resp.json();
            renderServices(servicios);
            
            alert("Service created successfully!");
        } else {
            const error = await response.json();
            alert("Error creating service: " + (error.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Error creating service:", error);
        alert("Error creating service. Please try again.");
    }
}