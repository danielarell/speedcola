async function loadUserData() {
    const response = await fetch("/api/check-session", {
        method: "GET",
        credentials: "include"
    });

    if (!response.ok) {
        alert("Usuario no logeado. Inicia sesión.");
        window.location.href = "../index.html";
        return;
    }

    const data = await response.json();
    const usuario = data.user;
    const idUsuario = usuario.id;
    const rol = usuario.isprovider;

    console.log("Usuario logeado:", usuario);

    // detecta si el usuario es proveedor
    const isProvider = rol === 1;
    await loadCitas(idUsuario, isProvider);
    await loadContratos(idUsuario);
}

async function loadCitas(idUsuario, isProvider) {
    const res = await fetch(`/api/citas/${idUsuario}`);
    const citas = await res.json();
    const tbody = document.getElementById("citas-body");
    tbody.innerHTML = "";

    console.log("Citas obtenidas:", citas);

    citas.forEach(c => {
        const tr = document.createElement("tr");

        const citaId = c.idCita || c.id || c.id_cita;
        const idProv = Number(c.idProveedor || c.id_proveedor || c.proveedorId);
        const idCli = Number(c.idCliente || c.id_cliente || c.clienteId);
        const estado = (c.estado || "").toString().trim().toLowerCase();
        const fecha = c.fecha ? new Date(c.fecha) : null;
        const fechaTexto = fecha ? fecha.toLocaleString() : "-";

        let accionHTML = "";

        // Aceptar (proveedor)
        if (idUsuario === idProv && estado === "pendiente") {
            accionHTML += `<button class="btn btn-sm btn-success me-1" onclick="cambiarEstado(${citaId}, 'activo', ${idUsuario})">Aceptar</button>`;
        }

        // Marcar Terminado (cliente)
        if (idUsuario === idCli && estado === "activo") {
            accionHTML += `<button class="btn btn-sm btn-info me-1" onclick="cambiarEstado(${citaId}, 'terminado', ${idUsuario})">Terminar</button>`;
        }

        // 🔴 Cancelar (ambos)
        if (estado !== "cancelado" && estado !== "terminado") {
            accionHTML += `<button class="btn btn-sm btn-danger" onclick="cancelarCita(${citaId}, ${idUsuario})">Cancelar</button>`;
        }

        // Color del estado
        const estadoDisplay = c.estado || "-";
        const badgeClass =
            estadoDisplay.toLowerCase().includes("pend") ? "warning" :
            estadoDisplay.toLowerCase().includes("activo") ? "primary" :
            estadoDisplay.toLowerCase().includes("cancel") ? "danger" :
            "success";

        tr.innerHTML = `
            <td>${citaId}</td>
            <td>${c.nombreServicio || "-"}</td>
            <td>${c.nombreProveedor || "-"}</td>
            <td>${c.nombreCliente || "-"}</td>
            <td>${fechaTexto}</td>
            <td><span class="badge bg-${badgeClass}">${estadoDisplay}</span></td>
            <td>${accionHTML || "<span class='text-muted'>-</span>"}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function cambiarEstado(idCita, nuevoEstado) {
    console.log("Actualizando estado cita", idCita, "->", nuevoEstado);
    const res = await fetch(`/api/citas/${idCita}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
    });

    if (res.ok) {
        alert("Estado actualizado correctamente");
        loadUserData();
    } else {
        const err = await res.json();
        alert("Error al actualizar estado: " + (err.details || ""));
    }
}

async function loadContratos(idUsuario) {
    const res = await fetch(`/api/contratos/${idUsuario}`);
    const contratos = await res.json();
    const tbody = document.getElementById("contratos-body");
    tbody.innerHTML = "";

    console.log("Contratos obtenidos:", contratos);

    contratos.forEach(ct => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${ct.nombreServicio || "-"}</td>
        <td>${ct.nombreProveedor || "-"}</td>
        <td>${ct.nombreCliente || "-"}</td>
        <td>${new Date(ct.fecha).toLocaleString()}</td>
        <td>$${ct.costo}</td>
        <td>${ct.especificaciones || "-"}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function cancelarCita(idCita, idUsuario) {
  if (!confirm("¿Seguro que deseas cancelar esta cita? Se eliminará su contrato asociado.")) return;

  try {
    const res = await fetch(`/api/citas/${idCita}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ estado: "cancelado" })
    });

    if (res.ok) {
      alert("Cita cancelada correctamente.");
      await loadCitas(idUsuario);
      await loadContratos(idUsuario);
    } else {
      const error = await res.json().catch(() => ({}));
      alert("Error al cancelar cita: " + (error.details || error.error || res.statusText));
    }
  } catch (err) {
    console.error("Error cancelando cita:", err);
    alert("Error de red al intentar cancelar la cita.");
  }
}


document.addEventListener("DOMContentLoaded", loadUserData);