document.addEventListener("DOMContentLoaded", function () {
  console.log("Cédula global:", cedula);
  if (!cedula || cedula.trim() === "") {
    console.error("La variable 'cedula' está vacía. Verifica la inyección en el HTML.");
  }

  // Inicializa Select2 en el select con id "buscar"
  $("#buscar").select2({
    placeholder: "Seleccionar Competencia",
    allowClear: true
  });

  cargarCompetencias();
  cargarAsociaciones(); // Cargamos todas las asociaciones y luego paginamos en el cliente

  // <-- aquí llamas al helper para deshabilitar las options vacías desde el inicio
  actualizarDisponibilidadCompetencias();

  document.getElementById('btn-asociar').addEventListener('click', asociarCompetencia);
  document.getElementById("btn-prev").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderAsociaciones();
    }
  });
  document.getElementById("btn-next").addEventListener("click", () => {
    const totalPages = Math.ceil(groupedAssociations.length / groupsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderAsociaciones();
    }
  });
});

let currentPage = 1;
const groupsPerPage = 3; // Mostrar 5 grupos (competencias) por página
let groupedAssociations = []; // Aquí se almacenarán los grupos (cada grupo es una competencia con sus asociaciones)

function actualizarDisponibilidadCompetencias() {
  const select = document.getElementById('buscar');
  Array.from(select.options).forEach(opt => {
    if (!opt.value) return;
    const allIds = JSON.parse(opt.dataset.allids);
    const idComp = allIds[0];
    fetch(`/get_raps_by_competencia?id_comp=${encodeURIComponent(idComp)}`)
      .then(r => r.json())
      .then(data => {
        const grupo = groupedAssociations.find(g => g.nombre === opt.value);
        const asociados = grupo ? grupo.rapIds.map(String) : [];
        const disponibles = data.raps.filter(rap => !asociados.includes(String(rap.id_rap)));
        opt.disabled = disponibles.length === 0;
        opt.style.color = opt.disabled ? 'gray' : '';
        $("#buscar").trigger('change');
      })
      .catch(console.error);
  });
}

// Cargar competencias para el select
function cargarCompetencias() {
  fetch('/get_competencias')
    .then(response => {
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor (código " + response.status + ")");
      }
      return response.json();
    })
    .then(data => {
      const select = document.getElementById('buscar');
      select.innerHTML = '<option value="">Seleccionar</option>';
      data.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp.nombre;
        option.textContent = comp.nombre;
        // Se guarda la lista completa de id_comps en data-allids (como JSON)
        option.dataset.allids = JSON.stringify(comp.id_comps);
        select.appendChild(option);
      });
      $("#buscar").trigger('change');
      console.log("Competencias cargadas:", data);
      actualizarDisponibilidadCompetencias();
    })
    .catch(error => {
      console.error('Error al cargar competencias:', error);
      Swal.fire({
        title: "Error",
        text: "No se pudo cargar las competencias",
        icon: "error",
        confirmButtonColor: "#1e7e34",
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => {
            const popup = Swal.getPopup(); 
            const logo = document.createElement("img");
            logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
            
            // Estilos para el logo
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
            
            // Insertar el logo
            popup.insertBefore(logo, popup.firstChild);
            
            // Asegurar que contenido esté por encima
            popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                .forEach(el => el.style.zIndex = "1");
            
            // Específicamente para el icono de success
            const successIcon = popup.querySelector(".swal2-icon.swal2-success");
            if (successIcon) {
                // Hacer transparente el fondo circular blanco del icono success
                const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
                circularLines.forEach(el => {
                    el.style.backgroundColor = "transparent";
                });
                
                // También hacer transparente el fix que SweetAlert2 usa
                const successFix = popup.querySelector(".swal2-success-fix");
                if (successFix) {
                    successFix.style.backgroundColor = "transparent";
                }
                
                // Asegurar que el anillo y la marca de verificación sean visibles
                const successRing = popup.querySelector(".swal2-success-ring");
                if (successRing) {
                    successRing.style.zIndex = "1";
                }
                
                const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
                successLines.forEach(el => {
                    el.style.zIndex = "2";
                });
            }
        }
      });
    });
}

// Cargar todas las asociaciones y agruparlas por competencia
function cargarAsociaciones() {
  fetch(`/get_asociaciones?cedula=${encodeURIComponent(cedula)}&page=1&per_page=9999`)
    .then(r => {
      if (!r.ok) throw new Error(`Status ${r.status}`);
      return r.json();
    })
    .then(data => {
      console.log("Datos recibidos de asociaciones:", data);
      const grouped = {};

      data.asociaciones.forEach(item => {
        if (!grouped[item.nombre]) {
          grouped[item.nombre] = {
            id_asociaciones:    [],
            id_comps:           [],
            nombre_programas:   [],
            siglas:             [],
            rapIds:             [],
            rapDescripciones:   []
          };
        }
        const g = grouped[item.nombre];
        g.id_asociaciones.push(item.id_asociacion);
        g.id_comps.push(item.id_comp);
        g.nombre_programas.push(item.nombre_programa);
        g.siglas.push(item.sigla);
        g.rapIds.push(item.id_raps);
        g.rapDescripciones.push(item.rap_descripcion);
      });

      groupedAssociations = Object.entries(grouped).map(([nombre, g]) => ({
        nombre,
        id_asociaciones:  g.id_asociaciones,
        id_comps:         g.id_comps,
        nombre_programas: g.nombre_programas,
        sigla:            g.siglas[0] || '',
        rapIds:           g.rapIds,
        rapDescripciones: g.rapDescripciones
      }));

      currentPage = 1;
      renderAsociaciones();

      // actualizar el select...
      const counts = {};
      for (const [nombre, g] of Object.entries(grouped)) {
        counts[nombre] = g.id_comps.length;
      }
      actualizarSelectCompetencias(counts);
      actualizarDisponibilidadCompetencias();
    })
    .catch(error => {
      console.error('Error al cargar asociaciones:', error);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar las asociaciones",
        icon: "error",
        confirmButtonColor: "#1e7e34",
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => {
            const popup = Swal.getPopup(); 
            const logo = document.createElement("img");
            logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
            
            // Estilos para el logo
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
            
            // Insertar el logo
            popup.insertBefore(logo, popup.firstChild);
            
            // Asegurar que contenido esté por encima
            popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                .forEach(el => el.style.zIndex = "1");
            
            // Específicamente para el icono de success
            const successIcon = popup.querySelector(".swal2-icon.swal2-success");
            if (successIcon) {
                // Hacer transparente el fondo circular blanco del icono success
                const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
                circularLines.forEach(el => {
                    el.style.backgroundColor = "transparent";
                });
                
                // También hacer transparente el fix que SweetAlert2 usa
                const successFix = popup.querySelector(".swal2-success-fix");
                if (successFix) {
                    successFix.style.backgroundColor = "transparent";
                }
                
                // Asegurar que el anillo y la marca de verificación sean visibles
                const successRing = popup.querySelector(".swal2-success-ring");
                if (successRing) {
                    successRing.style.zIndex = "1";
                }
                
                const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
                successLines.forEach(el => {
                    el.style.zIndex = "2";
                });
            }
        }
      });
    });
}

// Renderiza grupos en la tabla de la página actual
// asociarCompetencias.js → reemplaza por completo esta función
function renderAsociaciones() {
  const tbody = document.getElementById('tabla-asociaciones');
  tbody.innerHTML = "";

  const startIndex = (currentPage - 1) * groupsPerPage;
  const pageGroups = groupedAssociations.slice(startIndex, startIndex + groupsPerPage);

  pageGroups.forEach(grupo => {
    const idsAsoc = grupo.id_asociaciones.join(',');
    const idsComp = grupo.id_comps.join(',');
    const nombres  = JSON.stringify(grupo.nombre_programas);
    const rapIds   = JSON.stringify(grupo.rapIds);
    const rapDescs = JSON.stringify(grupo.rapDescripciones);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="oculto">${idsAsoc}</td>
      <td class="oculto">${idsComp}</td>
      <td>${grupo.nombre}</td>
      <td>${grupo.sigla}</td>
      <td>
        <button class="btn-eliminar-varios btn btn-danger btn-sm"
                data-idasociaciones='${idsAsoc}'
                data-nombre-programas='${nombres}'
                data-rapids='${rapIds}'
                data-rapdescs='${rapDescs}'
                data-nombre='${grupo.nombre}'>
          Eliminar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // paginación...
  const totalPages = Math.ceil(groupedAssociations.length / groupsPerPage);
  document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;
  document.getElementById('btn-prev').disabled = currentPage <= 1;
  document.getElementById('btn-next').disabled = currentPage >= totalPages;

  asignarEventosEliminarVarios();
}


// Deshabilitar opciones completadas en el select
function actualizarSelectCompetencias(counts) {
  const select = document.getElementById('buscar');
  Array.from(select.options).forEach(opt => {
    if (opt.value) {
      const ids = JSON.parse(opt.dataset.allids);
      const used = counts[opt.value] || 0;
      opt.disabled = used === ids.length;
      opt.style.color = used === ids.length ? 'gray' : '';
    }
  });
  $("#buscar").trigger('change');
}

// Eliminar asociaciones con checkboxes
// asociarCompetencias.js → reemplaza por completo esta función
function asignarEventosEliminarVarios() {
  document.querySelectorAll('.btn-eliminar-varios').forEach(btn => {
    btn.addEventListener('click', () => {
      const idsA     = btn.dataset.idasociaciones.split(',');
      const namesP   = JSON.parse(btn.dataset.nombreProgramas);
      const rapDescs = JSON.parse(btn.dataset.rapdescs);

      // Agrupar por descripción de RAP
      const porRap = {};
      idsA.forEach((idAsoc, i) => {
        const desc = rapDescs[i] || 'Sin RAP';
        porRap[desc] = porRap[desc] || [];
        porRap[desc].push({ id: idAsoc, name: namesP[i] || 'Sin programa' });
      });

      // Construir HTML de la SweetAlert
      let html = `
        <table style="width:100%; border-collapse:collapse; margin-bottom:1rem;">
          <thead>
            <tr>
              <th style="
                padding:8px;
                background:#1e7e34;
                color:#fff;
                text-align:left;
              ">Nombre Raps</th>
              <th style="
                padding:8px;
                background:#1e7e34;
                color:#fff;
                text-align:center;
              "></th>
            </tr>
          </thead>
          <tbody>
      `;
      let idx = 0;
      for (const [desc, items] of Object.entries(porRap)) {
        html += `
          <tr style="border-bottom:1px solid #ccc;">
            <td style="padding:8px;">${desc}</td>
            <td style="padding:8px; text-align:center;">
              <button type="button"
                      class="btn btn-sm btn-outline-secondary toggle-fichas"
                      data-idx="${idx}"
                      style="color:#000; border-color:#999;">
                Mostrar Fichas/ Ocultar 
              </button>
            </td>
          </tr>
          <tr id="fichas_${idx}" style="display:none;">
            <td colspan="2" style="padding:8px 16px;">
              <table style="width:100%; border-collapse:collapse;">
                <tbody>
        `;
        items.forEach(item => {
          html += `
                    <tr style="border-bottom:1px solid #ddd;">
                      <td style="padding:4px; width:30px;">
                        <input type="checkbox" id="chk_${item.id}" checked />
                      </td>
                      <td style="padding:4px;">${item.name}</td>
                    </tr>
          `;
        });
        html += `
                </tbody>
              </table>
            </td>
          </tr>
        `;
        idx++;
      }
      html += `</tbody></table>`;

      Swal.fire({
        title: `Eliminar asociaciones de ${btn.dataset.nombre}`,
        html,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#1e7e34',
        cancelButtonColor: '#d33',
        width: '880px',
        didOpen: () => {
          // --- bloque logo y estilos (igual que antes) ---
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
            const lines = popup.querySelectorAll(
              ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
            );
            lines.forEach(el => el.style.backgroundColor = "transparent");
            const fix = popup.querySelector(".swal2-success-fix");
            if (fix) fix.style.backgroundColor = "transparent";
            const ring = popup.querySelector(".swal2-success-ring");
            if (ring) ring.style.zIndex = "1";
            popup.querySelectorAll(
              ".swal2-success-line-tip, .swal2-success-line-long"
            ).forEach(el => el.style.zIndex = "2");
          }
          // --- fin bloque logo y estilos ---

          // Attach toggles
          popup.querySelectorAll('.toggle-fichas').forEach(button => {
            button.addEventListener('click', () => {
              const tr = popup.querySelector(`#fichas_${button.dataset.idx}`);
              tr.style.display = tr.style.display === 'none' ? 'table-row' : 'none';
            });
          });
        },
        preConfirm: () =>
          idsA.filter(id => {
            const chk = document.getElementById(`chk_${id}`);
            return chk && chk.checked;
          })
      }).then(res => {
        if (res.isConfirmed && res.value.length) {
          eliminarAsociacionesIndividuales(res.value);
        }
      });
    });
  });
}




// POST para eliminar
function eliminarAsociacionesIndividuales(listaIds) {
  fetch('/eliminar_asociaciones_individuales', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids_asociacion: listaIds })
  })
  .then(r => r.json())
  .then(resp => {
    if (resp.error) throw new Error(resp.error);
    Swal.fire({
      title: 'Eliminado',
      text: 'Asociaciones eliminadas',
      icon: 'success',
      confirmButtonColor: '#1e7e34',  // Color de botón de confirmación
      background: "#fff",
      backdrop: "rgba(0,0,0,0.4)",
      didOpen: () => {
          const popup = Swal.getPopup(); 
          const logo = document.createElement("img");
          logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
          
          // Estilos para el logo
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
          
          // Insertar el logo
          popup.insertBefore(logo, popup.firstChild);
          
          // Asegurar que contenido esté por encima
          popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
              .forEach(el => el.style.zIndex = "1");
          
          // Específicamente para el icono de success
          const successIcon = popup.querySelector(".swal2-icon.swal2-success");
          if (successIcon) {
              // Hacer transparente el fondo circular blanco del icono success
              const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
              circularLines.forEach(el => {
                  el.style.backgroundColor = "transparent";
              });
              
              // También hacer transparente el fix que SweetAlert2 usa
              const successFix = popup.querySelector(".swal2-success-fix");
              if (successFix) {
                  successFix.style.backgroundColor = "transparent";
              }
              
              // Asegurar que el anillo y la marca de verificación sean visibles
              const successRing = popup.querySelector(".swal2-success-ring");
              if (successRing) {
                  successRing.style.zIndex = "1";
              }
              
              const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
              successLines.forEach(el => {
                  el.style.zIndex = "2";
              });
          }
      }
    });
    cargarAsociaciones();
  })
  .catch(e => Swal.fire({
    title: 'Error',
    text: e.message || 'Falló eliminación',
    icon: 'error',
    confirmButtonColor: '#1e7e34',
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    didOpen: () => {
        const popup = Swal.getPopup(); 
        const logo = document.createElement("img");
        logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
        
        // Estilos para el logo
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
        
        // Insertar el logo
        popup.insertBefore(logo, popup.firstChild);
        
        // Asegurar que contenido esté por encima
        popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
            .forEach(el => el.style.zIndex = "1");
        
        // Específicamente para el icono de success
        const successIcon = popup.querySelector(".swal2-icon.swal2-success");
        if (successIcon) {
            // Hacer transparente el fondo circular blanco del icono success
            const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
            circularLines.forEach(el => {
                el.style.backgroundColor = "transparent";
            });
            
            // También hacer transparente el fix que SweetAlert2 usa
            const successFix = popup.querySelector(".swal2-success-fix");
            if (successFix) {
                successFix.style.backgroundColor = "transparent";
            }
            
            // Asegurar que el anillo y la marca de verificación sean visibles
            const successRing = popup.querySelector(".swal2-success-ring");
            if (successRing) {
                successRing.style.zIndex = "1";
            }
            
            const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
            successLines.forEach(el => {
                el.style.zIndex = "2";
            });
        }
    }
  }));
}


// ————— Integración de tipo para asociar —————
function asociarCompetencia() {
  const select = document.getElementById('buscar');
  const nombre_competencia = select.value;
  if (!nombre_competencia) {
    Swal.fire({
      title: 'Advertencia',
      text: 'Seleccione una competencia',
      icon: 'warning',
      confirmButtonColor: '#1e7e34',
      background: "#fff",
      backdrop: "rgba(0,0,0,0.4)",
      didOpen: () => {
          const popup = Swal.getPopup(); 
          const logo = document.createElement("img");
          logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
          
          // Estilos para el logo
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
          
          // Insertar el logo
          popup.insertBefore(logo, popup.firstChild);
          
          // Asegurar que contenido esté por encima
          popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
              .forEach(el => el.style.zIndex = "1");
          
          // Específicamente para el icono de success
          const successIcon = popup.querySelector(".swal2-icon.swal2-success");
          if (successIcon) {
              // Hacer transparente el fondo circular blanco del icono success
              const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
              circularLines.forEach(el => {
                  el.style.backgroundColor = "transparent";
              });
              
              // También hacer transparente el fix que SweetAlert2 usa
              const successFix = popup.querySelector(".swal2-success-fix");
              if (successFix) {
                  successFix.style.backgroundColor = "transparent";
              }
              
              // Asegurar que el anillo y la marca de verificación sean visibles
              const successRing = popup.querySelector(".swal2-success-ring");
              if (successRing) {
                  successRing.style.zIndex = "1";
              }
              
              const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
              successLines.forEach(el => {
                  el.style.zIndex = "2";
              });
          }
      }
    });
    return;
  }

  const allIds = JSON.parse(select.selectedOptions[0].dataset.allids);
  const selectedCompId = allIds[0]; // Tomamos el primer ID para consultar los RAPs

  // Paso 1: comprobar qué falta (tipo y/o sigla)
  fetch('/check_tipo_competencias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: allIds })
  })
  .then(res => res.json())
  .then(data => {
    const faltaTipo  = data.null_tipo_ids;
    const faltaSigla = data.null_sigla_ids;

    // Función para enviar la actualización de tipo+sigla
    function actualizarTipoYSigla(tipo, sigla) {
      return fetch('/set_tipo_competencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds, tipo, sigla })
      })
      .then(r => r.json());
    }

    // Función para hacer la asociación final con los RAPs seleccionados
    function hacerAsociacion(rapsSeleccionados = []) {
      fetch('/asociar_competencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cedula, 
          nombre_competencia,
          raps_ids: rapsSeleccionados 
        })
      })
      .then(r => r.json())
      .then(res => {
        if (res.error) throw new Error(res.error);
         // Limpiar el select después de asociar exitosamente
        $("#buscar").val('').trigger('change');

        Swal.fire({
          title: 'Éxito',
          text: 'Competencias y RAPs asociados correctamente',
          icon: 'success',
          confirmButtonColor: '#1e7e34',
          background: "#fff",
          backdrop: "rgba(0,0,0,0.4)",
          didOpen: () => {
              const popup = Swal.getPopup(); 
              const logo = document.createElement("img");
              logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
              
              // Estilos para el logo
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
              
              // Insertar el logo
              popup.insertBefore(logo, popup.firstChild);
              
              // Asegurar que contenido esté por encima
              popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                  .forEach(el => el.style.zIndex = "1");
              
              // Específicamente para el icono de success
              const successIcon = popup.querySelector(".swal2-icon.swal2-success");
              if (successIcon) {
                  // Hacer transparente el fondo circular blanco del icono success
                  const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
                  circularLines.forEach(el => {
                      el.style.backgroundColor = "transparent";
                  });
                  
                  // También hacer transparente el fix que SweetAlert2 usa
                  const successFix = popup.querySelector(".swal2-success-fix");
                  if (successFix) {
                      successFix.style.backgroundColor = "transparent";
                  }
                  
                  // Asegurar que el anillo y la marca de verificación sean visibles
                  const successRing = popup.querySelector(".swal2-success-ring");
                  if (successRing) {
                      successRing.style.zIndex = "1";
                  }
                  
                  const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
                  successLines.forEach(el => {
                      el.style.zIndex = "2";
                  });
              }
          }
        }).then(() => cargarAsociaciones());
      })
      .catch(e => Swal.fire({
        title: 'Error',
        text: e.message,
        icon: 'error',
        confirmButtonColor: '#1e7e34',
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => {
            const popup = Swal.getPopup(); 
            const logo = document.createElement("img");
            logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
            
            // Estilos para el logo
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
            
            // Insertar el logo
            popup.insertBefore(logo, popup.firstChild);
            
            // Asegurar que contenido esté por encima
            popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                .forEach(el => el.style.zIndex = "1");
            
            // Específicamente para el icono de success
            const successIcon = popup.querySelector(".swal2-icon.swal2-success");
            if (successIcon) {
                // Hacer transparente el fondo circular blanco del icono success
                const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
                circularLines.forEach(el => {
                    el.style.backgroundColor = "transparent";
                });
                
                // También hacer transparente el fix que SweetAlert2 usa
                const successFix = popup.querySelector(".swal2-success-fix");
                if (successFix) {
                    successFix.style.backgroundColor = "transparent";
                }
                
                // Asegurar que el anillo y la marca de verificación sean visibles
                const successRing = popup.querySelector(".swal2-success-ring");
                if (successRing) {
                    successRing.style.zIndex = "1";
                }
                
                const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
                successLines.forEach(el => {
                    el.style.zIndex = "2";
                });
            }
        }
      }));
    }

    // Función para mostrar el SweetAlert con los RAPs
    // Dentro de asociarCompetencia(), sustituye mostrarSweetAlertRaps() por esto:
    function mostrarSweetAlertRaps() {
      // Buscamos en groupedAssociations el grupo de la competencia seleccionada
      const grupo = groupedAssociations.find(g => g.nombre === nombre_competencia);
      // Obtenemos los IDs ya asociados (como strings)
      const asociados = grupo ? grupo.rapIds.map(id => String(id)) : [];

      // Traemos todos los RAPs de la competencia
      fetch(`/get_raps_by_competencia?id_comp=${selectedCompId}`)
        .then(resp => resp.json())
        .then(data => {
          // Filtramos solo los que NO están asociados
          const disponibles = data.raps.filter(rap =>
            !asociados.includes(String(rap.id_rap))
          );

          // Si no quedan RAPs por asociar, continuamos sin mostrar SweetAlert
          if (disponibles.length === 0) {
            return hacerAsociacion([]);
          }

          // Construimos el HTML con los RAPs disponibles
          let html = '<div style="text-align:left;max-height:400px;overflow-y:auto;">';
          disponibles.forEach(rap => {
            html += `
              <div style="margin-bottom:10px;padding:5px;border-bottom:1px solid #eee;">
                <label>
                  <input type="checkbox" id="rap_${rap.id_rap}" value="${rap.id_rap}" checked>
                  <span style="margin-left:5px;font-size:14px;">${rap.descripcion}</span>
                </label>
              </div>
            `;
          });
          html += '</div><div style="margin-top:10px;">'
              + '<button id="selectAllRaps" class="btn btn-outline-success btn-sm">Seleccionar todos</button> '
              + '<button id="deselectAllRaps" class="btn btn-outline-secondary btn-sm">Deseleccionar todos</button>'
              + '</div>';

          Swal.fire({
            title: 'Selecciona los RAPs a asociar',
            html,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Asociar RAPs seleccionados',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1e7e34',
            cancelButtonColor: '#d33',
            width: '600px',
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)",
            didOpen: () => {
              // tu bloque de logo y estilos intacto...
              const popup = Swal.getPopup();
              const logo = document.createElement("img");
              logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
              Object.assign(logo.style, { position:"absolute", top:"50%", left:"50%",
                transform:"translate(-50%,-50%)", opacity:"0.2", width:"220px",
                pointerEvents:"none", zIndex:"0" });
              popup.insertBefore(logo, popup.firstChild);
              popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                  .forEach(el => el.style.zIndex = "1");
              const successIcon = popup.querySelector(".swal2-icon.swal2-success");
              if (successIcon) {
                const lines = popup.querySelectorAll(
                  ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                );
                lines.forEach(el => el.style.backgroundColor = "transparent");
                const fix = popup.querySelector(".swal2-success-fix");
                if (fix) fix.style.backgroundColor = "transparent";
                const ring = popup.querySelector(".swal2-success-ring");
                if (ring) ring.style.zIndex = "1";
                popup.querySelectorAll(
                  ".swal2-success-line-tip, .swal2-success-line-long"
                ).forEach(el => el.style.zIndex = "2");
              }

              // Select/Deselect All
              document.getElementById('selectAllRaps')
                      .addEventListener('click', () => {
                        document.querySelectorAll('[id^="rap_"]').forEach(cb => cb.checked = true);
                      });
              document.getElementById('deselectAllRaps')
                      .addEventListener('click', () => {
                        document.querySelectorAll('[id^="rap_"]').forEach(cb => cb.checked = false);
                      });
            },
            preConfirm: () => {
              // Recogemos solo los RAPs disponibles seleccionados
              return Array.from(document.querySelectorAll('[id^="rap_"]'))
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            }
          }).then(result => {
            if (result.isConfirmed) {
              hacerAsociacion(result.value);
            }
          });
        })
        .catch(error => {
          console.error("Error al obtener RAPs:", error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los RAPs de la competencia',
            icon: 'error',
            confirmButtonColor: '#1e7e34',
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)"
          });
        });
    }


    // Si no falta ni tipo ni sigla, vamos directo a mostrar los RAPs
    if (!faltaTipo.length && !faltaSigla.length) {
      return mostrarSweetAlertRaps();
    }

    // Cadena de SweetAlerts según lo que falte:
    // 1) Si falta tipo, preguntamos primero
    const pideTipo = faltaTipo.length
      ? Swal.fire({
          title: 'Definir tipo de competencia',
          text: 'Estas competencias no tienen tipo. ¿Transversal o Técnica?',
          icon: 'question',
          input: 'radio',
          inputOptions: { '0': 'Transversal', '1': 'Técnica' },
          inputValidator: v => v === null ? 'Seleccione una opción' : null,
          confirmButtonText: 'OK',
          confirmButtonColor: '#1e7e34',
          cancelButtonText: 'Cancelar',
          cancelButtonColor: '#d33',
          background: "#fff",
          backdrop: "rgba(0,0,0,0.4)",
          didOpen: () => {
              const popup = Swal.getPopup(); 
              const logo = document.createElement("img");
              logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
              
              // Estilos para el logo
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
              
              // Insertar el logo
              popup.insertBefore(logo, popup.firstChild);
              
              // Asegurar que contenido esté por encima
              popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                  .forEach(el => el.style.zIndex = "1");
              
              // Específicamente para el icono de success
              const successIcon = popup.querySelector(".swal2-icon.swal2-success");
              if (successIcon) {
                  // Hacer transparente el fondo circular blanco del icono success
                  const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
                  circularLines.forEach(el => {
                      el.style.backgroundColor = "transparent";
                  });
                  
                  // También hacer transparente el fix que SweetAlert2 usa
                  const successFix = popup.querySelector(".swal2-success-fix");
                  if (successFix) {
                      successFix.style.backgroundColor = "transparent";
                  }
                  
                  // Asegurar que el anillo y la marca de verificación sean visibles
                  const successRing = popup.querySelector(".swal2-success-ring");
                  if (successRing) {
                      successRing.style.zIndex = "1";
                  }
                  
                  const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
                  successLines.forEach(el => {
                      el.style.zIndex = "2";
                  });
              }
          }
        })
      : Promise.resolve({ isConfirmed: true, value: null });

    pideTipo.then(choice => {
      if (choice.isConfirmed) {
        const tipoSeleccionado = choice.value !== null
          ? parseInt(choice.value, 10)
          : null;

        // 2) Si falta sigla, la pedimos después
        const pideSigla = faltaSigla.length
          ? Swal.fire({
              title: 'Ingrese la sigla',
              input: 'text',
              inputPlaceholder: 'Escriba la sigla',
              inputValidator: v => !v && 'La sigla es obligatoria',
              confirmButtonText: 'Guardar sigla',
              confirmButtonColor: '#1e7e34',
              showCancelButton: true,
              cancelButtonText: 'Cancelar',
              cancelButtonColor: '#d33',
              background: "#fff",
              backdrop: "rgba(0,0,0,0.4)",
              didOpen: () => {
                  const popup = Swal.getPopup(); 
                  const logo = document.createElement("img");
                  logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
                  
                  // Estilos para el logo
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
                  
                  // Insertar el logo
                  popup.insertBefore(logo, popup.firstChild);
                  
                  // Asegurar que contenido esté por encima
                  popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                      .forEach(el => el.style.zIndex = "1");
                  
                  // Específicamente para el icono de success
                  const successIcon = popup.querySelector(".swal2-icon.swal2-success");
                  if (successIcon) {
                      // Hacer transparente el fondo circular blanco del icono success
                      const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
                      circularLines.forEach(el => {
                          el.style.backgroundColor = "transparent";
                      });
                      
                      // También hacer transparente el fix que SweetAlert2 usa
                      const successFix = popup.querySelector(".swal2-success-fix");
                      if (successFix) {
                          successFix.style.backgroundColor = "transparent";
                      }
                      
                      // Asegurar que el anillo y la marca de verificación sean visibles
                      const successRing = popup.querySelector(".swal2-success-ring");
                      if (successRing) {
                          successRing.style.zIndex = "1";
                      }
                      
                      const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
                      successLines.forEach(el => {
                          el.style.zIndex = "2";
                      });
                  }
              }
            })
          : Promise.resolve({ isConfirmed: true, value: null });

        return pideSigla.then(sigRes => {
          if (sigRes.isConfirmed) {
            const sigla = sigRes.value ? sigRes.value.trim() : null;
            // 3) Ejecutar update
            return actualizarTipoYSigla(tipoSeleccionado, sigla)
              .then(upd => {
                if (upd.success) {
                  // Después de actualizar tipo/sigla, mostramos los RAPs
                  mostrarSweetAlertRaps();
                } else {
                  throw new Error(upd.error || 'Fallo al actualizar tipo/sigla');
                }
              });
          }
        });
      }
    })
    .catch(err => {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Error en el flujo de tipo/sigla',
        icon: 'error',
        confirmButtonColor: '#1e7e34',
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => {
            const popup = Swal.getPopup(); 
            const logo = document.createElement("img");
            logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
            
            // Estilos para el logo
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
            
            // Insertar el logo
            popup.insertBefore(logo, popup.firstChild);
            
            // Asegurar que contenido esté por encima
            popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                .forEach(el => el.style.zIndex = "1");
            
            // Específicamente para el icono de success
            const successIcon = popup.querySelector(".swal2-icon.swal2-success");
            if (successIcon) {
                // Hacer transparente el fondo circular blanco del icono success
                const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
                circularLines.forEach(el => {
                    el.style.backgroundColor = "transparent";
                });
                
                // También hacer transparente el fix que SweetAlert2 usa
                const successFix = popup.querySelector(".swal2-success-fix");
                if (successFix) {
                    successFix.style.backgroundColor = "transparent";
                }
                
                // Asegurar que el anillo y la marca de verificación sean visibles
                const successRing = popup.querySelector(".swal2-success-ring");
                if (successRing) {
                    successRing.style.zIndex = "1";
                }
                
                const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
                successLines.forEach(el => {
                    el.style.zIndex = "2";
                });
            }
        }
      });
    });

  })
  .catch(() => {
    Swal.fire({
      title: 'Error',
      text: 'Error al comprobar tipo/sigla',
      icon: 'error',
      confirmButtonColor: '#1e7e34',
      background: "#fff",
      backdrop: "rgba(0,0,0,0.4)",
      didOpen: () => {
          const popup = Swal.getPopup(); 
          const logo = document.createElement("img");
          logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
          
          // Estilos para el logo
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
          
          // Insertar el logo
          popup.insertBefore(logo, popup.firstChild);
          
          // Asegurar que contenido esté por encima
          popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
              .forEach(el => el.style.zIndex = "1");
          
          // Específicamente para el icono de success
          const successIcon = popup.querySelector(".swal2-icon.swal2-success");
          if (successIcon) {
              // Hacer transparente el fondo circular blanco del icono success
              const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
              circularLines.forEach(el => {
                  el.style.backgroundColor = "transparent";
              });
              
              // También hacer transparente el fix que SweetAlert2 usa
              const successFix = popup.querySelector(".swal2-success-fix");
              if (successFix) {
                  successFix.style.backgroundColor = "transparent";
              }
              
              // Asegurar que el anillo y la marca de verificación sean visibles
              const successRing = popup.querySelector(".swal2-success-ring");
              if (successRing) {
                  successRing.style.zIndex = "1";
              }
              
              const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
              successLines.forEach(el => {
                  el.style.zIndex = "2";
              });
          }
      }
    });
  });
}

// Función para revisar competencias no asociadas
function revisarCompetenciasNoAsociadas() {
  fetch("/competencias_sin_asociar")
    .then(res => res.json())
    .then(data => {
      const boton = document.getElementById("verFaltantesBtn");
      const lista = document.getElementById("listaFaltantes");
      if (!boton || !lista) return;

      const total = data.total ?? 0;
      const competencias = Array.isArray(data.competencias) ? data.competencias : [];

      // Solo mostramos el botón si quedan 1-10 competencias únicas sin asociar
      if (total > 0) {
        boton.classList.remove("d-none");
        lista.innerHTML = "";

        competencias.forEach(comp => {
          const li = document.createElement("li");
          li.className = "list-group-item";
          li.textContent = comp.nombre;
          lista.appendChild(li);
        });
      } else {
        boton.classList.add("d-none");
        lista.innerHTML = "";
      }
    })
    .catch(err => console.error("Error obteniendo competencias:", err));
}

// Mostrar el modal cuando se haga clic en el botón "verFaltantesBtn"
document.addEventListener("DOMContentLoaded", () => {
  const boton = document.getElementById("verFaltantesBtn");
  if (boton) {
    boton.addEventListener("click", () => {
      const modalEl = document.getElementById("modalFaltantes");
      new bootstrap.Modal(modalEl).show();
    });
  }

  // Llamar la función inmediatamente para revisar las competencias
  revisarCompetenciasNoAsociadas();

  // Verificar cada 5 segundos si hay competencias no asociadas
  setInterval(revisarCompetenciasNoAsociadas, 1000);
});
