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

        // Texto del botón según el rol y estado
        let accionHTML = "";
        if (isProvider && c.estado === "pendiente") {
        accionHTML = `<button class="btn btn-sm btn-success" onclick="cambiarEstado(${c.idCita}, 'activo')">Aceptar</button>`;
        } else if (!isProvider && c.estado === "activo") {
        accionHTML = `<button class="btn btn-sm btn-info" onclick="cambiarEstado(${c.idCita}, 'terminado')">Marcar Terminado</button>`;
        } else {
        accionHTML = `<span class="text-muted">-</span>`;
        }

        tr.innerHTML = `
        <td>${c.idCita}</td>
        <td>${c.nombreServicio || "-"}</td>
        <td>${c.nombreProveedor || "-"}</td>
        <td>${c.nombreCliente || "-"}</td>
        <td>${new Date(c.fecha).toLocaleString()}</td>
        <td>
            <span class="badge bg-${
            c.estado === "pendiente"
                ? "warning"
                : c.estado === "activo"
                ? "primary"
                : "success"
            }">${c.estado}</span>
        </td>
        <td>${accionHTML}</td>
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

document.addEventListener("DOMContentLoaded", loadUserData);