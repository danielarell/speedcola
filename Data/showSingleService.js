

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("id");

  // fetch a la ruta protegida para obtener el usuario logeado
  const response = await fetch("/api/check-session", {
    method: "GET",
    credentials: "include" // importante para enviar la cookie
  });

  if (!response.ok) {
    alert("Usuario no logeado. Inicia sesión.");
    window.location.href = "../index.html";
    return;
  }

  if (!serviceId) {
    console.error("No service ID found in URL");
    return;
  }

  try {
    const resp = await fetch(`/api/services/${serviceId}`, { method: "GET", credentials: "include" });
    if (!resp.ok) throw new Error("Failed to fetch service");
    const service = await resp.json();

    renderSingleService(service);
    loadProviderReviews(service.idUsuario);
  } catch (err) {
    console.error("Error fetching service:", err);
  }
});

async function loadProviderReviews(idProveedor) {
  const container = document.getElementById("provider-reviews");

  try {
    const res = await fetch(`/api/resenas/recibidas/${idProveedor}?isProvider=1`);
    const reseñas = await res.json();

    if (!reseñas.length) {
      container.innerHTML = "<p>Este proveedor aún no tiene reseñas.</p>";
      return;
    }

    container.innerHTML = reseñas.map(r => `
      <div class="review-card">
        <div class="review-header">
          <strong>${r.nombreAutor}</strong>
          <span class="stars">⭐ ${r.puntuacion}</span>
        </div>
        <p>${r.comentarios}</p>
      </div>
    `).join("");

  } catch (error) {
    console.error("Error cargando reseñas:", error);
    container.innerHTML = "<p>Error al cargar reseñas.</p>";
  }
}



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
          <button class="btn btn-hire" onclick="openHireModal(${servicio.idServicio}, '${servicio.nombreServicio}', ${servicio.precio}, '${servicio.duracionEstimada}', '${servicio.nombreProveedor}', '${servicio.descripcion}', ${servicio.idUsuario})">
            <i class="fa fa-briefcase"></i> Contratar servicio
          </button>
        </div>
      </div>
    </div>

    <!-- SECCIÓN RESEÑAS DEL PROVEEDOR -->
    <h3 class="mt-5">Reseñas del Proveedor</h3>
    <div id="provider-reviews" class="reviews-container">
      <p>Cargando reseñas...</p>
    </div>

    <!-- Modal de Contratación -->
    <div id="hireModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeHireModal()">&times;</span>
        <h2>Contratar Servicio</h2>
        <div id="modal-body">
          <!-- El contenido se llenará dinámicamente -->
        </div>
      </div>
    </div>
  `;
}

// Función para abrir el modal
async function openHireModal(idServicio, nombreServicio, precio, duracion, proveedor, descripcion, idProveedor) {
  const modal = document.getElementById("hireModal");
  const modalBody = document.getElementById("modal-body");

  // Verificar usuario logeado
  const response = await fetch("/api/check-session", { credentials: "include" });
  const data = await response.json();
  const idCliente = data.user.id;

  // Si el usuario es el creador del servicio
  if (idCliente === idProveedor) {
    alert("Este es tu propio servicio, no puedes contratarlo.");
    return;
  }
  
  modalBody.innerHTML = `
    <p><strong>Service:</strong> ${nombreServicio}</p>
    <p><strong>Price:</strong> $${precio}</p>
    <p><strong>Provider:</strong> ${proveedor}</p>
    <p><strong>Estimated Duration:</strong> ${duracion}</p>
    <p><strong>Description:</strong> ${descripcion}</p>
    
    <form id="hireForm" onsubmit="submitHire(event, ${idServicio}, ${idProveedor}, ${precio})">
      <div class="form-group">
        <label for="fecha">Fecha preferida: *</label>
        <input type="date" id="fecha" name="fecha" required>
      </div>
      
      <div class="form-group">
        <label for="hora">Hora preferida: *</label>
        <input type="time" id="hora" name="hora" required>
      </div>
      
      <div class="form-group">
        <label for="notas">Notas adicionales: *</label>
        <textarea id="notas" name="notas" rows="4" placeholder="Agrega cualquier detalle especial..."></textarea>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeHireModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Confirmar Cita</button>
      </div>
    </form>
  `;

  
  const dateInput = modalBody.querySelector('#fecha');
  const timeInput = modalBody.querySelector('#hora');

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const fechaHoyStr = `${yyyy}-${mm}-${dd}`;

  // Evitar seleccionar fechas pasadas
  dateInput.min = fechaHoyStr;

  function actualizarMinHora() {
    const selectedDate = dateInput.value; 
    if (!selectedDate) {
      timeInput.removeAttribute('min');
      return;
    }

    if (selectedDate === fechaHoyStr) {
      // Hora mínima: ahora +5 min
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() + 5);
      const hh = String(ahora.getHours()).padStart(2, '0');
      const mins = String(ahora.getMinutes()).padStart(2, '0');

      timeInput.min = `${hh}:${mins}`;

      // Si la hora elegida está por debajo del mínimo → limpiar
      if (timeInput.value && timeInput.value < timeInput.min) {
        timeInput.value = '';
      }
    } else {
      timeInput.removeAttribute('min');
    }
  }

  actualizarMinHora(); // Ejecutar inmediatamente
  dateInput.addEventListener('change', actualizarMinHora);

  
  modal.style.display = "block";
}

// Función para cerrar el modal
function closeHireModal() {
  const modal = document.getElementById("hireModal");
  modal.style.display = "none";
}

// Función para procesar la contratación
async function submitHire(event, idServicio, idProveedor, costo) {
  event.preventDefault();
  const response = await fetch('/api/check-session', {
      credentials: 'include'
  });
  const data = await response.json();
  
  let idCliente = data.user.id;
  let idCita;
  
  let fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const especificaciones = document.getElementById("notas").value;

  const fechaLocal = new Date(`${fecha}T${hora}:00`);
  const fechaUTC = fechaLocal.toISOString();
  fecha = fechaUTC

  if (!fecha || !hora || !especificaciones.trim()) {
    alert("Debes completar todos los campos: fecha, hora y especificaciones.");
    return; //Detener todo el flujo inmediatamente
  }

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const fechaSeleccionada = new Date(`${fecha}T00:00:00`);

  if (fechaSeleccionada < hoy) {
      alert("La fecha seleccionada no puede ser anterior a la fecha actual.");
      return;
  }

  try {
    const response_2 = await fetch('/api/citas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fecha, idCliente, idProveedor, idServicio, costo, especificaciones})
    });

    if (response_2.ok) {
      const data = await response_2.json();
      console.log(data)
      idCita = data.id
      console.log("creada con exito cita")
    }

    if (!response_2.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errData);
    }
  }catch (err) {
    console.error('Error:', err);
    alert('Falló la conexión con el servidor');
  }

  try{

    const response_3 = await fetch('/api/contrato', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idCita, fecha, idCliente, idProveedor, idServicio, costo, especificaciones})
    });

    if (response_3.ok) {
      const data_2 = await response_3.json();
      console.log(data_2)
      console.log("creada con exito contrato")
    }

    if (!response_3.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errData);
    }
  }catch(err){
    console.error('Error:', err);
    alert('Falló la conexión con el servidor');
  }
  
  alert("¡Servicio contratado exitosamente!");
  closeHireModal();
}

// Cerrar modal al hacer click fuera de él
window.onclick = function(event) {
  const modal = document.getElementById("hireModal");
  if (event.target == modal) {
    closeHireModal();
  }
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

    const idCliente = data.user.id;

    // Evitar chatear contigo mismo
    if (idCliente === proveedorId) {
      alert("No puedes iniciar un chat contigo mismo.");
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