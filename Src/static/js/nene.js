// ====================== FUNCION PARA CREAR BOTÓN DE ELIMINAR ======================
function crearBotonEliminar(idRap) {
  const boton = document.createElement("button");
  boton.className = "btn-eliminar-rap";
  boton.innerHTML = "X";
  boton.style.backgroundColor = "red";
  boton.style.color = "white";
  boton.style.border = "none";
  boton.style.borderRadius = "50%";
  boton.style.width = "25px";
  boton.style.height = "25px";
  boton.style.fontSize = "12px";
  boton.style.cursor = "pointer";
  boton.style.display = "flex";
  boton.style.justifyContent = "center";
  boton.style.alignItems = "center";
  boton.style.margin = "0 auto";
  boton.dataset.idRap = idRap;
  return boton;
}

// ====================== VARIABLES GLOBALES Y DE CONTROL ======================
let horasTotales = 0;
let totalTrimestresF = 0; // Número de trimestres que tiene la ficha (según cant_trimestres)
let trimestresCompletados = {}; // Se utilizarán los índices del 1 a totalTrimestresF
const horasPorTrimestre = {}; // Se llenarán para índices del 1 a 7 (pero usaremos solo hasta totalTrimestresF)
const datosPorTrimestre = {};

for (let i = 1; i <= 7; i++) {
  trimestresCompletados[i] = false;
  horasPorTrimestre[i] = 0;
  datosPorTrimestre[i] = [];
}

let asignadosCompetencia = {}; // RAPs ya asignados por competencia (se guardarán como cadenas)
let trimestreSeleccionado = null;
let numeroFicha;
let table;
let mallaEstadoActualizado = false; // Para evitar actualizar varias veces la malla

// ====================== CONFIGURACIÓN DE BOTONES DE TRIMESTRES ======================
const paginacion = document.getElementById("paginacion");
const tituloTrimestre = document.getElementById("titulo-trimestre");
if (tituloTrimestre && paginacion && paginacion.parentNode) {
  paginacion.parentNode.insertBefore(tituloTrimestre, paginacion);
}

function actualizarSumaHorasTrimestre(trimestre) {
  const total = horasPorTrimestre[trimestre];
  document.querySelector(".tituloTablas span").textContent = total;
}

function actualizarProgresoTrimestre(trimestre) {
  const porcentaje = Math.min(
    Math.floor((horasPorTrimestre[trimestre] / horasTotales) * 100),
    100
  );
  const btn = document.querySelector(
    `.trimestre-btn[data-trimester="${trimestre}"]`
  );
  if (btn) {
    btn.style.background = `linear-gradient(to right, #4caf50 ${porcentaje}%, #FFFFFF ${porcentaje}%)`;
  }
  actualizarEstadoGlobal();
  return porcentaje;
}

function actualizarEstadoGlobal() {
  const estadoSpan = document.getElementById("estadoGlobal");
  let completados = 0;
  for (let i = 1; i <= totalTrimestresF; i++) {
    const porcentaje = Math.floor((horasPorTrimestre[i] / horasTotales) * 100);
    if (porcentaje >= 100) {
      completados++;
    }
  }

  if (completados === totalTrimestresF) {
    // ------------------------------------------------------------------------
    // Ya todos los trimestres están al 100%: malla pasa a “Terminado” (estado = 1)
    estadoSpan.textContent = "Terminado";
    estadoSpan.style.color = "green";

    // Solo si antes no estaba marcado como “Terminado” lo enviamos al backend
    if (!mallaEstadoActualizado) {
      fetch("/actualizar_estado_malla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ NumeroFicha: numeroFicha, estado: 1 }),
      })
        .then((resp) => resp.json())
        .then((updateResp) => {
          if (updateResp.success) {
            console.log("Malla actualizada a estado 1");
          } else {
            console.error("Error actualizando malla:", updateResp.message);
          }
        })
        .catch((error) => {
          console.error("Error al actualizar estado de malla", error);
        });
      mallaEstadoActualizado = true;
    }
    // ------------------------------------------------------------------------
  } else {
    // ------------------------------------------------------------------------
    // Al menos un trimestre quedó < 100%, así que malla está “En proceso”
    estadoSpan.textContent = "En proceso";
    estadoSpan.style.color = "orange";

    // Si antes la marcamos como “Terminado” (estado 1), ahora debe volver a estado 0
    if (mallaEstadoActualizado) {
      fetch("/actualizar_estado_malla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ NumeroFicha: numeroFicha, estado: 0 }),
      })
        .then((resp) => resp.json())
        .then((updateResp) => {
          if (updateResp.success) {
            console.log("Malla revertida a estado 0");
          } else {
            console.error("Error revirtiendo malla:", updateResp.message);
          }
        })
        .catch((error) => {
          console.error("Error al revertir estado de malla", error);
        });
      mallaEstadoActualizado = false;
    }
    // ------------------------------------------------------------------------
  }
}


function generarBotonesTrimestres(cantidad, estadoMalla) {
  totalTrimestresF = cantidad;
  paginacion.innerHTML = "";

  // Contenedor principal con Flexbox: separa el área de botones y el área del estado.
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "space-between";
  container.style.width = "100%";
  container.style.marginRight = "20px";

  // Contenedor para los botones centrados
  const btnContainer = document.createElement("div");
  btnContainer.id = "btn-trimestres";
  btnContainer.style.display = "flex";
  btnContainer.style.justifyContent = "center";
  btnContainer.style.flexGrow = "1";
  btnContainer.style.marginLeft = "170px";
  container.appendChild(btnContainer);

  // Contenedor para el estado, fijo a la derecha
  const rightContainer = document.createElement("div");
  rightContainer.style.display = "flex";
  rightContainer.style.justifyContent = "flex-end";
  rightContainer.style.width = "150px";
  rightContainer.style.marginLeft = "10px";
  const estadoGlobal = document.createElement("span");
  estadoGlobal.id = "estadoGlobal";
  estadoGlobal.style.fontWeight = "bold";
  estadoGlobal.textContent = "En proceso";
  rightContainer.appendChild(estadoGlobal);

  container.appendChild(rightContainer);
  paginacion.appendChild(container);

  // Genera los botones de trimestre
  for (let i = 1; i <= cantidad; i++) {
    const btn = document.createElement("button");
    btn.classList.add("trimestre-btn");
    btn.setAttribute("data-trimester", i);
    btn.innerHTML = `Trimestre ${i} <span class="tooltip"></span>`;
    if (i > 1) {
      btn.classList.add("trimestre-bloqueado");
      btn.disabled = true;
    }
    btn.addEventListener("click", function () {
      if (!btn.disabled) {
        document.getElementById(
          "titulo-trimestre"
        ).innerText = `Trimestre ${i}`;
        trimestreSeleccionado = i;
        actualizarTablaPorTrimestre(i);
        btnContainer
          .querySelectorAll(".trimestre-btn")
          .forEach((b) => b.classList.remove("trimestre-activo"));
        btn.classList.add("trimestre-activo");
      }
    });
    btnContainer.appendChild(btn);
  }

  const style = document.createElement("style");
  style.textContent = `.trimestre-bloqueado { opacity: 0.5; cursor: not-allowed; }`;
  document.head.appendChild(style);
}

function actualizarEstadoBotonesTrimestre() {
  const btns = document.querySelectorAll(".trimestre-btn");
  btns.forEach((btn, index) => {
    const num = index + 1;
    if (num === 1) {
      btn.disabled = false;
      btn.classList.remove("trimestre-bloqueado");
    } else {
      const anterior = num - 1;
      if (trimestresCompletados[anterior]) {
        btn.disabled = false;
        btn.classList.remove("trimestre-bloqueado");
      } else {
        btn.disabled = true;
        btn.classList.add("trimestre-bloqueado");
      }
    }
  });
  actualizarEstadoGlobal();
}

// ====================== INICIALIZAR INTERFAZ ======================
function initInterface(data) {
  document.getElementById("paginacion").style.display = "flex";
  document.getElementById("form-container").style.display = "block";

  // en el primer <span> pegamos ficha y nombre unidos por “_”
  document.querySelectorAll(".label span")[0].textContent = `${numeroFicha}_${data.nombre}`;
  // dejamos vacío el segundo <span>
  document.querySelectorAll(".label span")[1].textContent = "";

  window.rapsData = data.raps;

  const compContainer = $("#competencia").parent();
  const rapContainer = $("#rap").parent();
  $("#competencia").select2("destroy");
  $("#rap").select2("destroy");
  $("#competencia").remove();
  $("#rap").remove();

  const newComp = $(
    '<select id="competencia" class="js-example-basic-single" name="competencia"></select>'
  );
  const newRap = $(
    '<select id="rap" class="js-example-basic-single" name="rap" multiple="multiple" size="10"></select>'
  );

  compContainer.append(newComp);
  rapContainer.append(newRap);

  newComp.append('<option value="">Seleccione una competencia</option>');
  data.competencias.forEach((comp) => {
    newComp.append(`<option value="${comp.id}">${comp.nombre}</option>`);
  });
  newRap.append('<option value="">Seleccione una competencia primero</option>');

  $("#competencia").select2({
    width: "100%",
    placeholder: "Seleccione una competencia",
    allowClear: true,
  });
  $("#rap").select2({
    width: "100%",
    placeholder: "Seleccione RAPs",
    allowClear: true,
  });

  $("#competencia").on("change", function () {
    const id = $(this).val();
    if (id) {
      cargarRaps(id);
    } else {
      $("#rap")
        .empty()
        .append('<option value="">Seleccione una competencia primero</option>');
      $("#rap").val(null).trigger("change");
    }
  });

  generarBotonesTrimestres(data.cant_trimestres, data.estado);

  trimestreSeleccionado = 1;
  document.querySelector(`.trimestre-btn[data-trimester="1"]`).click();

  if (data.distribuciones) {
    data.distribuciones.forEach((dist) => {
      let row = [dist.competencia];

      // 1) Intentar leer horas por RAP desde el backend (rap.horas o rap.horas_asignadas)
      let horasPorRap = [];
      const n = dist.raps.length;
      const totalFila = parseInt(dist.horas, 10) || 0;

      if (n > 0) {
        const vienenHoras = dist.raps.every(r => typeof r.horas !== "undefined" || typeof r.horas_asignadas !== "undefined");
        if (vienenHoras) {
          horasPorRap = dist.raps.map(r => parseInt(r.horas ?? r.horas_asignadas, 10) || 0);
        } else {
          // 2) Si no vienen horas por RAP, repartir igual que haces al guardar (entero + resto)
          const base = Math.floor(totalFila / n);
          let resto = totalFila % n;
          horasPorRap = Array.from({ length: n }, () => base).map((h, i) => h + (i < resto ? 1 : 0));
        }
      }

      // 3) Construir celdas con {id, descripcion, horas}
      dist.raps.forEach((rap, i) => {
        row.push({
          id: rap.id,
          descripcion: rap.descripcion,
          horas: horasPorRap[i] || 0,
        });
      });

      // 4) Relleno hasta RAP 4
      while (row.length < 5) {
        row.push("");
      }

      // 5) Total de la fila al final (string para mantener tu formato)
      row.push(totalFila.toString());

      datosPorTrimestre[dist.trimestre].push(row);

      // Mantener estructura de asignados por competencia si la necesitas
      if (!asignadosCompetencia[dist.id_comp]) asignadosCompetencia[dist.id_comp] = [];
      dist.raps.forEach((rap) => {
        if (!asignadosCompetencia[dist.id_comp].includes(String(rap.id))) {
          asignadosCompetencia[dist.id_comp].push(String(rap.id));
        }
      });

      horasPorTrimestre[dist.trimestre] += totalFila;
    });
  }
  for (let t = 1; t <= data.cant_trimestres; t++) {
    if (horasPorTrimestre[t] >= horasTotales) {
      trimestresCompletados[t] = true;
    }
    actualizarProgresoTrimestre(t);
  }
  actualizarEstadoBotonesTrimestre();
  actualizarTablaPorTrimestre(1);
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("paginacion").style.display = "none";
  document.getElementById("form-container").style.display = "none";
});

// ====================== PETICIÓN INICIAL (SWEETALERT) ======================
// Función para mostrar el prompt de solicitud de ficha
function solicitarNumeroFicha() {
  Swal.fire({
    title: "Ingrese el número de ficha:",
    input: "number",
    inputAttributes: { autocapitalize: "off" },
    showCancelButton: true,
    confirmButtonText: "Consultar",
    cancelButtonText: "Cancelar",
    preConfirm: (ficha) => {
      if (!ficha) {
        Swal.showValidationMessage("Por favor ingrese un número de ficha válido.");
      } else {
        return ficha;
      }
    },
    customClass: {
      confirmButton: "swal-btn-green",
      cancelButton: "swal-btn-gray",
    },
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
        zIndex: "0",
      });

      // Insertar el logo
      popup.insertBefore(logo, popup.firstChild);

      // Asegurar que contenido esté por encima
      popup
        .querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
        .forEach((el) => (el.style.zIndex = "1"));

      // Específicamente para el icono de success
      const successIcon = popup.querySelector(".swal2-icon.swal2-success");
      if (successIcon) {
        // Hacer transparente el fondo circular blanco del icono success
        const circularLines = popup.querySelectorAll(
          ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
        );
        circularLines.forEach((el) => {
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

        const successLines = popup.querySelectorAll(
          ".swal2-success-line-tip, .swal2-success-line-long"
        );
        successLines.forEach((el) => {
          el.style.zIndex = "2";
        });
      }
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      numeroFicha = result.value;
      fetch("/mostrar_datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ NumeroFicha: numeroFicha }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Respuesta del servidor:", data);
          if (!data.success) {
            // Modificación aquí: Mostramos el error y al darle OK volvemos a solicitar la ficha
            Swal.fire({
              icon: "error",
              title: "Error",
              text: data.message,
              confirmButtonColor: "#1e7e34",
              background: "#fff",
              backdrop: "rgba(0,0,0,0.4)",
              didOpen: () => {
                aplicarEstilosPopup();
              },
            }).then(() => {
              // Volvemos a llamar a la función para solicitar el número de ficha
              solicitarNumeroFicha();
            });
            return;
          }
          // Si la ficha es de jornada mixta y no tiene intensidad asignada, se solicita selección.
          if (
            data.jornada.toLowerCase() === "mixta" &&
            (!data.intensidad || data.intensidad == 0)
          ) {
            Swal.fire({
              title: "Seleccione las horas totales para la jornada mixta",
              input: "radio",
              inputOptions: { "286": "286 horas", "308": "308 horas" },
              confirmButtonText: "Aceptar",
              confirmButtonColor: "#1e7e34",
              inputValidator: (value) => {
                if (!value) {
                  return "Debe seleccionar una opción";
                }
              },
              background: "#fff",
              backdrop: "rgba(0,0,0,0.4)",
              didOpen: () => {
                aplicarEstilosPopup();
              },
            }).then((result2) => {
              if (result2.isConfirmed) {
                fetch("/actualizar_intensidad", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    NumeroFicha: numeroFicha,
                    selected_horas: result2.value,
                  }),
                })
                  .then((resp) => resp.json())
                  .then((updateData) => {
                    if (updateData.success) {
                      data.intensidad = updateData.intensidad;
                      continuarFlujo(data, numeroFicha);
                    } else {
                      Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: updateData.message,
                        confirmButtonColor: "#1e7e34",
                        background: "#fff",
                        backdrop: "rgba(0,0,0,0.4)",
                        didOpen: () => {
                          aplicarEstilosPopup();
                        },
                      }).then(() => {
                        // Si hay error al actualizar intensidad, volvemos a solicitar ficha
                        solicitarNumeroFicha();
                      });
                    }
                  })
                  .catch((err) => {
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "No se pudo actualizar la intensidad.",
                      confirmButtonColor: "#1e7e34",
                      background: "#fff",
                      backdrop: "rgba(0,0,0,0.4)",
                      didOpen: () => {
                        aplicarEstilosPopup();
                      },
                    }).then(() => {
                      // Si hay error en la petición, volvemos a solicitar ficha
                      solicitarNumeroFicha();
                    });
                  });
              } else {
                // Si cancela la selección de intensidad, volvemos a solicitar ficha
                solicitarNumeroFicha();
              }
            });
          } else {
            continuarFlujo(data, numeroFicha);
          }
        })
        .catch((error) => {
          console.error("Error en fetch:", error);
          document.getElementById("paginacion").style.display = "none";
          document.getElementById("form-container").style.display = "none";
          Swal.fire({
            title: "Error",
            text: "Ocurrió un problema al comunicarse con el servidor.",
            icon: "error",
            confirmButtonColor: "#1e7e34",
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)",
            didOpen: () => {
              aplicarEstilosPopup();
            },
          }).then(() => {
            // Si hay error de comunicación, volvemos a solicitar ficha
            solicitarNumeroFicha();
          });
        });
    } else {
      console.log("Número de ficha no ingresado o cancelado.");
    }
  });
}

// Función auxiliar para aplicar estilos al popup de SweetAlert
function aplicarEstilosPopup() {
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
    zIndex: "0",
  });

  // Insertar el logo si no existe ya
  if (!popup.querySelector('img[src="../../static/img/logo-sena-verde-png-sin-fondo.webp"]')) {
    popup.insertBefore(logo, popup.firstChild);
  }

  // Asegurar que contenido esté por encima
  popup
    .querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
    .forEach((el) => (el.style.zIndex = "1"));

  // Específicamente para el icono de success
  const successIcon = popup.querySelector(".swal2-icon.swal2-success");
  if (successIcon) {
    // Hacer transparente el fondo circular blanco del icono success
    const circularLines = popup.querySelectorAll(
      ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
    );
    circularLines.forEach((el) => {
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

    const successLines = popup.querySelectorAll(
      ".swal2-success-line-tip, .swal2-success-line-long"
    );
    successLines.forEach((el) => {
      el.style.zIndex = "2";
    });
  }
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("paginacion").style.display = "none";
  document.getElementById("form-container").style.display = "none";
  
  // Iniciamos la solicitud de número de ficha
  solicitarNumeroFicha();
});

function continuarFlujo(data, numeroFicha) {
  // Si data.malla_existe es false, significa que la ficha no tiene malla,
  // lo que activa el SweetAlert para elegir entre "Espejo" y "Manual"
  if (data.malla_existe === false) {
    Swal.fire({
      title: "La ficha no tiene malla",
      text: "Seleccione una opción:",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Espejo",
      denyButtonText: "Manual",
      cancelButtonText: "Cancelar",
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
          width: "190px",
          pointerEvents: "none",
          zIndex: "0",
        });

        // Insertar el logo
        popup.insertBefore(logo, popup.firstChild);

        // Asegurar que contenido esté por encima
        popup
          .querySelectorAll(
            ".swal2-title, .swal2-html-container, .swal2-actions"
          )
          .forEach((el) => (el.style.zIndex = "1"));

        // Específicamente para el icono de success
        const successIcon = popup.querySelector(".swal2-icon.swal2-success");
        if (successIcon) {
          // Hacer transparente el fondo circular blanco del icono success
          const circularLines = popup.querySelectorAll(
            ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
          );
          circularLines.forEach((el) => {
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

          const successLines = popup.querySelectorAll(
            ".swal2-success-line-tip, .swal2-success-line-long"
          );
          successLines.forEach((el) => {
            el.style.zIndex = "2";
          });
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `/malla_espejo?token=${generarToken()}&NumeroFicha=${numeroFicha}`;
      } else if (result.isDenied) {
        fetch("/crear_malla", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ NumeroFicha: numeroFicha }),
        })
          .then((response) => response.json())
          .then((resp) => {
            if (resp.success) {
              // Una vez creada la malla, volvemos a consultar para inicializar la interfaz.
              fetch("/mostrar_datos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ NumeroFicha: numeroFicha }),
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.success) {
                    const jornada = data.jornada.toLowerCase();
                    if (jornada === "mañana" || jornada === "tarde") {
                      horasTotales = 330;
                      initInterface(data);
                    } else if (jornada === "mixta") {
                      if (
                        data.intensidad &&
                        (parseInt(data.intensidad) === 1 ||
                          parseInt(data.intensidad) === 2)
                      ) {
                        horasTotales =
                          parseInt(data.intensidad) === 1 ? 286 : 308;
                        initInterface(data);
                      } else {
                        Swal.fire({
                          title:
                            "Seleccione las horas totales para la jornada mixta",
                          input: "radio",
                          inputOptions: { 286: "286 horas", 308: "308 horas" },
                          confirmButtonText: "Aceptar",
                          inputValidator: (value) => {
                            if (!value) {
                              return "Debe seleccionar una opción";
                            }
                          },
                          background: "#fff",
                          backdrop: "rgba(0,0,0,0.4)",
                          didOpen: () => {
                            const popup = Swal.getPopup();
                            const logo = document.createElement("img");
                            logo.src =
                              "../../static/img/logo-sena-verde-png-sin-fondo.webp";

                            // Estilos para el logo
                            Object.assign(logo.style, {
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              opacity: "0.2",
                              width: "220px",
                              pointerEvents: "none",
                              zIndex: "0",
                            });

                            // Insertar el logo
                            popup.insertBefore(logo, popup.firstChild);

                            // Asegurar que contenido esté por encima
                            popup
                              .querySelectorAll(
                                ".swal2-title, .swal2-html-container, .swal2-actions"
                              )
                              .forEach((el) => (el.style.zIndex = "1"));

                            // Específicamente para el icono de success
                            const successIcon = popup.querySelector(
                              ".swal2-icon.swal2-success"
                            );
                            if (successIcon) {
                              // Hacer transparente el fondo circular blanco del icono success
                              const circularLines = popup.querySelectorAll(
                                ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                              );
                              circularLines.forEach((el) => {
                                el.style.backgroundColor = "transparent";
                              });

                              // También hacer transparente el fix que SweetAlert2 usa
                              const successFix =
                                popup.querySelector(".swal2-success-fix");
                              if (successFix) {
                                successFix.style.backgroundColor =
                                  "transparent";
                              }

                              // Asegurar que el anillo y la marca de verificación sean visibles
                              const successRing = popup.querySelector(
                                ".swal2-success-ring"
                              );
                              if (successRing) {
                                successRing.style.zIndex = "1";
                              }

                              const successLines = popup.querySelectorAll(
                                ".swal2-success-line-tip, .swal2-success-line-long"
                              );
                              successLines.forEach((el) => {
                                el.style.zIndex = "2";
                              });
                            }
                          },
                        }).then((result) => {
                          if (result.isConfirmed) {
                            fetch("/actualizar_intensidad", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                NumeroFicha: numeroFicha,
                                selected_horas: result.value,
                              }),
                            })
                              .then((resp) => resp.json())
                              .then((updateData) => {
                                if (updateData.success) {
                                  horasTotales =
                                    updateData.intensidad === 1 ? 286 : 308;
                                  initInterface(data);
                                } else {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Error",
                                    text: updateData.message,
                                    confirmButtonColor: "#1e7e34",
                                    background: "#fff",
                                    backdrop: "rgba(0,0,0,0.4)",
                                    didOpen: () => {
                                      const popup = Swal.getPopup();
                                      const logo =
                                        document.createElement("img");
                                      logo.src =
                                        "../../static/img/logo-sena-verde-png-sin-fondo.webp";

                                      // Estilos para el logo
                                      Object.assign(logo.style, {
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        opacity: "0.2",
                                        width: "220px",
                                        pointerEvents: "none",
                                        zIndex: "0",
                                      });

                                      // Insertar el logo
                                      popup.insertBefore(
                                        logo,
                                        popup.firstChild
                                      );

                                      // Asegurar que contenido esté por encima
                                      popup
                                        .querySelectorAll(
                                          ".swal2-title, .swal2-html-container, .swal2-actions"
                                        )
                                        .forEach(
                                          (el) => (el.style.zIndex = "1")
                                        );

                                      // Específicamente para el icono de success
                                      const successIcon = popup.querySelector(
                                        ".swal2-icon.swal2-success"
                                      );
                                      if (successIcon) {
                                        // Hacer transparente el fondo circular blanco del icono success
                                        const circularLines =
                                          popup.querySelectorAll(
                                            ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                                          );
                                        circularLines.forEach((el) => {
                                          el.style.backgroundColor =
                                            "transparent";
                                        });

                                        // También hacer transparente el fix que SweetAlert2 usa
                                        const successFix =
                                          popup.querySelector(
                                            ".swal2-success-fix"
                                          );
                                        if (successFix) {
                                          successFix.style.backgroundColor =
                                            "transparent";
                                        }

                                        // Asegurar que el anillo y la marca de verificación sean visibles
                                        const successRing = popup.querySelector(
                                          ".swal2-success-ring"
                                        );
                                        if (successRing) {
                                          successRing.style.zIndex = "1";
                                        }

                                        const successLines =
                                          popup.querySelectorAll(
                                            ".swal2-success-line-tip, .swal2-success-line-long"
                                          );
                                        successLines.forEach((el) => {
                                          el.style.zIndex = "2";
                                        });
                                      }
                                    },
                                  });
                                }
                              })
                              .catch((err) => {
                                Swal.fire({
                                  icon: "error",
                                  title: "Error",
                                  text: "No se pudo actualizar la intensidad.",
                                  confirmButtonColor: "#1e7e34",
                                  background: "#fff",
                                  backdrop: "rgba(0,0,0,0.4)",
                                  didOpen: () => {
                                    const popup = Swal.getPopup();
                                    const logo = document.createElement("img");
                                    logo.src =
                                      "../../static/img/logo-sena-verde-png-sin-fondo.webp";

                                    // Estilos para el logo
                                    Object.assign(logo.style, {
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      opacity: "0.2",
                                      width: "220px",
                                      pointerEvents: "none",
                                      zIndex: "0",
                                    });

                                    // Insertar el logo
                                    popup.insertBefore(logo, popup.firstChild);

                                    // Asegurar que contenido esté por encima
                                    popup
                                      .querySelectorAll(
                                        ".swal2-title, .swal2-html-container, .swal2-actions"
                                      )
                                      .forEach((el) => (el.style.zIndex = "1"));

                                    // Específicamente para el icono de success
                                    const successIcon = popup.querySelector(
                                      ".swal2-icon.swal2-success"
                                    );
                                    if (successIcon) {
                                      // Hacer transparente el fondo circular blanco del icono success
                                      const circularLines =
                                        popup.querySelectorAll(
                                          ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                                        );
                                      circularLines.forEach((el) => {
                                        el.style.backgroundColor =
                                          "transparent";
                                      });

                                      // También hacer transparente el fix que SweetAlert2 usa
                                      const successFix =
                                        popup.querySelector(
                                          ".swal2-success-fix"
                                        );
                                      if (successFix) {
                                        successFix.style.backgroundColor =
                                          "transparent";
                                      }

                                      // Asegurar que el anillo y la marca de verificación sean visibles
                                      const successRing = popup.querySelector(
                                        ".swal2-success-ring"
                                      );
                                      if (successRing) {
                                        successRing.style.zIndex = "1";
                                      }

                                      const successLines =
                                        popup.querySelectorAll(
                                          ".swal2-success-line-tip, .swal2-success-line-long"
                                        );
                                      successLines.forEach((el) => {
                                        el.style.zIndex = "2";
                                      });
                                    }
                                  },
                                });
                              });
                          }
                        });
                      }
                    } else {
                      horasTotales = 330;
                      initInterface(data);
                    }
                  } else {
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: data.message || "No se pudo consultar la ficha.",
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
                          zIndex: "0",
                        });

                        // Insertar el logo
                        popup.insertBefore(logo, popup.firstChild);

                        // Asegurar que contenido esté por encima
                        popup
                          .querySelectorAll(
                            ".swal2-title, .swal2-html-container, .swal2-actions"
                          )
                          .forEach((el) => (el.style.zIndex = "1"));

                        // Específicamente para el icono de success
                        const successIcon = popup.querySelector(
                          ".swal2-icon.swal2-success"
                        );
                        if (successIcon) {
                          // Hacer transparente el fondo circular blanco del icono success
                          const circularLines = popup.querySelectorAll(
                            ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                          );
                          circularLines.forEach((el) => {
                            el.style.backgroundColor = "transparent";
                          });

                          // También hacer transparente el fix que SweetAlert2 usa
                          const successFix =
                            popup.querySelector(".swal2-success-fix");
                          if (successFix) {
                            successFix.style.backgroundColor = "transparent";
                          }

                          // Asegurar que el anillo y la marca de verificación sean visibles
                          const successRing = popup.querySelector(
                            ".swal2-success-ring"
                          );
                          if (successRing) {
                            successRing.style.zIndex = "1";
                          }

                          const successLines = popup.querySelectorAll(
                            ".swal2-success-line-tip, .swal2-success-line-long"
                          );
                          successLines.forEach((el) => {
                            el.style.zIndex = "2";
                          });
                        }
                      },
                    });
                  }
                })
                .catch((error) => {
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Ocurrió un problema al comunicarse con el servidor.",
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
                        zIndex: "0",
                      });

                      // Insertar el logo
                      popup.insertBefore(logo, popup.firstChild);

                      // Asegurar que contenido esté por encima
                      popup
                        .querySelectorAll(
                          ".swal2-title, .swal2-html-container, .swal2-actions"
                        )
                        .forEach((el) => (el.style.zIndex = "1"));

                      // Específicamente para el icono de success
                      const successIcon = popup.querySelector(
                        ".swal2-icon.swal2-success"
                      );
                      if (successIcon) {
                        // Hacer transparente el fondo circular blanco del icono success
                        const circularLines = popup.querySelectorAll(
                          ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                        );
                        circularLines.forEach((el) => {
                          el.style.backgroundColor = "transparent";
                        });

                        // También hacer transparente el fix que SweetAlert2 usa
                        const successFix =
                          popup.querySelector(".swal2-success-fix");
                        if (successFix) {
                          successFix.style.backgroundColor = "transparent";
                        }

                        // Asegurar que el anillo y la marca de verificación sean visibles
                        const successRing = popup.querySelector(
                          ".swal2-success-ring"
                        );
                        if (successRing) {
                          successRing.style.zIndex = "1";
                        }

                        const successLines = popup.querySelectorAll(
                          ".swal2-success-line-tip, .swal2-success-line-long"
                        );
                        successLines.forEach((el) => {
                          el.style.zIndex = "2";
                        });
                      }
                    },
                  });
                });
            } else {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: resp.message,
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
                    zIndex: "0",
                  });

                  // Insertar el logo
                  popup.insertBefore(logo, popup.firstChild);

                  // Asegurar que contenido esté por encima
                  popup
                    .querySelectorAll(
                      ".swal2-title, .swal2-html-container, .swal2-actions"
                    )
                    .forEach((el) => (el.style.zIndex = "1"));

                  // Específicamente para el icono de success
                  const successIcon = popup.querySelector(
                    ".swal2-icon.swal2-success"
                  );
                  if (successIcon) {
                    // Hacer transparente el fondo circular blanco del icono success
                    const circularLines = popup.querySelectorAll(
                      ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                    );
                    circularLines.forEach((el) => {
                      el.style.backgroundColor = "transparent";
                    });

                    // También hacer transparente el fix que SweetAlert2 usa
                    const successFix =
                      popup.querySelector(".swal2-success-fix");
                    if (successFix) {
                      successFix.style.backgroundColor = "transparent";
                    }

                    // Asegurar que el anillo y la marca de verificación sean visibles
                    const successRing = popup.querySelector(
                      ".swal2-success-ring"
                    );
                    if (successRing) {
                      successRing.style.zIndex = "1";
                    }

                    const successLines = popup.querySelectorAll(
                      ".swal2-success-line-tip, .swal2-success-line-long"
                    );
                    successLines.forEach((el) => {
                      el.style.zIndex = "2";
                    });
                  }
                },
              });
            }
          })
          .catch((err) => {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "No se pudo crear la malla.",
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
                  zIndex: "0",
                });

                // Insertar el logo
                popup.insertBefore(logo, popup.firstChild);

                // Asegurar que contenido esté por encima
                popup
                  .querySelectorAll(
                    ".swal2-title, .swal2-html-container, .swal2-actions"
                  )
                  .forEach((el) => (el.style.zIndex = "1"));

                // Específicamente para el icono de success
                const successIcon = popup.querySelector(
                  ".swal2-icon.swal2-success"
                );
                if (successIcon) {
                  // Hacer transparente el fondo circular blanco del icono success
                  const circularLines = popup.querySelectorAll(
                    ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                  );
                  circularLines.forEach((el) => {
                    el.style.backgroundColor = "transparent";
                  });

                  // También hacer transparente el fix que SweetAlert2 usa
                  const successFix = popup.querySelector(".swal2-success-fix");
                  if (successFix) {
                    successFix.style.backgroundColor = "transparent";
                  }

                  // Asegurar que el anillo y la marca de verificación sean visibles
                  const successRing = popup.querySelector(
                    ".swal2-success-ring"
                  );
                  if (successRing) {
                    successRing.style.zIndex = "1";
                  }

                  const successLines = popup.querySelectorAll(
                    ".swal2-success-line-tip, .swal2-success-line-long"
                  );
                  successLines.forEach((el) => {
                    el.style.zIndex = "2";
                  });
                }
              },
            });
          });
      }
    });
    return;
  }
  // Si la ficha ya tiene malla (malla_existe: true), se carga la interfaz normalmente.
  const jornada = data.jornada.toLowerCase();
  if (jornada === "mañana" || jornada === "tarde") {
    horasTotales = 330;
    initInterface(data);
  } else if (jornada === "mixta") {
    if (
      data.intensidad &&
      (parseInt(data.intensidad) === 1 || parseInt(data.intensidad) === 2)
    ) {
      horasTotales = parseInt(data.intensidad) === 1 ? 286 : 308;
      initInterface(data);
    } else {
      Swal.fire({
        title: "Seleccione las horas totales para la jornada mixta",
        input: "radio",
        inputOptions: { 286: "286 horas", 308: "308 horas" },
        confirmButtonText: "Aceptar",
        inputValidator: (value) => {
          if (!value) {
            return "Debe seleccionar una opción";
          }
        },
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
            zIndex: "0",
          });

          // Insertar el logo
          popup.insertBefore(logo, popup.firstChild);

          // Asegurar que contenido esté por encima
          popup
            .querySelectorAll(
              ".swal2-title, .swal2-html-container, .swal2-actions"
            )
            .forEach((el) => (el.style.zIndex = "1"));

          // Específicamente para el icono de success
          const successIcon = popup.querySelector(".swal2-icon.swal2-success");
          if (successIcon) {
            // Hacer transparente el fondo circular blanco del icono success
            const circularLines = popup.querySelectorAll(
              ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
            );
            circularLines.forEach((el) => {
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

            const successLines = popup.querySelectorAll(
              ".swal2-success-line-tip, .swal2-success-line-long"
            );
            successLines.forEach((el) => {
              el.style.zIndex = "2";
            });
          }
        },
      }).then((result) => {
        if (result.isConfirmed) {
          fetch("/actualizar_intensidad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              NumeroFicha: numeroFicha,
              selected_horas: result.value,
            }),
          })
            .then((resp) => resp.json())
            .then((updateData) => {
              if (updateData.success) {
                horasTotales = updateData.intensidad === 1 ? 286 : 308;
                initInterface(data);
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: updateData.message,
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
                      zIndex: "0",
                    });

                    // Insertar el logo
                    popup.insertBefore(logo, popup.firstChild);

                    // Asegurar que contenido esté por encima
                    popup
                      .querySelectorAll(
                        ".swal2-title, .swal2-html-container, .swal2-actions"
                      )
                      .forEach((el) => (el.style.zIndex = "1"));

                    // Específicamente para el icono de success
                    const successIcon = popup.querySelector(
                      ".swal2-icon.swal2-success"
                    );
                    if (successIcon) {
                      // Hacer transparente el fondo circular blanco del icono success
                      const circularLines = popup.querySelectorAll(
                        ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                      );
                      circularLines.forEach((el) => {
                        el.style.backgroundColor = "transparent";
                      });

                      // También hacer transparente el fix que SweetAlert2 usa
                      const successFix =
                        popup.querySelector(".swal2-success-fix");
                      if (successFix) {
                        successFix.style.backgroundColor = "transparent";
                      }

                      // Asegurar que el anillo y la marca de verificación sean visibles
                      const successRing = popup.querySelector(
                        ".swal2-success-ring"
                      );
                      if (successRing) {
                        successRing.style.zIndex = "1";
                      }

                      const successLines = popup.querySelectorAll(
                        ".swal2-success-line-tip, .swal2-success-line-long"
                      );
                      successLines.forEach((el) => {
                        el.style.zIndex = "2";
                      });
                    }
                  },
                });
              }
            })
            .catch((err) => {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo actualizar la intensidad.",
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
                    zIndex: "0",
                  });

                  // Insertar el logo
                  popup.insertBefore(logo, popup.firstChild);

                  // Asegurar que contenido esté por encima
                  popup
                    .querySelectorAll(
                      ".swal2-title, .swal2-html-container, .swal2-actions"
                    )
                    .forEach((el) => (el.style.zIndex = "1"));

                  // Específicamente para el icono de success
                  const successIcon = popup.querySelector(
                    ".swal2-icon.swal2-success"
                  );
                  if (successIcon) {
                    // Hacer transparente el fondo circular blanco del icono success
                    const circularLines = popup.querySelectorAll(
                      ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
                    );
                    circularLines.forEach((el) => {
                      el.style.backgroundColor = "transparent";
                    });

                    // También hacer transparente el fix que SweetAlert2 usa
                    const successFix =
                      popup.querySelector(".swal2-success-fix");
                    if (successFix) {
                      successFix.style.backgroundColor = "transparent";
                    }

                    // Asegurar que el anillo y la marca de verificación sean visibles
                    const successRing = popup.querySelector(
                      ".swal2-success-ring"
                    );
                    if (successRing) {
                      successRing.style.zIndex = "1";
                    }

                    const successLines = popup.querySelectorAll(
                      ".swal2-success-line-tip, .swal2-success-line-long"
                    );
                    successLines.forEach((el) => {
                      el.style.zIndex = "2";
                    });
                  }
                },
              });
            });
        }
      });
    }
  } else {
    horasTotales = 330;
    initInterface(data);
  }
}

// ====================== FUNCIONES DE LA SEGUNDA PARTE ======================
// Modificar la función cargarRaps para mostrar TODOS los RAPs
function cargarRaps(competenciaId) {
  $('#rap').prop('disabled', true);
  $('#rap').empty();
  let todosRaps = window.rapsData && window.rapsData[competenciaId] ? window.rapsData[competenciaId] : [];
  // Quitamos el filtrado de RAPs ya asignados
  if (todosRaps.length === 0) {
    $('#rap').append('<option value="">No hay RAPs disponibles</option>');
  } else {
    todosRaps.forEach(rap => {
      $('#rap').append(`<option value="${rap.id}">${rap.descripcion}</option>`);
    });
  }
  $('#rap').prop('disabled', false);
  $('#rap').val(null).trigger('change');
}

function actualizarTablaPorTrimestre(trimestre) {
  if (trimestre > 1 && !trimestresCompletados[trimestre - 1]) {
    Swal.fire({
      icon: "warning",
      title: `Debe completar el Trimestre ${trimestre - 1} primero.`,
      text: "Complete el trimestre anterior antes de avanzar.",
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
          zIndex: "0",
        });

        // Insertar el logo
        popup.insertBefore(logo, popup.firstChild);

        // Asegurar que contenido esté por encima
        popup
          .querySelectorAll(
            ".swal2-title, .swal2-html-container, .swal2-actions"
          )
          .forEach((el) => (el.style.zIndex = "1"));

        // Específicamente para el icono de success
        const successIcon = popup.querySelector(".swal2-icon.swal2-success");
        if (successIcon) {
          // Hacer transparente el fondo circular blanco del icono success
          const circularLines = popup.querySelectorAll(
            ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
          );
          circularLines.forEach((el) => {
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

          const successLines = popup.querySelectorAll(
            ".swal2-success-line-tip, .swal2-success-line-long"
          );
          successLines.forEach((el) => {
            el.style.zIndex = "2";
          });
        }
      },
    });
    let ultimo = 1;
    for (let i = 1; i < trimestre; i++) {
      if (trimestresCompletados[i] || i === 1) {
        ultimo = i;
      }
    }
    document
      .querySelector(`.trimestre-btn[data-trimester="${ultimo}"]`)
      .click();
    return;
  }
  table.clear();
  if (datosPorTrimestre[trimestre] && datosPorTrimestre[trimestre].length > 0) {
    datosPorTrimestre[trimestre].forEach((row) => {
      let displayRow = row.map((cell, index) => {
        if (
          index >= 1 &&
          index <= 4 &&
          typeof cell === "object" &&
          cell.descripcion
        ) {
          return cell.descripcion;
        }
        return cell;
      });
      const rowNode = table.row.add(displayRow).draw().node();
      rowNode._fullData = row;
      rowNode.dataset.competenciaId = row._id_comp || "";
    });
  }
  table.draw();
  setTimeout(aplicarBotonesEliminarFilasExistentes, 100);
  actualizarSumaHorasTrimestre(trimestre);
  actualizarProgresoTrimestre(trimestre);
}

// Definir los estilos de SweetAlert como una función reutilizable
function setupSweetAlertStyles(popup) {
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
    zIndex: "0",
  });

  // Insertar el logo
  popup.insertBefore(logo, popup.firstChild);

  // Asegurar que contenido esté por encima
  popup
    .querySelectorAll(
      ".swal2-title, .swal2-html-container, .swal2-actions"
    )
    .forEach((el) => (el.style.zIndex = "1"));

  // Específicamente para el icono de success
  const successIcon = popup.querySelector(".swal2-icon.swal2-success");
  if (successIcon) {
    // Hacer transparente el fondo circular blanco del icono success
    const circularLines = popup.querySelectorAll(
      ".swal2-success-circular-line-left, .swal2-success-circular-line-right"
    );
    circularLines.forEach((el) => {
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

    const successLines = popup.querySelectorAll(
      ".swal2-success-line-tip, .swal2-success-line-long"
    );
    successLines.forEach((el) => {
      el.style.zIndex = "2";
    });
  }
}

// Función para mostrar alertas SweetAlert con estilos consistentes
function showStyledAlert(options) {
  return Swal.fire({
    ...options,
    confirmButtonColor: "#1e7e34",
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    didOpen: () => setupSweetAlertStyles(Swal.getPopup())
  });
}

document.getElementById("asociar-btn").addEventListener("click", () => {
  // ——— NUEVO: validación de bloques de horas ———
  const VALORES_VALIDOS = [22,33,44,55,66,77,88,99,110,121,132,143,154,165,176,187,198,209,220,231,242,253,264,275,286,297,308,319,330,341,352,363,374,385,396,407,418,429,440,451,462,473,484,495,506,517,528,539,550,561,572,583,594,605,616,627,638,649,660,671,682,693,704,715,726,737,748,759,770,781,792,803,814,825,836,847,858,869,880,891,902,913,924,935,946,957,968,979,990];
  const horasVal = parseInt(document.getElementById("horas").value, 10);
  if (!VALORES_VALIDOS.includes(horasVal)) {
    showStyledAlert({
      icon: "warning",
      title: "Error",
      text: `Solo puedes ingresar múltiplos de 11 horas (Ejem: 22,33,44,66,88...)`
    });
    return;
  }
  // ——— FIN validación ———

  if (!trimestreSeleccionado) {
    showStyledAlert({
      icon: "warning",
      title: "Seleccione un trimestre antes de asociar horas."
    });
    return;
  }
  
  var comp = $("#competencia option:selected").text();
  var compId = $("#competencia").val();
  var raps = $("#rap option:selected");
  var horas = horasVal; // usamos el valor ya validado
  
  if (!compId || !raps.length) {
    showStyledAlert({
      icon: "warning",
      title: "Por favor, complete todos los campos: Competencia, RAPs y Horas."
    });
    return;
  }
  
  const horasRestantes = horasTotales - (horasPorTrimestre[trimestreSeleccionado] || 0);
  if (horas > horasRestantes) {
    showStyledAlert({
      icon: "warning",
      title: `Solo puedes ingresar ${horasRestantes} hora(s) restantes para este trimestre.`
    });
    return;
  }
  
  // ——— REPARTO ENTERO + RESTO ———
  const n = raps.length;
  const base = Math.floor(horas / n);
  let resto = horas % n;
  const rapsParaGuardar = [];
  
  raps.each(function() {
    let h = base + (resto > 0 ? 1 : 0);
    resto--;
    rapsParaGuardar.push({
      id_rap: $(this).val(),
      horas: h
    });
  });

  console.log("Enviando datos:", {
    numeroFicha,
    trimestre: trimestreSeleccionado,
    raps: rapsParaGuardar,
  });
  
  fetch("/guardar_distribucion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      numeroFicha: numeroFicha,
      trimestre: trimestreSeleccionado,
      raps: rapsParaGuardar,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // ——— CONSTRUIR FILA CON HORAS INCLUIDAS ———
        var row = [comp];
        let rapIndex = 0;
        raps.each(function () {
          const rapData = rapsParaGuardar[rapIndex];
          row.push({ 
            id: $(this).val(), 
            descripcion: $(this).text(),
            horas: rapData.horas  // ← INCLUIR HORAS AQUÍ
          });
          rapIndex++;
        });
        while (row.length < 5) {
          row.push("");
        }
        row.push(horas);
        
        if (row.length === 6) {
          datosPorTrimestre[trimestreSeleccionado].push(row);
          
          const displayRow = row.map((cell, index) => {
            if (
              index >= 1 &&
              index <= 4 &&
              typeof cell === "object" &&
              cell.descripcion
            ) {
              return cell.descripcion;
            }
            return cell;
          });
          
          const rowNode = table.row.add(displayRow).draw().node();
          rowNode._fullData = row;
          rowNode.dataset.competenciaId = compId;
          
          // Actualizar asignados por competencia
          raps.each(function () {
            const rapId = $(this).val();
            if (!asignadosCompetencia[compId]) {
              asignadosCompetencia[compId] = [];
            }
            if (!asignadosCompetencia[compId].includes(String(rapId))) {
              asignadosCompetencia[compId].push(String(rapId));
            }
          });

          // Limpiar formulario
          $("#horas").val("");
          $("#rap").select2("destroy");
          cargarRaps(compId);
          $("#rap").select2({
            width: "100%",
            placeholder: "Seleccione RAPs",
            allowClear: true,
          });

          // Actualizar horas y progreso
          horasPorTrimestre[trimestreSeleccionado] += horas;
          actualizarSumaHorasTrimestre(trimestreSeleccionado);
          actualizarProgresoTrimestre(trimestreSeleccionado);
          
          // ——— APLICAR BOTONES DESPUÉS DE AGREGAR LA FILA ———
          aplicarBotonesEliminarFilasExistentes();
          
          // Verificar si el trimestre está completo
          const progresoActual = actualizarProgresoTrimestre(trimestreSeleccionado);
          if (progresoActual === 100) {
            trimestresCompletados[trimestreSeleccionado] = true;
            actualizarEstadoBotonesTrimestre();
            
            // Mostrar mensaje de éxito sin eliminar
            showStyledAlert({
              icon: "success",
              title: "RAP agregado correctamente."
            });
            
            // Mostrar mensaje de parabéns después
            setTimeout(() => {
              showStyledAlert({
                icon: "success",
                title: `¡Parabéns! Has terminado el Trimestre ${trimestreSeleccionado}.`,
                text: trimestreSeleccionado < totalTrimestresF
                  ? `Ahora puedes pasar al Trimestre ${trimestreSeleccionado + 1}.`
                  : `¡Has completado todos los trimestres!`
              }).then(() => {
                if (
                  trimestreSeleccionado < totalTrimestresF &&
                  document.querySelector(
                    `.trimestre-btn[data-trimester="${trimestreSeleccionado + 1}"]`
                  )
                ) {
                  document
                    .querySelector(
                      `.trimestre-btn[data-trimester="${trimestreSeleccionado + 1}"]`
                    )
                    .click();
                }
              });
            }, 1000);
          } else {
            showStyledAlert({
              icon: "success",
              title: "RAP agregado correctamente."
            });
          }
        } else {
          showStyledAlert({
            icon: "error",
            title: "Error",
            text: "La fila no tiene el número correcto de columnas."
          });
        }
      } else {
        showStyledAlert({
          icon: "error",
          title: "Error al guardar",
          text: data.message || "No se pudo guardar la distribución."
        });
      }
    })
    .catch((error) => {
      showStyledAlert({
        icon: "error",
        title: "Error",
        text: "Ocurrió un problema al comunicarse con el servidor."
      });
    });
});

// ——— FUNCIÓN MEJORADA PARA APLICAR BOTONES ———
function aplicarBotonesEliminarFilasExistentes() {
  $("#resultados tbody tr").each(function () {
    const rowNode  = this;
    const fullData = rowNode._fullData || [];
    const celdas   = rowNode.getElementsByTagName("td");

    // 1) Primero, eliminamos botones previos para evitar duplicados:
    //    - Competencia
    const prevAll = celdas[0].querySelector(".btn-eliminar-competencia");
    if (prevAll) prevAll.remove();
    //    - RAPs
    for (let j = 1; j <= 4; j++) {
      const prevRap = celdas[j].querySelector(".btn-eliminar-rap");
      if (prevRap) prevRap.remove();
    }

    // 2) Comprueba si esta fila tiene al menos un RAP para añadir el botón de competencia
    const tieneRaps = fullData.slice(1, 5).some(cell => cell && cell.id);
    if (tieneRaps) {
      const btnAll = document.createElement("button");
      btnAll.textContent = "X";
      btnAll.title = "Eliminar todos los RAPs de esta competencia";
      btnAll.className = "btn-eliminar-competencia";
      btnAll.style.cssText = `
        background:red;color:white;border:none;
        border-radius:50%;width:20px;height:20px;
        font-size:10px;cursor:pointer;margin-left:5px;
      `;
      btnAll.addEventListener("click", () => {
        showStyledAlert({
          icon: "warning",
          title: "¿Eliminar todos los RAPs de esta competencia?",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar todo",
          cancelButtonText: "Cancelar"
        }).then(res => {
          if (!res.isConfirmed) return;
          const rowIndex = table.row(rowNode).index();
          const filaData = datosPorTrimestre[trimestreSeleccionado][rowIndex] || [];

          // Calcular total de horas a restar
          let totalHorasARestar = 0;
          filaData.slice(1, 5).forEach(cell => {
            if (cell && cell.id && cell.horas) {
              totalHorasARestar += cell.horas;
            }
          });

          // Resta horas y dispara peticiones
          filaData.slice(1, 5).forEach(cell => {
            if (cell && cell.id) {
              fetch("/eliminar_distribucion", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({
                  numeroFicha,
                  id_rap: cell.id,
                  trimestre: trimestreSeleccionado
                })
              }).catch(() => {});
              
              // Actualizar asignados por competencia
              const compId = rowNode.dataset.competenciaId;
              if (asignadosCompetencia[compId]) {
                asignadosCompetencia[compId] = asignadosCompetencia[compId].filter(
                  (id) => id !== cell.id
                );
              }
            }
          });

          // Actualizar horas en frontend
          horasPorTrimestre[trimestreSeleccionado] -= totalHorasARestar;
          actualizarSumaHorasTrimestre(trimestreSeleccionado);

          // Elimina la fila de datos y refresca
          datosPorTrimestre[trimestreSeleccionado].splice(rowIndex, 1);
          actualizarTablaPorTrimestre(trimestreSeleccionado);
          actualizarProgresoTrimestre(trimestreSeleccionado);
          
          // Actualizar estado del trimestre
          if (horasPorTrimestre[trimestreSeleccionado] < horasTotales) {
            trimestresCompletados[trimestreSeleccionado] = false;
            actualizarEstadoBotonesTrimestre();
          }
          
          // Recargar RAPs disponibles
          const compId = $("#competencia").val();
          if (compId) {
            cargarRaps(compId);
          }
          
          showStyledAlert({ 
            icon: "success", 
            title: "Competencia eliminada.",
            text: `Se han restado ${totalHorasARestar} horas del total.`
          });
        });
      });
      celdas[0].appendChild(btnAll);
    }

    // 3) Ahora añade los botones de eliminar para cada RAP
    for (let i = 1; i <= 4; i++) {
      if (celdas[i] && celdas[i].textContent.trim() !== "") {
        const rapData = fullData[i];
        if (rapData && rapData.id && rapData.descripcion) {
          const btn = crearBotonEliminar(rapData.id);
          btn.addEventListener("click", function () {
            const btnElement = this;
            const horasAsignadas = rapData.horas || 0; // ← AHORA SÍ TIENE LAS HORAS
            
            showStyledAlert({
              icon: "warning",
              title: "¿Deseas eliminar este RAP?",
              text: `Se eliminarán ${horasAsignadas} horas`,
              showCancelButton: true,
              confirmButtonText: "Sí, eliminar",
              cancelButtonText: "Cancelar"
            }).then(result => {
              if (!result.isConfirmed) return;

              // Restar horas en frontend
              horasPorTrimestre[trimestreSeleccionado] -= horasAsignadas;
              actualizarSumaHorasTrimestre(trimestreSeleccionado);

              // Llamada al servidor
              fetch("/eliminar_distribucion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  numeroFicha,
                  id_rap: btnElement.dataset.idRap,
                  trimestre: trimestreSeleccionado,
                }),
              })
                .then(r => r.json())
                .then(data => {
                  if (data.success) {
                    const rowIndex = table.row(rowNode).index();

                    if (
                      datosPorTrimestre[trimestreSeleccionado] &&
                      datosPorTrimestre[trimestreSeleccionado][rowIndex]
                    ) {
                      const fila = datosPorTrimestre[trimestreSeleccionado][rowIndex];

                      // 1) Quitar el RAP de la fila
                      fila[i] = "";

                      // 2) Restar del total de la fila
                      const totalAntes = parseInt(fila[5], 10) || 0;
                      const nuevoTotal = Math.max(0, totalAntes - horasAsignadas);
                      fila[5] = nuevoTotal.toString();

                      // 3) Si ya no queda ningún RAP en la fila, elimina la fila entera
                      const quedanRaps = fila.slice(1, 5).some(c => c && c.id);
                      if (!quedanRaps) {
                        datosPorTrimestre[trimestreSeleccionado].splice(rowIndex, 1);
                      }
                    }

                    // Actualizar asignados por competencia
                    const compId = rowNode.dataset.competenciaId;
                    if (asignadosCompetencia[compId]) {
                      asignadosCompetencia[compId] = asignadosCompetencia[compId].filter(
                        (id) => id !== btnElement.dataset.idRap
                      );
                    }

                    // Reconstruir tabla y progreso
                    actualizarTablaPorTrimestre(trimestreSeleccionado);
                    actualizarProgresoTrimestre(trimestreSeleccionado);

                    // Estado de bloqueo/desbloqueo de trimestres
                    if (horasPorTrimestre[trimestreSeleccionado] < horasTotales) {
                      trimestresCompletados[trimestreSeleccionado] = false;
                      actualizarEstadoBotonesTrimestre();
                    }

                    // Recargar RAPs disponibles si la competencia sigue seleccionada
                    if ($("#competencia").val() === compId) {
                      cargarRaps(compId);
                    }

                    showStyledAlert({ 
                      icon: "success", 
                      title: "RAP eliminado.",
                      text: `Se han restado ${horasAsignadas} horas del total y de la fila.`
                    });
                  } else {
                    // Si falla el servidor, restaurar las horas
                    horasPorTrimestre[trimestreSeleccionado] += horasAsignadas;
                    actualizarSumaHorasTrimestre(trimestreSeleccionado);
                    showStyledAlert({
                      icon: "error",
                      title: "Error al eliminar",
                      text: data.message || "No se pudo eliminar el RAP."
                    });
                  }
                })
                .catch(() => {
                  // Si falla la conexión, restaurar las horas
                  horasPorTrimestre[trimestreSeleccionado] += horasAsignadas;
                  actualizarSumaHorasTrimestre(trimestreSeleccionado);
                  showStyledAlert({ icon: "error", title: "Error de comunicación" });
                });
            });
          });
          // Sustituye el contenido de la celda
          celdas[i].innerHTML = "";
          celdas[i].appendChild(document.createTextNode(rapData.descripcion));
          celdas[i].appendChild(btn);
        }
      }
    }
  });
}

// ——— Inserta antes en tu archivo ———
function setupSweetAlertStyles(popup) {
  const logo = document.createElement("img");
  logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
  Object.assign(logo.style, {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: "0.2", width: "220px",
    pointerEvents: "none", zIndex: "0",
  });
  popup.insertBefore(logo, popup.firstChild);
  popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
       .forEach(el => (el.style.zIndex = "1"));
  const successIcon = popup.querySelector(".swal2-icon.swal2-success");
  if (successIcon) {
    popup.querySelectorAll(
      ".swal2-success-circular-line-left, .swal2-success-circular-line-right, .swal2-success-fix"
    ).forEach(el => el.style.backgroundColor = "transparent");
    const successRing = popup.querySelector(".swal2-success-ring");
    if (successRing) successRing.style.zIndex = "1";
    popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long")
         .forEach(el => el.style.zIndex = "2");
  }
}

function showStyledAlert(options) {
  return Swal.fire({
    ...options,
    confirmButtonColor: "#1e7e34",
    cancelButtonColor: "#6c757d",
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    customClass: {
      confirmButton: "swal-btn-green",
      cancelButton:  "swal-btn-gray",
    },
    didOpen: () => setupSweetAlertStyles(Swal.getPopup()),
  });
}

// ——— Y para garantizar el estilo de los botones ———
$(document).ready(function () {
  const btnGreen = ".swal-btn-green";
  const btnGray  = ".swal-btn-gray";
  $(btnGreen).css({
    "background-color": "#218838",
    "border-color":     "#1e7e34",
    color:              "#fff",
  }).hover(
    () => $(btnGreen).css({ "background-color": "#1e7e34", "border-color": "#155724" }),
    () => $(btnGreen).css({ "background-color": "#218838", "border-color": "#1e7e34" })
  );
  $(btnGray).css({
    "background-color": "#6c757d",
    "border-color":     "#5a6268",
    color:              "#fff",
  }).hover(
    () => $(btnGray).css({ "background-color": "#5a6268", "border-color": "#4e555b" }),
    () => $(btnGray).css({ "background-color": "#6c757d", "border-color": "#5a626d" })
  );
});


const exportarBtn = document.getElementById("exportar-btn");
if (exportarBtn) {
  exportarBtn.addEventListener("click", () => {
    const datosExportacion = { horasPorTrimestre, datosPorTrimestre };
    const jsonData = JSON.stringify(datosExportacion);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planeacion_ficha_${numeroFicha}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  });
}

$(document).ready(function () {
  if (document.querySelector(".tituloTablas span")) {
    document.querySelector(".tituloTablas span").textContent = "0";
  }

  if ($("#competencia").length) {
    if (!$("#competencia").data("select2")) {
      $("#competencia").select2({
        width: "100%",
        placeholder: "Seleccione una competencia",
        allowClear: true,
      });
    }
  }
  if ($("#rap").length) {
    if (!$("#rap").data("select2")) {
      $("#rap").select2({
        width: "100%",
        placeholder: "Seleccione RAPs",
        allowClear: true,
      });
    }
  }

  $(document).on("change", "#competencia", function () {
    const id = $(this).val();
    if (id) {
      cargarRaps(id);
    }
  });

  table = $("#resultados").DataTable({
    lengthChange: false,
    searching: false,
    columns: [
      { title: "Competencia" },
      { title: "RAP 1" },
      { title: "RAP 2" },
      { title: "RAP 3" },
      { title: "RAP 4" },
      { title: "Horas de Ejecución" },
    ],
  });

  $(".js-example-basic-single").select2();
  $("#js-example-basic-hide-search-multi").select2();

  $("select").on("select2:opening select2:closing", function (event) {
    var $sf = $("#" + event.target.id)
      .parent()
      .find(".select2-search__field");
    $sf.prop("disabled", true);
  });

  if (trimestreSeleccionado) {
    actualizarSumaHorasTrimestre(trimestreSeleccionado);
  }

  const btnGreen = ".swal-btn-green";
  const btnGray = ".swal-btn-gray";
  $(btnGreen).css({
    "background-color": "#218838",
    "border-color": "#1e7e34",
    color: "#fff",
  });
  $(btnGray).css({
    "background-color": "#6c757d",
    "border-color": "#5a6268",
    color: "#fff",
  });
  $(btnGreen).hover(
    function () {
      $(this).css({ "background-color": "#1e7e34", "border-color": "#155724" });
    },
    function () {
      $(this).css({ "background-color": "#218838", "border-color": "#1e7e34" });
    }
  );
  $(btnGray).hover(
    function () {
      $(this).css({ "background-color": "#5a6268", "border-color": "#4e555b" });
    },
    function () {
      $(this).css({ "background-color": "#6c757d", "border-color": "#5a626d" });
    }
  );
});

const style = document.createElement("style");
style.textContent = `
  .btn-eliminar-rap {
    background-color: red;
    color: white;
    border: none;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    position: absolute;
    right: 10px;
    top: 85%;
    transform: translateY(-50%);
  }
  .btn-eliminar-rap:hover { background-color: darkred; }
  #resultados td { position: relative; padding-right: 30px; }
`;
document.head.appendChild(style);

$(document).ready(function () {
  setTimeout(aplicarBotonesEliminarFilasExistentes, 500);
});

function generarToken() {
  return "🧬Carioca🧬";
}
