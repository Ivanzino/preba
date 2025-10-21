function verInstructores(id_comp) {
    fetch('/verInstructores', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_comp })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Respuesta del backend:", data);

        let instructores = data.instructores || [];
        let competencia = data.competencia || "Sin competencia";

        let competenciaHtml = `<h4 style="margin-top:10px; font-weight:normal">${competencia}</h4>`;

        let buscador = `
            <input type="text" id="buscadorInstructores" 
                   placeholder="Buscar instructor..." 
                   style="width: 95%; padding:5px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
        `;

        // Parámetros de paginación
        let currentPage = 1;
        let rowsPerPage = 10; // 👈 cuántos registros por página
        let totalPages = Math.ceil(instructores.length / rowsPerPage);

        function renderTable(page = 1, filter = "") {
            let start = (page - 1) * rowsPerPage;
            let end = start + rowsPerPage;

            let filtered = instructores.filter(ins => 
                ins.nombre.toLowerCase().includes(filter) ||
                (ins.perfil || "").toLowerCase().includes(filter) ||
                (ins.rap || "").toLowerCase().includes(filter)
            );

            totalPages = Math.ceil(filtered.length / rowsPerPage);

            let tabla = `
            <style>
                #tablaInstructores { border-collapse: collapse; width: 100%; text-align: left; }
                #tablaInstructores th, #tablaInstructores td { padding: 8px 12px; border: 1px solid #ddd; }
                #tablaInstructores th:nth-child(1), #tablaInstructores td:nth-child(1) { width: 170px; }
                #tablaInstructores th:nth-child(2), #tablaInstructores td:nth-child(2) { width: 170px; }
                #tablaInstructores th:nth-child(3), #tablaInstructores td:nth-child(3) { width: 290px; }
                #tablaInstructores th:nth-child(4), #tablaInstructores td:nth-child(4) { width: 60px; text-align: center; }
                .pagination { margin-top: 10px; text-align: center; }
                .pagination button { margin: 0 5px; padding: 5px 10px; }
            </style>
            <table id="tablaInstructores" class="table table-bordered">
                <thead>
                <tr>
                    <th>Instructor</th>
                    <th>Perfil</th>
                    <th>RAP</th>
                    <th>Opciones</th>
                </tr>
                </thead>
                <tbody>
            `;

            filtered.slice(start, end).forEach(ins => {
                tabla += `
                    <tr>
                        <td>${ins.nombre}</td>
                        <td>${ins.perfil || 'Sin perfil'}</td>
                        <td>${ins.rap || 'Sin RAP'}</td>
                        <td>
                            <button onclick="eliminarAsociaciones(${id_comp}, ${ins.id_instructor})" 
                                    class="btn btn-sm btn-danger">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            tabla += `</tbody></table>`;

            // Paginación
            tabla += `
                <div class="pagination">
                    <button id="prevPage" ${page === 1 ? "disabled" : ""}>Anterior</button>
                    <span>Página ${page} de ${totalPages}</span>
                    <button id="nextPage" ${page === totalPages ? "disabled" : ""}>Siguiente</button>
                </div>
            `;

            return competenciaHtml + buscador + tabla;
        }

        // Render inicial
        Swal.fire({
            title: 'Instructores Asociados',
            html: renderTable(currentPage),
            width: 1500,
            showConfirmButton: false,
            showCloseButton: true,
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)",
            didOpen: () => {
                const input = document.getElementById("buscadorInstructores");
                input.addEventListener("keyup", function() {
                    let filter = input.value.toLowerCase();
                    Swal.update({ html: renderTable(1, filter) }); // Reinicia búsqueda en página 1
                });

                document.addEventListener("click", function(e) {
                    if (e.target && e.target.id === "prevPage" && currentPage > 1) {
                        currentPage--;
                        Swal.update({ html: renderTable(currentPage, input.value.toLowerCase()) });
                    }
                    if (e.target && e.target.id === "nextPage" && currentPage < totalPages) {
                        currentPage++;
                        Swal.update({ html: renderTable(currentPage, input.value.toLowerCase()) });
                    }
                });
            }
        });
    })
    .catch(err => {
        console.error("Error en verInstructores:", err);
        Swal.fire("Error", "No se pudieron cargar los instructores.", "error");
    });
}




    function eliminarAsociaciones(id_comp, id_instructor) {
    fetch('/eliminarAsociaciones', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_comp, id_instructor })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
        verInstructores(id_comp);
        } else {
        Swal.fire({ icon: 'error', text: 'No se pudo eliminar.', didOpen: customSwalStyling });
        }
    });
    }



    function editarCompetencia(id, btn) {
      const row = btn.closest('tr');
      const tipoActual = row.querySelector('.tipo').innerText.trim() === 'Transversal' ? '0' : '1';
      const sigla = row.querySelector('.sigla').innerText;
    
      Swal.fire({
        title: 'Editar Competencia',
        html: `
          <select id="tipo" class="swal2-select">
            <option value="0" ${tipoActual === '0' ? 'selected' : ''}>Transversal</option>
            <option value="1" ${tipoActual === '1' ? 'selected' : ''}>Técnica</option>
          </select>
          <input id="sigla" class="swal2-input" placeholder="Sigla" value="${sigla}">
        `,
        confirmButtonText: 'Guardar',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonColor: "#1e7e34",
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: customSwalStyling,
        preConfirm: () => {
          const valorTipo = document.getElementById('tipo').value;  // ya es "0" o "1"
          const nuevaSigla = document.getElementById('sigla').value;
          return fetch('/editarComp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id, tipo: valorTipo, sigla: nuevaSigla })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              row.querySelector('.tipo').innerText = data.tipo == 0 ? 'Transversal' : 'Técnica';
              row.querySelector('.sigla').innerText = data.sigla;
              Swal.fire({ icon:'success', text:'Actualizado correctamente!', didOpen: customSwalStyling,  confirmButtonColor: '#1e7e34' });
            }
          });
        }
      });
    }


    function verCompetencia(id) {
      fetch('/verComp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
      })
      .then(res => res.json())
      .then(data => {
        let html = `<strong>Sigla:</strong> ${data.sigla}<br><br>`;

        // Agregar botones para gestión masiva
        html += `
          <div class="mb-3">
            <button onclick="agregarPerfilMasivo(${id})" class="btn btn-sm btn-success me-2">
              <i class="fa fa-plus"></i> Agregar Perfil a Múltiples RAPs
            </button>
            <button onclick="eliminarPerfilMasivo(${id})" class="btn btn-sm btn-warning">
              <i class="fa fa-minus"></i> Eliminar Perfil de Múltiples RAPs
            </button>
          </div>
          <hr>
        `;

        data.raps.forEach(rap => {
          html += `
            <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px">
              <b>${rap.descripcion}</b><br>
              <button onclick="togglePerfiles(${rap.id_raps})" class="btn btn-sm btn-outline-info mt-2">Mostrar Perfiles</button>
              <div id="perfiles-${rap.id_raps}" class="mt-2" style="display: none"></div>
            </div>
          `;
        });

        Swal.fire({
          title: data.nombre,
          showCloseButton: true,
          html: html,
          width: 800,
          confirmButtonColor: "#1e7e34",
          background: "#fff",
          backdrop: "rgba(0,0,0,0.4)",
          didOpen: customSwalStyling
        });
      });
    }


    function togglePerfiles(id_raps) {
      const cont = document.getElementById(`perfiles-${id_raps}`);
      if (cont.style.display === "none") {
        verPerfiles(id_raps);
        cont.style.display = "block";
      } else {
        cont.style.display = "none";
      }
    }

    function verPerfiles(id_raps) {
      fetch('/perfilesRap', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id_raps: id_raps})
      })
      .then(res => res.json())
      .then(data => {
        const cont = document.getElementById(`perfiles-${id_raps}`);
        cont.innerHTML = '';
        data.perfiles.forEach(p => {
          cont.innerHTML += `<div class="d-flex justify-content-between">
            <span>${p.nombre}</span>
            <button onclick="eliminarPerfilRap(${id_raps}, ${p.id})" class="btn btn-sm btn-danger">Eliminar</button>
          </div>`;
        });
        cont.innerHTML += `
          <select id="nuevoPerfil-${id_raps}" class="form-select mt-2">
            ${data.todos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
          </select>
          <button onclick="agregarPerfilRap(${id_raps})" class="btn btn-sm btn-success mt-1">Agregar</button>
        `;
      });
    }

    function agregarPerfilRap(id_raps) {
      const id_perfil = document.getElementById(`nuevoPerfil-${id_raps}`).value;
      fetch('/guardarPerfilRap', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id_raps: id_raps, id_perfil: id_perfil})
      }).then(res => res.json()).then(data => {
        if (data.success) {
          verPerfiles(id_raps);
        } else {
          Swal.fire({icon: 'error', text: 'Ya está asociado.', didOpen: customSwalStyling,  confirmButtonColor: '#1e7e34'});
        }
      });
    }

    function eliminarPerfilRap(id_raps, id_perfil) {
      fetch('/eliminarPerfilRap', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id_raps: id_raps, id_perfil: id_perfil})
      }).then(() => verPerfiles(id_raps));
    }

    function customSwalStyling() {
      const popup = Swal.getPopup(); 
      const logo = document.createElement("img");
      logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
      Object.assign(logo.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: "0.2",
        width: "220px",
        pointerEvents: "none",
        zIndex: "0"
      });
      popup.insertBefore(logo, popup.firstChild);
      popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
        .forEach(el => el.style.zIndex = "1");
      const successIcon = popup.querySelector(".swal2-icon.swal2-success");
      if (successIcon) {
        popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right")
          .forEach(el => el.style.backgroundColor = "transparent");
        const fix = popup.querySelector(".swal2-success-fix");
        if (fix) fix.style.backgroundColor = "transparent";
        const ring = popup.querySelector(".swal2-success-ring");
        if (ring) ring.style.zIndex = "1";
        popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long")
          .forEach(el => el.style.zIndex = "2");
      }
    }

    document.getElementById('buscador').addEventListener('keyup', function() {
      const valor = this.value.toLowerCase();
      document.querySelectorAll('#tablaCompetencias tbody tr').forEach(row => {
        const texto = row.innerText.toLowerCase();
        row.style.display = texto.includes(valor) ? '' : 'none';
      });
    });




// --- AGREGAR MASIVO ---
function agregarPerfilMasivo(id_comp) {
  Promise.all([
    fetch('/verComp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: id_comp})
    }).then(r => r.json()),
    fetch('/perfilesRap', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id_comp: id_comp})
    }).then(r => r.json())
  ]).then(([compData, perfilData]) => {
    const raps = compData.raps || [];
    const total_raps = perfilData.total_raps || 0;
    const perfiles_status = perfilData.perfiles_status || [];

    // Mostrar solo perfiles que NO están en todos los RAPs
    const perfilesDisponibles = perfiles_status.filter(p => p.associated_count < total_raps);

    if (perfilesDisponibles.length === 0) {
      Swal.fire({ icon: 'info', text: 'No hay perfiles disponibles para agregar. Todos los perfiles ya están asociados a todos los RAPs.', didOpen: customSwalStyling });
      return;
    }

    const html = `
      <div class="mb-3">
        <label class="form-label"><strong>Seleccionar Perfil:</strong></label>
        <select id="perfilMasivo" class="form-select">
          ${perfilesDisponibles.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label"><strong>Seleccionar RAPs:</strong></label>
        <div id="rapsContainer" style="max-height:200px; overflow-y:auto; border:1px solid #ddd; padding:10px;">
          <!-- Se cargarán los RAPs faltantes aquí -->
        </div>
      </div>
      <div class="mb-2">
        <button id="selTodosAgregar" class="btn btn-sm btn-outline-primary me-2">Seleccionar Todos</button>
        <button id="deselTodosAgregar" class="btn btn-sm btn-outline-secondary">Deseleccionar Todos</button>
      </div>
    `;

    Swal.fire({
      title: 'Agregar Perfil a Múltiples RAPs',
      html,
      width: 650,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: "#1e7e34",
      showCloseButton: true,
      didOpen: () => {
        customSwalStyling();

        const perfilSelect = document.getElementById('perfilMasivo');
        const rapsContainer = document.getElementById('rapsContainer');
        const selTodosBtn = document.getElementById('selTodosAgregar');
        const deselTodosBtn = document.getElementById('deselTodosAgregar');

        // Carga los RAPs faltantes para un perfil usando /rapsPorPerfil
        function cargarRapsFaltantes(id_perfil) {
          rapsContainer.innerHTML = `<div class="text-muted">Cargando...</div>`;
          fetch('/rapsPorPerfil', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id_comp: id_comp, id_perfil: id_perfil })
          })
          .then(r => r.json())
          .then(data => {
            const faltantes = data.raps_faltantes || [];
            if (!faltantes.length) {
              rapsContainer.innerHTML = `<div class="text-muted">Este perfil ya está asociado a todos los RAPs de la competencia.</div>`;
              return;
            }
            rapsContainer.innerHTML = faltantes.map(rap => `
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${rap.id_raps}" id="rap-${rap.id_raps}">
                <label class="form-check-label" for="rap-${rap.id_raps}">${rap.descripcion}</label>
              </div>
            `).join('');
          })
          .catch(err => {
            console.error(err);
            rapsContainer.innerHTML = `<div class="text-danger">Error al cargar RAPs.</div>`;
          });
        }

        // Inicial
        if (perfilSelect.value) cargarRapsFaltantes(perfilSelect.value);

        // Al cambiar perfil, recargar faltantes
        perfilSelect.addEventListener('change', function(){ cargarRapsFaltantes(this.value); });

        selTodosBtn.addEventListener('click', () => document.querySelectorAll('#rapsContainer input[type="checkbox"]').forEach(cb => cb.checked = true));
        deselTodosBtn.addEventListener('click', () => document.querySelectorAll('#rapsContainer input[type="checkbox"]').forEach(cb => cb.checked = false));
      },
      preConfirm: () => {
        const id_perfil = document.getElementById('perfilMasivo').value;
        const rapsSeleccionados = Array.from(document.querySelectorAll('#rapsContainer input[type="checkbox"]:checked')).map(cb => cb.value);
        if (rapsSeleccionados.length === 0) {
          Swal.showValidationMessage('Debes seleccionar al menos un RAP faltante para agregar.');
          return false;
        }
        return procesarPerfilMasivo(id_perfil, rapsSeleccionados, 'agregar');
      }
    });

  }).catch(err => {
    console.error(err);
    Swal.fire('Error', 'No se pudo cargar la información.', 'error');
  });
}


// --- ELIMINAR MASIVO ---
function eliminarPerfilMasivo(id_comp) {
  Promise.all([
    fetch('/verComp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: id_comp})
    }).then(r => r.json()),
    fetch('/perfilesRap', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id_comp: id_comp})
    }).then(r => r.json())
  ]).then(([compData, perfilData]) => {
    const raps = compData.raps || [];
    const perfiles_status = perfilData.perfiles_status || [];

    // Mostrar solo perfiles que tengan al menos 1 asociación dentro de la competencia
    const perfilesDisponibles = perfiles_status.filter(p => (p.associated_count || 0) > 0);

    if (perfilesDisponibles.length === 0) {
      Swal.fire({ icon: 'info', text: 'No hay perfiles asociados a esta competencia.', didOpen: customSwalStyling,confirmButtonColor: '#1e7e34' });
      return;
    }

    const html = `
      <div class="mb-3">
        <label class="form-label"><strong>Seleccionar Perfil:</strong></label>
        <select id="perfilMasivoEliminar" class="form-select">
          ${perfilesDisponibles.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label"><strong>Seleccionar RAPs:</strong></label>
        <div id="rapsEliminarContainer" style="max-height:200px; overflow-y:auto; border:1px solid #ddd; padding:10px;">
          <!-- Se cargarán los RAPs asociados aquí -->
        </div>
      </div>
      <div class="mb-2">
        <button id="selTodosEliminar" class="btn btn-sm btn-outline-primary me-2">Seleccionar Todos</button>
        <button id="deselTodosEliminar" class="btn btn-sm btn-outline-secondary">Deseleccionar Todos</button>
      </div>
    `;

    Swal.fire({
      title: 'Eliminar Perfil de Múltiples RAPs',
      html,
      width: 650,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: "#dc3545",
      showCloseButton: true,
      didOpen: () => {
        customSwalStyling();

        const perfilSelect = document.getElementById('perfilMasivoEliminar');
        const rapsEliminarContainer = document.getElementById('rapsEliminarContainer');
        const selTodosBtn = document.getElementById('selTodosEliminar');
        const deselTodosBtn = document.getElementById('deselTodosEliminar');

        function cargarRapsAsociados(id_perfil) {
          rapsEliminarContainer.innerHTML = `<div class="text-muted">Cargando...</div>`;
          fetch('/rapsPorPerfil', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id_comp: id_comp, id_perfil: id_perfil })
          })
          .then(r => r.json())
          .then(data => {
            const asociados = data.raps_asociados || [];
            if (!asociados.length) {
              rapsEliminarContainer.innerHTML = `<div class="text-muted">Este perfil no está asociado a ningún RAP de la competencia.</div>`;
              return;
            }
            rapsEliminarContainer.innerHTML = asociados.map(rap => `
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${rap.id_raps}" id="rap-eliminar-${rap.id_raps}">
                <label class="form-check-label" for="rap-eliminar-${rap.id_raps}">${rap.descripcion}</label>
              </div>
            `).join('');
          })
          .catch(err => {
            console.error(err);
            rapsEliminarContainer.innerHTML = `<div class="text-danger">Error al cargar RAPs.</div>`;
          });
        }

        // Inicial
        if (perfilSelect.value) cargarRapsAsociados(perfilSelect.value);
        perfilSelect.addEventListener('change', function(){ cargarRapsAsociados(this.value); });

        selTodosBtn.addEventListener('click', () => document.querySelectorAll('#rapsEliminarContainer input[type="checkbox"]').forEach(cb => cb.checked = true));
        deselTodosBtn.addEventListener('click', () => document.querySelectorAll('#rapsEliminarContainer input[type="checkbox"]').forEach(cb => cb.checked = false));
      },
      preConfirm: () => {
        const id_perfil = document.getElementById('perfilMasivoEliminar').value;
        const rapsSeleccionados = Array.from(document.querySelectorAll('#rapsEliminarContainer input[type="checkbox"]:checked')).map(cb => cb.value);
        if (rapsSeleccionados.length === 0) {
          Swal.showValidationMessage('Debes seleccionar al menos un RAP asociado para eliminar.');
          return false;
        }
        return procesarPerfilMasivo(id_perfil, rapsSeleccionados, 'eliminar');
      }
    });

  }).catch(err => {
    console.error(err);
    Swal.fire('Error', 'No se pudo cargar la información.', 'error');
  });
}


function seleccionarTodosRaps(seleccionar) {
  const checkboxes = document.querySelectorAll('input[id^="rap-"]:not([id*="eliminar"])');
  checkboxes.forEach(cb => cb.checked = seleccionar);
}

function seleccionarTodosRapsEliminar(seleccionar) {
  const checkboxes = document.querySelectorAll('input[id^="rap-eliminar-"]');
  checkboxes.forEach(cb => cb.checked = seleccionar);
}

function procesarPerfilMasivo(id_perfil, rapsSeleccionados, accion) {
  const promesas = rapsSeleccionados.map(id_raps => {
    if (accion === 'agregar') {
      return fetch('/guardarPerfilRap', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id_raps: id_raps, id_perfil: id_perfil})
      }).then(res => res.json());
    } else {
      return fetch('/eliminarPerfilRap', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id_raps: id_raps, id_perfil: id_perfil})
      }).then(res => res.json());
    }
  });
  
  return Promise.all(promesas).then(resultados => {
    const exitosos = resultados.filter(r => r.success !== false).length;
    const fallidos = resultados.length - exitosos;
    
    let mensaje = '';
    if (accion === 'agregar') {
      mensaje = `Perfil agregado a ${exitosos} RAPs`;
      if (fallidos > 0) {
        mensaje += ` (${fallidos} ya estaban asociados)`;
      }
    } else {
      mensaje = `Perfil eliminado de ${exitosos} RAPs`;
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Proceso completado',
      text: mensaje,
      confirmButtonColor: '#1e7e34',
      didOpen: customSwalStyling
    });
  }).catch(error => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al procesar la operación',
      confirmButtonColor: '#1e7e34',
      didOpen: customSwalStyling
    });
  });
}