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
          <button class="btn btn-chat">
            <i class="fa fa-comments"></i> 
            <a href="#" data-bs-toggle="modal" data-bs-target="#chatModal"> Chat </a>
          </button>
          <button class="btn btn-hire">
            <i class="fa fa-briefcase"></i> Contratar servicio
          </button>
        </div>
      </div>
    </div>


<div class="modal fade " id="collapseOne">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-body">
          <ul class="chat">
              <li class="left clearfix"><span class="chat-img pull-left">
                  <img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />
              </span>
                  <div class="chat-body clearfix">
                      <div class="header">
                          <strong class="primary-font">Jack Sparrow</strong> <small class="pull-right text-muted">
                              <span class="glyphicon glyphicon-time"></span>12 mins ago</small>
                      </div>
                      <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare
                          dolor, quis ullamcorper ligula sodales.
                      </p>
                  </div>
              </li>
              <li class="right clearfix"><span class="chat-img pull-right">
                  <img src="http://placehold.it/50/FA6F57/fff&text=ME" alt="User Avatar" class="img-circle" />
              </span>
                  <div class="chat-body clearfix">
                      <div class="header">
                          <small class=" text-muted"><span class="glyphicon glyphicon-time"></span>13 mins ago</small>
                          <strong class="pull-right primary-font">Bhaumik Patel</strong>
                      </div>
                      <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare
                          dolor, quis ullamcorper ligula sodales.
                      </p>
                  </div>
              </li>
              <li class="left clearfix"><span class="chat-img pull-left">
                  <img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />
              </span>
                  <div class="chat-body clearfix">
                      <div class="header">
                          <strong class="primary-font">Jack Sparrow</strong> <small class="pull-right text-muted">
                              <span class="glyphicon glyphicon-time"></span>14 mins ago</small>
                      </div>
                      <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare
                          dolor, quis ullamcorper ligula sodales.
                      </p>
                  </div>
              </li>
              <li class="right clearfix"><span class="chat-img pull-right">
                  <img src="http://placehold.it/50/FA6F57/fff&text=ME" alt="User Avatar" class="img-circle" />
              </span>
                  <div class="chat-body clearfix">
                      <div class="header">
                          <small class=" text-muted"><span class="glyphicon glyphicon-time"></span>15 mins ago</small>
                          <strong class="pull-right primary-font">Bhaumik Patel</strong>
                      </div>
                      <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare
                          dolor, quis ullamcorper ligula sodales.
                      </p>
                  </div>
              </li>
          </ul>
      </div>
      <div class="modal-footer">
        <div class="input-group">
            <input id="btn-input" type="text" class="form-control input-sm" placeholder="Type your message here..." />
            <span class="input-group-btn">
                <button class="btn btn-warning btn-sm" id="btn-chat">
                    Send</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </span>
        </div>
      </div>
    </div>
</div>
  </div>
</div>

  `;
}

