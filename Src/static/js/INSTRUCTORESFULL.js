let cedulaSeleccionada = null;
let nombreInstructor = "";
let agendaEditando = null;
let actualizandoAgenda = false;

/**
 * 1. Enlazar eventos a los botones de la tabla principal (#tec-serv)
 */
// En la función bindEventHandlers, añade el nuevo controlador de eventos
function bindEventHandlers() {
  const tbody = document.querySelector("#tec-serv tbody");
  if (!tbody) return;

  tbody.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;
    const cedula = button.getAttribute("data-cedula");
    const nombre = button.getAttribute("data-nombre") || "";
    nombreInstructor = nombre ? nombre : "";

    if (button.classList.contains("btn-detalle")) {
      abrirModalDetalle(cedula);
    } else if (button.classList.contains("btn-editar")) {
      const token = "TOKEN_GENERADO_AQUI";
      window.location.href = `/asociarCompetencias?token=${encodeURIComponent(token)}&cedula=${encodeURIComponent(cedula)}`;
    } else if (button.classList.contains("btn-calendario")) {
      abrirModalCalendario(cedula);
    } else if (button.classList.contains("btn-desvincular")) {
      showAlert2(cedula, nombre);
    } else if (button.classList.contains("btn-vincular")) {
      // Nueva funcionalidad para vincular instructor
      mostrarModalVincularInstructor(cedula, nombre);
    }
  });
}

// Nueva función para mostrar el modal de vinculación
function mostrarModalVincularInstructor(cedula, nombre) {
  // Obtener el código y nombre del centro del usuario actual
  fetch("/obtener_centro_usuario", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo obtener la información del centro",
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
      return;
    }
    
    // Mostrar el SweetAlert con la información del centro
    Swal.fire({
      title: `¿Vincular a ${nombre} a tu centro?`,
      html: `
        <p>Se vinculará al instructor al siguiente centro:</p>
        <strong>${data.nombre_centro}</strong>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Vincular",
      cancelButtonText: "Cancelar",
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
    }).then((result) => {
      if (result.isConfirmed) {
        vincularInstructor(cedula, data.codigo_centro);
      }
    });
  })
  .catch(error => {
    console.error("Error:", error);
    Swal.fire({
      title: "Error",
      text: "Ocurrió un error al procesar la solicitud",
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

// Función para vincular el instructor al centro
function vincularInstructor(cedula, codigoCentro) {
  fetch("/vincular_instructor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      cedula: cedula,
      codigo_centro: codigoCentro,
      estado: 1 // Estado activo
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      Swal.fire({
        title: "¡Éxito!",
        text: "Instructor vinculado correctamente",
        icon: "success",
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
      }).then(() => {
        // Recargar la página para ver los cambios
        location.reload();
      });
    } else {
      Swal.fire({
        title: "Error",
        text: data.error || "No se pudo vincular al instructor",
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
    }
  })
  .catch(error => {
    console.error("Error:", error);
    Swal.fire({
      title: "Error",
      text: "Ocurrió un error al vincular al instructor",
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

/**
 * 2. Modal de Detalle (Actualizar Instructor)
 */
function abrirModalDetalle(cedula) {
  document.getElementById("modalActualizacion").style.display = "flex";
  console.log(`Abrir modal de detalles para la cédula ${cedula}`);

  fetch("/actualizar_instructor", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `valor=${cedula}`,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Respuesta del servidor:", data);
      if (data.error) {
        console.error("Error:", data.error);
        return;
      }

      // Datos básicos
      document.getElementById("cedula2").value = cedula;
      document.getElementById("nombre_actualizado").value = data.nombre || "";
      document.getElementById("correo_actualizado").value = data.correo || "";
      document.getElementById("telefono_actualizado").value = data.telefono || "";

      // --- Centros ---
      const centroSelect = document.getElementById("formacion3");
      if (centroSelect) {
        centroSelect.innerHTML = '<option value="select">Seleccionar</option>';
        (data.centros || []).forEach((centro) => {
          let option = document.createElement("option");
          option.value = centro.codigo_centro;
          option.textContent = centro.nombre;
          centroSelect.appendChild(option);
        });

        // Si el backend devolvió código_centro_instructor, seleccionarlo
        if (data.codigo_centro_instructor) {
          centroSelect.value = data.codigo_centro_instructor;
        }
      }

      // --- Vínculo ---
      const vinculoSelect = document.getElementById("vinculo2");
      if (vinculoSelect) {
        vinculoSelect.innerHTML = '<option value="select">Seleccionar</option>';
        const opciones = [
          { value: 0, text: "Funcionario" },
          { value: 1, text: "Contratista" },
        ];
        opciones.forEach((opcion) => {
          let option = document.createElement("option");
          option.value = opcion.value;
          option.textContent = opcion.text;
          vinculoSelect.appendChild(option);
        });

        // si el backend devolvió vinculo, lo seleccionamos
        if (data.vinculo !== undefined && data.vinculo !== null && data.vinculo !== "") {
          vinculoSelect.value = data.vinculo;
        }
      }
    })
    .catch((error) => console.error("Error:", error));
}

// actualizarInstructor: envía solo los campos que ahora sí usamos
function actualizarInstructor() {
  const cedula = document.getElementById("cedula2").value;
  const nombre = document.getElementById("nombre_actualizado").value;
  const correo = document.getElementById("correo_actualizado").value;
  const telefono = document.getElementById("telefono_actualizado").value;
  const vinculo = document.getElementById("vinculo2").value;
  const centro = document.getElementById("formacion3").value;

  const datos = { cedula, nombre, correo, telefono, vinculo, centro };

  fetch("/datos_actualizados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        console.log("Datos actualizados con éxito");
        document.getElementById("modalActualizacion").style.display = "none";
        // opcional: refrescar la lista de instructores o actualizar la fila en la UI
      }
    })
    .catch((error) => console.error("Error al actualizar los datos:", error));
}


/**
 * 3. Modal de Competencias
 */
function abrirModalEditar(cedula) {
  document.getElementById("modalCompetencias").style.display = "flex";
  console.log(`Abrir modal de edición para la cédula ${cedula}`);

  fetch("/editar_instructor", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `valor=${cedula}`,
  })
    .then((response) => response.text())
    .then((data) => console.log("Datos del instructor para edición:", data))
    .catch((error) => console.error("Error:", error));
}

/**
 * 4. Modal de Calendario (Agenda)
 */
function abrirModalCalendario(cedula) {
  cedulaSeleccionada = cedula;
  document.getElementById("nombreInstructorAgenda").textContent = nombreInstructor;
  document.getElementById("calendario_caja").style.display = "flex";
  console.log(`Abrir modal de calendario para la cédula ${cedula}`);

  const agendaBody = document.querySelector("#agenda tbody");
  agendaBody.innerHTML = "";

  fetch("/crear_agenda", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `valor=${cedula}`,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error("Error al cargar agenda:", data.error);
        return;
      }
      const agenda = data.agenda || [];
      agenda.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.dia}</td>
          <td>${item.hora_inicio}</td>
          <td>${item.hora_fin}</td>
          <td>
            <i class="bi bi-pencil btn-editar-agenda"
               data-id_agenda="${item.id_agenda}"
               data-dia="${item.dia}"
               data-hora_inicio="${item.hora_inicio}"
               data-hora_fin="${item.hora_fin}"
               style="cursor: pointer; color: green; margin-right:8px;"></i>
            <i class="bi bi-trash btn-eliminar-agenda"
               data-id_agenda="${item.id_agenda}"
               style="cursor: pointer; color: red;"></i>
          </td>
        `;
        agendaBody.appendChild(row);
      });
    })
    .catch((error) => console.error("Error:", error));
}

/**
 * 5. Registrar nueva agenda (botón en el modal de Calendario)
 */
document.addEventListener("DOMContentLoaded", () => {
  const btnRegistrarAgenda = document.getElementById("registrarAgenda");
  if (btnRegistrarAgenda) {
    btnRegistrarAgenda.addEventListener("click", (e) => {
      e.preventDefault();
      if (!cedulaSeleccionada) {
        alert("No hay cédula seleccionada");
        return;
      }
      const dia = document.getElementById("fecha").value;
      const horaInicio = document.getElementById("horainicio").value;
      const horaFin = document.getElementById("horafin").value;

      const start = new Date(`2023-01-01T${horaInicio}`);
      const end = new Date(`2023-01-01T${horaFin}`);
      if (end <= start) {
        Swal.fire({
          title: "Horas inválidas",
          text: "La hora de fin debe ser mayor que la hora de inicio",
          icon: "warning",
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
        return;
      }

      let diaDuplicado = false;
      document.querySelectorAll("#agenda tbody tr").forEach((row) => {
        const tdDia = row.cells[0].textContent.trim();
        if (tdDia === dia) {
          diaDuplicado = true;
        }
      });
      if (diaDuplicado) {
        Swal.fire({
          title: "Día duplicado",
          text: `Ya existe una agenda para ${dia}`,
          icon: "warning",
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
        return;
      }

      fetch("/agregar_agenda_instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: cedulaSeleccionada,
          dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            alert("Error: " + data.error);
          } else {
            Swal.fire({
              title: "Agenda registrada",
              text: "Agenda registrada para: " + nombreInstructor,
              icon: "success",
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
            }).then(() => {
              abrirModalCalendario(cedulaSeleccionada);
            });
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Ocurrió un error al registrar la agenda.");
        });
    });
  }
});


// Helper reutilizable: agrega el logo SENA como marca de agua y ajusta z-index
function applySenaWatermark(popup) {
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

  // Si el swal usa icono de "success", transparentar sus fondos para que se vea la marca
  const successIcon = popup.querySelector(".swal2-icon.swal2-success");
  if (successIcon) {
    const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
    circularLines.forEach(el => { el.style.backgroundColor = "transparent"; });
    const successFix = popup.querySelector(".swal2-success-fix");
    if (successFix) successFix.style.backgroundColor = "transparent";
    const successRing = popup.querySelector(".swal2-success-ring");
    if (successRing) successRing.style.zIndex = "1";
    const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
    successLines.forEach(el => { el.style.zIndex = "2"; });
  }
}

document.getElementById("btnExtras").addEventListener("click", async () => {
  if (!cedulaSeleccionada) {
    Swal.fire({
      title: "Error",
      text: "Debe seleccionar un instructor.",
      icon: "warning",
      confirmButtonColor: "#1e7e34",
      background: "#fff",
      backdrop: "rgba(0,0,0,0.4)",
      didOpen: () => applySenaWatermark(Swal.getPopup())
    });
    return;
  }

  // 1) Traer resumen + extras
  const resp = await fetch("/info_extras_instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cedula: cedulaSeleccionada }),
  });
  const data = await resp.json();
  if (data.error) {
    Swal.fire({
      title: "Error",
      text: data.error,
      icon: "error",
      confirmButtonColor: "#1e7e34",
      background: "#fff",
      backdrop: "rgba(0,0,0,0.4)",
      didOpen: () => applySenaWatermark(Swal.getPopup())
    });
    return;
  }

  let horasDisponibles = data.horas_disponibles; // mutable para ir actualizando
  const actividadOptions = `
    <option>Permiso Sindical</option>
    <option>Apoyo Administrativo</option>
    <option>Seguimiento Etapa Productiva</option>
    <option>Investigación</option>
    <option>Formación Virtual</option>
    <option>Formación Complementaria</option>
    <option>Otros</option>
  `;

  // Tabla render inicial
  const renderFilasExtras = (extras) =>
    extras.map(x => `
      <tr data-id="${x.id_extra}">
        <td>${x.tipo}</td>
        <td style="text-align:center;">${x.cantidad_horas}</td>
        <td style="text-align:center;">
          <button class="btn-del-extra" style="border:none; background:#e74c3c; color:#fff; padding:2px 8px; border-radius:6px;">Eliminar</button>
        </td>
      </tr>
    `).join("");

  const formHTML = `
    <div style="text-align:left; margin-bottom:10px; position:relative;">
      <p><b>Nombre:</b> ${data.nombre}</p>
      <p><b>Vínculo:</b> ${data.vinculo}</p>
      <p><b>Horas disponibles:</b> <span id="lblHorasDisp">${horasDisponibles}</span></p>
    </div>

    <div style="margin:10px 0;">
      <h5 style="margin:0 0 6px;">Registros</h5>
      <div style="max-height:180px; overflow:auto; border:1px solid #eee; border-radius:8px;">
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <thead>
            <tr style="background:#f7f7f7;">
              <th style="padding:6px; text-align:left;">Actividad</th>
              <th style="padding:6px; width:100px; text-align:center;">Horas</th>
              <th style="padding:6px; width:120px; text-align:center;">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbodyExtras">
            ${renderFilasExtras(data.extras)}
          </tbody>
        </table>
      </div>
    </div>

    <hr style="margin:10px 0;"/>

    <h5 style="margin:0 0 6px;">Agregar nuevas</h5>
    <div id="extrasContainer">
      <div class="extra-item" style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
        <select class="actividad form-select">${actividadOptions}</select>
        <input type="number" min="1" class="horas form-control" placeholder="Horas" style="width:90px;">
        <button class="btnEliminarExtra" style="border:none; background:#e74c3c; color:white; padding:5px 8px; border-radius:6px;">–</button>
      </div>
    </div>
    <div style="display:flex; gap:8px; margin-top:6px;">
      <button id="btnAgregarExtra" style="background:#1e7e34; color:white; border:none; border-radius:6px; padding:6px 10px;">Agregar fila</button>
    </div>
  `;

  const { value: nuevasActividades } = await Swal.fire({
    title: "Actividades Extras",
    html: formHTML,
    confirmButtonText: "Guardar",
    confirmButtonColor: "#1e7e34",
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    width: "680px",
    focusConfirm: false,
    showCloseButton: true,
    didOpen: () => {
      const popup = Swal.getPopup();
      // Marca de agua
      applySenaWatermark(popup);

      const tbody = popup.querySelector("#tbodyExtras");
      const lblHoras = popup.querySelector("#lblHorasDisp");

      // Delegación: agregar/eliminar filas del formulario
      popup.addEventListener("click", async (e) => {
        // Agregar fila nueva
        if (e.target.id === "btnAgregarExtra") {
          e.preventDefault();
          const div = document.createElement("div");
          div.className = "extra-item";
          div.style.cssText = "display:flex; gap:8px; align-items:center; margin-bottom:6px;";
          div.innerHTML = `
            <select class="actividad form-select">${actividadOptions}</select>
            <input type="number" min="1" class="horas form-control" placeholder="Horas" style="width:90px;">
            <button class="btnEliminarExtra" style="border:none; background:#e74c3c; color:white; padding:5px 8px; border-radius:6px;">–</button>
          `;
          popup.querySelector("#extrasContainer").appendChild(div);
        }

        // Eliminar fila (del formulario)
        if (e.target.classList.contains("btnEliminarExtra")) {
          e.preventDefault();
          e.target.closest(".extra-item").remove();
        }

        // Eliminar registro existente (de la tabla)
        if (e.target.classList.contains("btn-del-extra")) {
          e.preventDefault();
          const tr = e.target.closest("tr");
          const id_extra = tr.getAttribute("data-id");
          // confirmar
          const ok = await Swal.fire({
            title: "¿Eliminar este extra?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#1e7e34",
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)",
            didOpen: () => applySenaWatermark(Swal.getPopup())
          });
          if (!ok.isConfirmed) return;

          // llamar API
          const del = await fetch("/eliminar_extra_instructor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_extra })
          });
          const r = await del.json();
          if (r && r.success) {
            // ajustar UI: remover fila y devolver horas
            const horas = parseInt(tr.children[1].textContent) || 0;
            horasDisponibles += horas;
            lblHoras.textContent = horasDisponibles;
            tr.remove();
            // feedback sutil
            const Toast = Swal.mixin({ toast:true, position:"top-end", timer:1500, showConfirmButton:false });
            Toast.fire({ icon:"success", title:"Extra eliminado" });
          } else {
            Swal.fire({
              title: "Error",
              text: (r && r.error) || "No se pudo eliminar.",
              icon: "error",
              confirmButtonColor: "#1e7e34",
              background: "#fff",
              backdrop: "rgba(0,0,0,0.4)",
              didOpen: () => applySenaWatermark(Swal.getPopup())
            });
          }
        }
      });

      // Evitar que superen las horas disponibles al guardar
      popup.addEventListener("input", (e) => {
        if (e.target.classList.contains("horas")) {
          const v = e.target.valueAsNumber;
          if (v < 1) e.target.value = "";
        }
      });
    },
    preConfirm: () => {
      // Recolectar filas del formulario y validar horas <= disponibles
      const items = [...document.querySelectorAll("#extrasContainer .extra-item")];
      const actividades = [];
      let totalNuevas = 0;

      items.forEach(div => {
        const tipo = div.querySelector(".actividad").value;
        const horas = parseInt(div.querySelector(".horas").value);
        if (tipo && horas && horas > 0) {
          actividades.push({ tipo, cantidad_horas: horas });
          totalNuevas += horas;
        }
      });

      if (actividades.length === 0) {
        Swal.showValidationMessage("Debes agregar al menos una actividad con horas.");
        return false;
      }
      if (totalNuevas > horasDisponibles) {
        Swal.showValidationMessage(`Te excediste: intentas asignar ${totalNuevas}h y solo hay ${horasDisponibles}h disponibles.`);
        return false;
      }
      return actividades;
    }
  });

  // 3) Guardar nuevas actividades (si confirmaron)
  if (nuevasActividades) {
    const res = await fetch("/agregar_extras_instructor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cedula: cedulaSeleccionada,
        actividades: nuevasActividades
      }),
    });
    const out = await res.json();
    if (out.error) {
      Swal.fire({
        title: "Error",
        text: out.error,
        icon: "error",
        confirmButtonColor: "#1e7e34",
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => applySenaWatermark(Swal.getPopup())
      });
    } else {
      Swal.fire({
        title: "Guardado",
        text: "Actividades registradas correctamente.",
        icon: "success",
        confirmButtonColor: "#1e7e34",
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => applySenaWatermark(Swal.getPopup())
      });
    }
  }
});



/**
 * 6. Editar y Eliminar Agenda
 */
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("btn-editar-agenda")) {
    const idAgenda = event.target.getAttribute("data-id_agenda");
    const dia = event.target.getAttribute("data-dia");
    const horaInicio = event.target.getAttribute("data-hora_inicio");
    const horaFin = event.target.getAttribute("data-hora_fin");
    abrirModalEditarAgenda(idAgenda, dia, horaInicio, horaFin);
  }
  if (event.target.classList.contains("btn-eliminar-agenda")) {
    const idAgenda = event.target.getAttribute("data-id_agenda");
    eliminarAgenda(idAgenda);
  }
});

function abrirModalEditarAgenda(idAgenda, dia, horaInicio, horaFin) {
  document.getElementById("modalEditarAgenda").style.display = "flex";
  document.getElementById("editDia").value = dia;
  document.getElementById("editHoraInicio").value = horaInicio;
  document.getElementById("editHoraFin").value = horaFin;
  agendaEditando = { idAgenda };
}

const btnGuardarAgenda = document.getElementById("btnGuardarAgenda");
if (btnGuardarAgenda) {
  btnGuardarAgenda.addEventListener("click", (e) => {
    e.preventDefault();
    if (!agendaEditando) {
      alert("No hay registro seleccionado para editar.");
      return;
    }
    if (actualizandoAgenda) return;
    actualizandoAgenda = true;
    const { idAgenda } = agendaEditando;
    const nuevoDia = document.getElementById("editDia").value;
    const nuevaHoraInicio = document.getElementById("editHoraInicio").value;
    const nuevaHoraFin = document.getElementById("editHoraFin").value;

    const start = new Date(`2023-01-01T${nuevaHoraInicio}`);
    const end = new Date(`2023-01-01T${nuevaHoraFin}`);
    if (end <= start) {
      Swal.fire({
        title: "Horas inválidas",
        text: "La hora de fin debe ser mayor que la hora de inicio",
        icon: "warning",
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
      actualizandoAgenda = false;
      return;
    }

    fetch("/actualizar_agenda_instructor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_agenda: idAgenda,
        dia: nuevoDia,
        hora_inicio: nuevaHoraInicio,
        hora_fin: nuevaHoraFin,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          Swal.fire({
            title: "Error al actualizar",
            text: data.error,
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
        } else {
          Swal.fire({
            title: "¡Agenda actualizada con éxito!",
            icon: "success",
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
          }).then(() => {
            document.getElementById("modalEditarAgenda").style.display = "none";
            abrirModalCalendario(cedulaSeleccionada);
          });
        }
      })
      .catch((err) => {
        console.error(err);
        Swal.fire({
          title: "Error",
          text: "Ocurrió un error al actualizar.",
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
      })
      .finally(() => {
        actualizandoAgenda = false;
      });
  });
}

function eliminarAgenda(idAgenda) {
  Swal.fire({
    title: "¿Eliminar este registro?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
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
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/eliminar_agenda_instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_agenda: idAgenda }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            Swal.fire({
              title: "Error al eliminar",
              text: data.error,
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
          } else {
            Swal.fire({
              title: "Eliminado",
              text: "Se ha eliminado la agenda",
              icon: "success",
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
            abrirModalCalendario(cedulaSeleccionada);
          }
        })
        .catch((err) => {
          console.error(err);
          Swal.fire({
            title: "Error",
            text: "Ocurrió un error al eliminar.",
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
  });
}

/**
 * 7. Confirmar Desvinculación (de instructor)
 */
function showAlert2(cedula, nombre) {
  Swal.fire({
    title: `¿Está seguro de desvincular a ${nombre}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Desvincular",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1e7e34",
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    didOpen: () => {
      aplicarLogoSwal();
    }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: `Procesando desvinculación...`,
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => {
          aplicarLogoSwal();
        }
      });
      desvincularInstructor(cedula, nombre);
    }
  });
}
// Función para desvincular instructor
function desvincularInstructor(cedula, nombre) {
  fetch("/eliminar_instructor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cedula: cedula }) 
  })
    .then(response => response.json())
    .then(data => {
      if (data.tiene_fichas_activas) {
        // 🔹 Mostrar modal con fichas activas
        mostrarModalReasignacion(cedula, nombre, data.fichas, data.instructores_disponibles);
      } else if (data.success) {
        Swal.fire({
          title: "Éxito",
          text: "Instructor desvinculado del centro correctamente",
          icon: "success",
          background: "#fff",
          backdrop: "rgba(0,0,0,0.4)",
          didOpen: () => {
            aplicarLogoSwal();
          }
        }).then(() => {
          location.reload();
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.error,
          icon: "error",
          confirmButtonColor: "#1e7e34",
          background: "#fff",
          backdrop: "rgba(0,0,0,0.4)",
          didOpen: () => {
            aplicarLogoSwal();
          }
        });
      }
    })
    .catch(error => {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo procesar la solicitud",
        icon: "error",
        confirmButtonColor: "#1e7e34",
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => {
          aplicarLogoSwal();
        }
      });
    });
}

function mostrarModalReasignacion(cedula, nombreInstructor, fichas, instructoresDisponibles) {
  // 🔹 Crear opciones de instructores para los selects
  let optionsInstructores = '<option value="">Seleccione instructor...</option>';
  instructoresDisponibles.forEach(inst => {
    optionsInstructores += `<option value="${inst.cedula}">${inst.nombre}</option>`;
  });
  
  // 🔹 Crear tabla de fichas
  let tablaFichas = `
    <div style="text-align: left; max-height: 400px; overflow-y: auto;">
      <h4 style="text-align: center; margin-bottom: 20px;">Instructor: ${nombreInstructor}</h4>
      <p style="text-align: center; color: #d9534f; font-weight: bold;">
        Este instructor tiene fichas activas. Debe reasignar las fichas antes de desvincularlo.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #39a900; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">N° Ficha</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Programa</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Fecha Fin Lectiva</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Trimestres Totales</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Trimestre Actual</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Nuevo Instructor</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  fichas.forEach((ficha, index) => {
    tablaFichas += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${ficha.numero_ficha}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${ficha.programa}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${ficha.fecha_fin_lectiva}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${ficha.cant_trimestres}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${ficha.trimestre_actual}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <select class="instructor-select" data-ficha="${ficha.numero_ficha}" style="width: 100%; padding: 5px;">
            ${optionsInstructores}
          </select>
        </td>
      </tr>
    `;
  });
  
  tablaFichas += `
        </tbody>
      </table>
    </div>
  `;
  
  Swal.fire({
    title: "Reasignar Fichas",
    html: tablaFichas,
    width: '90%',
    showCancelButton: true,
    confirmButtonText: "Asignar y Desvincular",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1e7e34",
    cancelButtonColor: "#d33",
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    preConfirm: () => {
      const selects = document.querySelectorAll('.instructor-select');
      const asignaciones = [];
      let todoAsignado = true;
      
      selects.forEach(select => {
        const numeroFicha = select.getAttribute('data-ficha');
        const nuevoInstructor = select.value;
        
        if (!nuevoInstructor) {
          todoAsignado = false;
          select.style.border = "2px solid red";
        } else {
          select.style.border = "";
          asignaciones.push({
            numero_ficha: numeroFicha,
            nuevo_instructor: nuevoInstructor
          });
        }
      });
      
      if (!todoAsignado) {
        Swal.showValidationMessage('Debe asignar un instructor a todas las fichas');
        return false;
      }
      
      return asignaciones;
    },
    didOpen: () => {
      aplicarLogoSwal();
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      // 🔹 Enviar reasignaciones al servidor
      reasignarFichas(cedula, result.value);
    }
  });
}

function reasignarFichas(cedulaInstructor, asignaciones) {
  Swal.fire({
    title: "Procesando reasignación...",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    didOpen: () => {
      aplicarLogoSwal();
      Swal.showLoading();
    }
  });
  
  fetch("/reasignar_fichas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      cedula_instructor: cedulaInstructor,
      asignaciones: asignaciones
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        Swal.fire({
          title: "Éxito",
          text: "Fichas reasignadas e instructor desvinculado correctamente",
          icon: "success",
          background: "#fff",
          backdrop: "rgba(0,0,0,0.4)",
          didOpen: () => {
            aplicarLogoSwal();
          }
        }).then(() => {
          location.reload();
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.error,
          icon: "error",
          confirmButtonColor: "#1e7e34",
          background: "#fff",
          backdrop: "rgba(0,0,0,0.4)",
          didOpen: () => {
            aplicarLogoSwal();
          }
        });
      }
    })
    .catch(error => {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo procesar la reasignación",
        icon: "error",
        confirmButtonColor: "#1e7e34",
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: () => {
          aplicarLogoSwal();
        }
      });
    });
}

// 🔹 Función auxiliar para aplicar el logo a los modales de SweetAlert
function aplicarLogoSwal() {
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
    const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
    circularLines.forEach(el => {
      el.style.backgroundColor = "transparent";
    });
    
    const successFix = popup.querySelector(".swal2-success-fix");
    if (successFix) {
      successFix.style.backgroundColor = "transparent";
    }
    
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

// 🔹 Event listener para el botón de desvincular
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.btn-desvincular').forEach(btn => {
    btn.addEventListener('click', function() {
      const cedula = this.getAttribute('data-cedula');
      const nombre = this.getAttribute('data-nombre');
      showAlert2(cedula, nombre);
    });
  });
});


/**
 * 8. Inicialización de DataTables y Select2
 */
document.addEventListener("DOMContentLoaded", () => {
  new DataTable("#Mytables", {
    layout: {
      topEnd: { pageLength: { menu: [8, 5] } },
      topStart: { search: { placeholder: "Filtro General" } },
    },
    pageLength: 8,
    language: {
      search: "Buscar:",
      lengthMenu: " _MENU_ Competencias por Página",
      info: "Mostrando Competencias de _START_ al _END_ de un total de _TOTAL_ Competencias",
      infoFiltered: "(filtrado de _MAX_ registros)",
      zeroRecords: "No se encontraron resultados",
      emptyTable: "No hay datos disponibles",
      entries: { _: "Competencia", 1: "Competencia" },
    },
  });

  if (window.jQuery && jQuery.fn && jQuery.fn.dataTable) {
    // evita la ventana modal y evita que haga alertas
    $.fn.dataTable.ext.errMode = 'none';

    // opcional: registrar errores en consola en lugar de modal
    $('#tec-serv').on('error.dt', function(e, settings, techNote, message) {
      console.warn('DataTables warning (suprimida):', message);
    });
  }

  new DataTable("#tec-serv", {
    layout: {
      topEnd: { pageLength: { menu: [5, 10, 15] } },
      topStart: { search: { placeholder: "Filtro General" } },
    },
    language: {
      search: "Buscar:",
      lengthMenu: " _MENU_ Registros",
      info: "Mostrando registros del _START_ al _END_ de _TOTAL_",
      infoFiltered: "(filtrado de _MAX_ registros)",
      zeroRecords: "No se encontraron resultados",
      emptyTable: "No hay datos disponibles",
      entries: { _: "persona", 1: "persona" },
    },
    scrollY: "calc(90vh - 265px)",
  });

  new DataTable("#agenda", {
    paging: false,
    searching: false,
    info: false,
    language: {
      zeroRecords: "No hay registros",
      emptyTable: "No hay datos disponibles",
    },
  });

  $("#titulosCarreras").select2({
    placeholder: "Selecciona un título o carrera",
    allowClear: true,
  });

  $("#asociar").select2({
    placeholder: "Escribe para buscar...",
    allowClear: true,
  });

  const botonNuevo = document.getElementById("boton_nuevo");
  const modalNuevo = document.getElementById("caja_nuevo");
  const close3 = document.getElementById("close3");

  if (botonNuevo && modalNuevo) {
    botonNuevo.addEventListener("click", () => {
      modalNuevo.style.display = "block";
    });
  }

  if (close3 && modalNuevo) {
    close3.addEventListener("click", () => {
      modalNuevo.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === modalNuevo) {
        modalNuevo.style.display = "none";
      }
    });
  }

  const previewContainer = document.getElementById("previewContainer");
  if (previewContainer) {
    previewContainer.addEventListener("click", function (e) {
      const btn = e.target.closest(".delete-row");
      if (btn) {
        const row = btn.closest("tr");
        if (row) {
          row.remove();
        }
      }
    });
  }

  // Lógica para carga masiva
  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("file");
  const fileLabel = document.getElementById("file-label");
  const modalMasivo = document.getElementById("masivo");
  const closeMasivo = document.getElementById("closeMasivo");
  const botonMasivo = document.getElementById("boton_masivo");

  if (botonMasivo && modalMasivo) {
    botonMasivo.addEventListener("click", () => {
      modalMasivo.style.display = "flex";
    });
  }

  if (closeMasivo && modalMasivo) {
    closeMasivo.addEventListener("click", () => {
      modalMasivo.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === modalMasivo) {
        modalMasivo.style.display = "none";
      }
    });
  }

  if (fileInput && fileLabel) {
    fileInput.addEventListener("change", () => {
      fileLabel.textContent = fileInput.files.length > 0 
        ? fileInput.files[0].name 
        : "Ningún Archivo Seleccionado";
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const file = fileInput.files[0];
      if (!file) {
        alert("Por favor, selecciona un archivo.");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("/upload-excel", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (response.ok) {
          if (result.html && previewContainer) {
            modalMasivo.style.display = "none";
            previewContainer.innerHTML = result.html;
            previewContainer.style.display = "block";
          } else {
            alert("Archivo enviado correctamente");
          }
        } else {
          alert("Error en la carga: " + 
            (result.error || (result.errores && result.errores.join(", "))));
        }
      } catch (error) {
        console.error("Error al enviar el archivo:", error);
        alert("Ocurrió un error al subir el archivo.");
      }
    });
  }

  const formInputs = document.querySelectorAll("#registro-form2 input, #registro-form2 select");
  const actionButton = document.getElementById("action-btn");
  if (formInputs.length && actionButton) {
    formInputs.forEach((input) => (input.disabled = true));
    actionButton.addEventListener("click", () => {
      const areAllDisabled = Array.from(formInputs).every((input) => input.disabled);
      if (areAllDisabled) {
        formInputs.forEach((input) => (input.disabled = false));
        actionButton.textContent = "Guardar";
      } else {
        formInputs.forEach((input) => (input.disabled = true));
        actionButton.textContent = "Actualizar";
      }
    });
  }
  bindEventHandlers();
});

/**
 * 9. Cerrar modales
 */
document.querySelector("#close5").addEventListener("click", () => {
  document.getElementById("calendario_caja").style.display = "none";
});
document.querySelector(".close-2").addEventListener("click", () => {
  document.getElementById("modalActualizacion").style.display = "none";
});
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("modalCompetencias").style.display = "none";
});
const closeEditarAgenda = document.getElementById("closeEditarAgenda");
if (closeEditarAgenda) {
  closeEditarAgenda.addEventListener("click", () => {
    document.getElementById("modalEditarAgenda").style.display = "none";
  });
}

/**
 * 10. Función para registro exitoso
 */
function showAlert() {
  Swal.fire({
    title: "Registro Exitoso",
    text: "El instructor se ha registrado correctamente.",
    icon: "success",
    confirmButtonText: "Ok",
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
}

/**
 * 11. Registro de Nuevo Instructor
 * Se ejecuta al enviar el formulario "registro-form".
 */
function registrarNuevoInstructor(event) {
  event.preventDefault();
  const formElement = document.getElementById("registro-form");
  const formData = new FormData(formElement);

  // IMPORTANTE: Ajustar el nombre del campo del centro para que coincida con el endpoint.
  // Cambiamos "centro_nuevo" por "centros" para que el servidor reciba el dato.
  if (formData.has("centro_nuevo")) {
    const centroValue = formData.get("centro_nuevo");
    formData.delete("centro_nuevo");
    formData.append("centros", centroValue);
  }

  // Validación básica
  if (!formData.get("cedula") || !formData.get("nombre") || !formData.get("correo")) {
    Swal.fire({
      title: "Campos requeridos",
      text: "Por favor complete todos los campos obligatorios",
      icon: "warning",
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
    return;
  }

  fetch('/registrar', {
    method: 'POST',
    body: formData,
    redirect: 'follow'
  })
  .then(response => {
    if (response.redirected) {
      window.location.href = response.url;
    } else {
      return response.text();
    }
  })
  .catch(error => {
    console.error("Error:", error);
    Swal.fire({
      title: "Error",
      text: "Ocurrió un error al registrar el instructor",
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


/**
 * 12. Toggle de edición de formulario
 */
function setupFormToggle() {
  const formInputs = document.querySelectorAll("#registro-form2 input, #registro-form2 select");
  const actionButton = document.getElementById("action-btn");
  const cancelButton = document.getElementById("cancel-btn");

  if (!formInputs.length || !actionButton) return;
  formInputs.forEach(input => input.disabled = true);
  actionButton.textContent = "Editar";
  actionButton.addEventListener("click", () => {
    const isDisabled = formInputs[0].disabled;
    formInputs.forEach(input => input.disabled = !isDisabled);
    actionButton.textContent = isDisabled ? "Guardar" : "Editar";
    actionButton.className = isDisabled ? "btn btn-success" : "btn btn-primary";
    if (isDisabled) {
      formInputs[0].focus();
    } else {
      actualizarInstructor();
    }
  });
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      formInputs.forEach(input => input.disabled = true);
      actionButton.textContent = "Editar";
      actionButton.className = "btn btn-primary";
    });
  }
}

/**
 * 13. Inicialización de tooltips
 */
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
      trigger: 'hover'
    });
  });
}

/**
 * 14. Exportar datos
 */
function setupExportButtons() {
  document.getElementById('export-excel')?.addEventListener('click', () => {
    console.log("Exportando a Excel...");
  });
  document.getElementById('export-pdf')?.addEventListener('click', () => {
    console.log("Exportando a PDF...");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupFormToggle();
  initTooltips();
  setupExportButtons();
  const formNuevoInstructor = document.getElementById("registro-form");
  if (formNuevoInstructor) {
    formNuevoInstructor.addEventListener("submit", registrarNuevoInstructor);
  }
}); 



// Función para abrir el modal de perfiles
function abrirModalPerfiles(cedula, nombre) {
    // Obtener información del instructor y sus perfiles
    fetch(`/obtener_perfiles_instructor/${cedula}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarSweetAlertPerfiles(data.instructor, data.perfil_principal, data.subperfiles, data.perfiles_disponibles);
            } else {
                Swal.fire({
                    title: 'Error',
                    text: data.message || 'Error al obtener los perfiles',
                    icon: 'error',
                    confirmButtonColor: "#1e7e34",
                    background: "#fff",
                    backdrop: "rgba(0,0,0,0.4)",
                    didOpen: insertarLogoSweetAlert
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error de conexión',
                icon: 'error',
                confirmButtonColor: "#1e7e34",
                background: "#fff",
                backdrop: "rgba(0,0,0,0.4)",
                didOpen: insertarLogoSweetAlert
            });
        });
}

// Función para mostrar el Sweet Alert con la gestión de perfiles
function mostrarSweetAlertPerfiles(instructor, perfilPrincipal, subperfiles, perfilesDisponibles) {
    const subperfilesHTML = subperfiles.map(sub => 
        `<div class="subperfil-item" data-id="${sub.id}">
            <span>${sub.nombre}</span>
            <button type="button" class="btn-remove-subperfil" onclick="eliminarSubperfil(${sub.id}, ${instructor.cedula})">
                <i class="bi bi-trash"></i>
            </button>
        </div>`
    ).join('');

    const opcionesPerfiles = perfilesDisponibles.map(perfil => 
        `<option value="${perfil.id}">${perfil.nombre}</option>`
    ).join('');

    Swal.fire({
        title: `Perfiles - ${instructor.nombre}`,
        html: `
            <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                

                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">
                        <i class="bi bi-layers"></i> Perfiles Asociados
                    </h4>
                    <div id="subperfiles-container" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9;">
                        ${subperfiles.length > 0 ? subperfilesHTML : '<p style="color: #666; font-style: italic;">No hay perfiles asociados</p>'}
                    </div>
                </div>

                <div>
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">
                        <i class="bi bi-plus-circle"></i> Agregar Perfil
                    </h4>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <select id="nuevo-subperfil" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Seleccionar perfil...</option>
                            ${opcionesPerfiles}
                        </select>
                        <button type="button" id="btn-agregar-subperfil" onclick="agregarSubperfil(${instructor.cedula})" 
                                style="padding: 8px 15px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="bi bi-plus"></i> Agregar
                        </button>
                    </div>
                </div>
            </div>

            <style>
                .subperfil-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    margin-bottom: 5px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                }
                .btn-remove-subperfil {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .btn-remove-subperfil:hover {
                    background: #c0392b;
                }
                #btn-agregar-subperfil:hover {
                    background: #229954;
                }
            </style>
        `,
        width: 600,
        showCloseButton: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        confirmButtonColor: "#1e7e34",
        didOpen: insertarLogoSweetAlert,
        customClass: {
            container: 'perfiles-modal-container'
        }
    });
}

// Función para agregar subperfil
function agregarSubperfil(cedula) {
    const selectSubperfil = document.getElementById('nuevo-subperfil');
    const idPerfil = selectSubperfil.value;
    
    if (!idPerfil) {
        Swal.fire({
            title: 'Aviso',
            text: 'Por favor selecciona un perfil',
            icon: 'warning',
            confirmButtonColor: "#1e7e34",
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)",
            didOpen: insertarLogoSweetAlert
        });
        return;
    }

    fetch('/agregar_subperfil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            cedula: cedula,
            id_perfil: idPerfil
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: 'Éxito',
                text: 'Subperfil agregado correctamente',
                icon: 'success',
                confirmButtonColor: "#1e7e34",
                background: "#fff",
                backdrop: "rgba(0,0,0,0.4)",
                didOpen: insertarLogoSweetAlert
            }).then(() => {
                abrirModalPerfiles(cedula);
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.message || 'Error al agregar subperfil',
                icon: 'error',
                confirmButtonColor: "#1e7e34",
                background: "#fff",
                backdrop: "rgba(0,0,0,0.4)",
                didOpen: insertarLogoSweetAlert
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error de conexión',
            icon: 'error',
            confirmButtonColor: "#1e7e34",
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)",
            didOpen: insertarLogoSweetAlert
        });
    });
}

// Función para eliminar subperfil
function eliminarSubperfil(idSubperfil, cedula) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se eliminará este subperfil del instructor',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: insertarLogoSweetAlert
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/eliminar_subperfil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_subperfil: idSubperfil
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'Subperfil eliminado correctamente',
                        icon: 'success',
                        confirmButtonColor: "#1e7e34",
                        background: "#fff",
                        backdrop: "rgba(0,0,0,0.4)",
                        didOpen: insertarLogoSweetAlert
                    }).then(() => {
                        abrirModalPerfiles(cedula);
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: data.message || 'Error al eliminar subperfil',
                        icon: 'error',
                        confirmButtonColor: "#1e7e34",
                        background: "#fff",
                        backdrop: "rgba(0,0,0,0.4)",
                        didOpen: insertarLogoSweetAlert
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error de conexión',
                    icon: 'error',
                    confirmButtonColor: "#1e7e34",
                    background: "#fff",
                    backdrop: "rgba(0,0,0,0.4)",
                    didOpen: insertarLogoSweetAlert
                });
            });
        }
    });
}

// Event listener para el botón de perfiles
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-perfiles')) {
            const button = e.target.closest('.btn-perfiles');
            const cedula = button.getAttribute('data-cedula');
            const nombre = button.getAttribute('data-nombre');
            abrirModalPerfiles(cedula, nombre);
        }
    });
});

// Función que inserta el logo al SweetAlert
function insertarLogoSweetAlert() {
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
        const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
        circularLines.forEach(el => el.style.backgroundColor = "transparent");

        const successFix = popup.querySelector(".swal2-success-fix");
        if (successFix) {
            successFix.style.backgroundColor = "transparent";
        }

        const successRing = popup.querySelector(".swal2-success-ring");
        if (successRing) {
            successRing.style.zIndex = "1";
        }

        const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
        successLines.forEach(el => el.style.zIndex = "2");
    }
}
