(() => {
  // 1) Modifica tu seleccionarSedeInicial para guardar también el nombre
  let selectedSede = null;

  // Lleva registro de los tonos HSL ya asignados
  // Distintos colores usando el ángulo dorado
  let hueCounter = 0;

  function getUniqueHue() {
    if (usedHues.size >= 360) {
      usedHues.clear();
    }
    let hue;
    do {
      hue = Math.floor(Math.random() * 360);
    } while (usedHues.has(hue));
    usedHues.add(hue);
    return hue;
  }

  // Función modificada para verificar mallas después de seleccionar sede
  function seleccionarSedeInicial() {
    return fetch("/obtener_sedes_usuario")
      .then((r) => r.json())
      .then((sedes) => {
        const opciones = sedes
          .map((s) => `<option value="${s.id}">${s.nombre}</option>`)
          .join("");
        return Swal.fire({
          title: "Seleccionar Sede",
          html: `
              <select id="sede-inicial" class="swal2-select" style="z-index:1000;">
                <option value="">Elige una sede</option>
                ${opciones}
              </select>
            `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          confirmButtonText: "Aceptar",
          ...sweetAlertConfig,
          didOpen: insertarLogo,
          preConfirm: () => {
            const sel = document.getElementById("sede-inicial");
            if (!sel.value) {
              Swal.showValidationMessage("Debes escoger una sede");
              return false;
            }
            return { id: sel.value, name: sel.options[sel.selectedIndex].text };
          },
        }).then((res) => {
          if (res.isConfirmed) {
            // Guardar la sede seleccionada
            const sede = res.value;

            // Verificar mallas antes de continuar
            return verificarMallasSede(sede);
          }
        });
      });
  }

  // Nueva función para verificar el estado de las mallas
  function verificarMallasSede(sede) {
    return fetch(`/verificar_mallas_sede?sede=${sede.id}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
        return { sede, resultado: body };
      })
      .then(({ sede, resultado }) => {
        // Si todas las mallas están completas, continuar normalmente
        if (resultado.todas_completas) {
          aplicarSeleccionSede(sede);
          return;
        }

        // Si hay mallas incompletas, mostrar alerta con tabla
        // Crear filas de tabla para las fichas con mallas incompletas
        const filasTabla = resultado.fichas_incompletas
          .map(
            (f) =>
              `<tr>
               <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${f.numero_ficha}</td>
               <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${f.nombre_programa}</td>
             </tr>`
          )
          .join("");

        // Construir la tabla completa
        const tablaHTML = `
            <div style="margin: 15px 0;">
              <p>Las siguientes fichas tienen la malla incompleta:</p>
              <div style="max-height: 300px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #39A900; color: white;">
                      <th style="padding: 8px; text-align: left;">Ficha</th>
                      <th style="padding: 8px; text-align: left;">Programa</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filasTabla}
                  </tbody>
                </table>
              </div>
              <p style="margin-top: 15px;">¿Desea continuar de todas formas?</p>
            </div>
          `;

        return Swal.fire({
          title: "¡Atención!",
          html: tablaHTML,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Continuar",
          cancelButtonText: "Cancelar",
          width: "800px",
          ...sweetAlertConfig,
          didOpen: insertarLogo,
        }).then((result) => {
          if (result.isConfirmed) {
            // Usuario elige continuar a pesar de mallas incompletas
            aplicarSeleccionSede(sede);
          } else {
            // Usuario cancela, volver a seleccionar sede
            return seleccionarSedeInicial();
          }
        });
      })
      .catch((err) => {
        mostrarError("Error al verificar mallas", err.message);
        // En caso de error, intentar de nuevo
        return seleccionarSedeInicial();
      });
  }

  // Función para aplicar la selección de sede (extraída de seleccionarSedeInicial)
  function aplicarSeleccionSede(sede) {
    selectedSede = sede;

    // Actualizar el label
    document.getElementById("sede-label").textContent = `Sede: ${sede.name}`;

    // Mostrar los botones que estaban ocultos
    document.getElementById("fichas-btn-container").style.display = "block";

    // Mostrar también el contenedor de filtros específicamente
    const filtersContainer = document.querySelector(".filters-container");
    if (filtersContainer) filtersContainer.style.display = "flex";

    document.getElementById("toggle-export").disabled = false;

    // Mostrar los controles de paginación
    const paginationControls = document.querySelector(".pagination-controls");
    if (paginationControls) paginationControls.style.display = "flex";

    // Mostrar el botón "Fichas sin Horarios"
    const btnFichasSinHorarios = document.querySelector(".btn-export");
    if (btnFichasSinHorarios) btnFichasSinHorarios.style.display = "block";
  }

  // 2) Al cargar la página, esperar la selección y deshabilitar export inicialmente
  // Inicializa: renderiza mañana, añade listeners de navegación y carga estado guardado
  document.addEventListener("DOMContentLoaded", async () => {
    // Referencias a elementos clave
    const headerEl = document.querySelector("header");
    const navLeft = document.querySelector(".nav-left");
    const navCenter = document.querySelector(".nav-center");
    const navRight = document.querySelector(".nav-right");
    const sections = document.querySelectorAll("section");
    const fichasBtn = document.getElementById("fichas-btn-container");
    const filtersContainer = document.querySelector(".filters-container");
    const toggleExport = document.getElementById("toggle-export");
    const exportMenu = document.getElementById("export-menu");
    const paginationControls = document.querySelector(".pagination-controls");
    // Referencia al botón de "Fichas sin Horarios"
    const btnFichasSinHorarios = document.querySelector(".btn-export");

    // 1) Ocultar todo al inicio
    if (headerEl) headerEl.style.display = "none";
    if (navLeft) navLeft.style.display = "none";
    if (navCenter) navCenter.style.display = "none";
    if (navRight) navRight.style.display = "none";
    if (fichasBtn) fichasBtn.style.display = "none";
    if (filtersContainer) filtersContainer.style.display = "none";
    if (toggleExport) toggleExport.disabled = true;
    if (exportMenu) exportMenu.classList.remove("open");
    if (paginationControls) paginationControls.style.display = "none";
    // Ocultar también el botón de "Fichas sin Horarios"
    if (btnFichasSinHorarios) btnFichasSinHorarios.style.display = "none";
    sections.forEach((s) => (s.style.display = "none"));

    // 2) Forzar selector de sede
    await seleccionarSedeInicial();

    // 3) Mostrar todo tras elegir sede
    if (headerEl) headerEl.style.display = "";
    if (navLeft) navLeft.style.display = "flex";
    if (navCenter) navCenter.style.display = "";
    if (navRight) navRight.style.display = "";
    if (fichasBtn) fichasBtn.style.display = "block";
    if (filtersContainer) filtersContainer.style.display = "flex";
    if (paginationControls) paginationControls.style.display = "flex";
    sections.forEach((s) => (s.style.display = ""));

    if (toggleExport) toggleExport.disabled = false;

    // 4) Inicializar turno y navegación
    renderShift("morning");

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const activeBtn = document.querySelector(".nav-btn.active");
        if (activeBtn) activeBtn.classList.remove("active");
        btn.classList.add("active");

        const activeSection = document.querySelector("section.active");
        if (activeSection) activeSection.classList.remove("active");

        const targetSection = document.getElementById(btn.dataset.target);
        if (targetSection) {
          targetSection.classList.add("active");
          renderShift(btn.dataset.target);
        }
      });
    });

    loadState();
  });

  // 3) Toggle del menú de exportar
  const toggleBtn = document.getElementById("toggle-export");
  const exportMenu = document.getElementById("export-menu");

  toggleBtn.addEventListener("click", () => {
    exportMenu.classList.toggle("open");
    toggleBtn.classList.toggle("open"); // Esto es lo que hace que la flecha gire
  });

  // 4) En obtenerFichasSinHorarios, revisa selectedSede y oculta el contenedor si no hay
  function obtenerFichasSinHorarios() {
    if (!selectedSede) {
      Swal.fire("Error", "Debes seleccionar una sede primero", "error");
      return;
    }
    // el contenedor ya está visible solo tras elegir sede
  }

  // Lista de ambientes disponibles para seleccionar
  const ambientes = ["Convencional", "Especializado", "Taller", "Laboratorio"];

  // Configuración común para SweetAlert
  const sweetAlertConfig = {
    background: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    confirmButtonColor: "#1e7e34",
  };

  // Función para aplicar estilo común a todas las ventanas de SweetAlert
  function insertarLogo() {
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

  // Función para mostrar errores
  function mostrarError(titulo, mensaje) {
    Swal.fire({
      icon: "error",
      title: titulo,
      text: mensaje,
      ...sweetAlertConfig,
      didOpen: insertarLogo,
    });
    console.error("Detalle del error:", mensaje);
  }

  // Función para obtener fichas sin horarios con filtros
  function obtenerFichasSinHorarios() {
    if (!selectedSede) {
      Swal.fire(
        "Error",
        "No hay sede seleccionada. Recarga la página.",
        "error"
      );
      return;
    }
    // Pedir sólo la jornada
    fetch("/obtener_jornadas")
      .then((r) => r.json())
      .then((jornadas) => {
        const opts = jornadas
          .map((j) => `<option value="${j}">${j}</option>`)
          .join("");
        return Swal.fire({
          title: "Seleccionar Jornada",
          html: `<select id="jornada-select" class="swal2-select">
                     <option value="">Jornada</option>
                     ${opts}
                   </select>`,
          confirmButtonText: "Buscar",
          ...sweetAlertConfig,
          didOpen: insertarLogo,
          preConfirm: () => document.getElementById("jornada-select").value,
        });
      })
      .then((res) => {
        if (res.isConfirmed) {
          const jornada = res.value;
          buscarFichasSinHorarios(selectedSede.id, jornada);
        }
      })
      .catch((err) => mostrarError("Error al obtener jornadas", err.message));
  }

  // Función para seleccionar jornada
  function seleccionarJornada(sedeSeleccionada) {
    fetch("/obtener_jornadas")
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            body.error || `HTTP ${response.status} ${response.statusText}`
          );
        }
        return body;
      })
      .then((jornadas) => {
        // Crear el HTML para seleccionar jornada
        const opcionesJornadas = jornadas
          .map((jornada) => `<option value="${jornada}">${jornada}</option>`)
          .join("");

        // Mostrar el formulario para seleccionar la jornada
        Swal.fire({
          title: "Seleccionar Jornada",
          html: `
                        <div class="form-group">
                            <label for="jornada-select">Jornada:</label>
                            <select id="jornada-select" class="swal2-select">
                                <option value="">Todas las jornadas</option>
                                ${opcionesJornadas}
                            </select>
                        </div>
                    `,
          confirmButtonText: "Continuar",
          ...sweetAlertConfig,
          didOpen: insertarLogo,
          preConfirm: () => {
            return document.getElementById("jornada-select").value;
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const jornadaSeleccionada = result.value;
            seleccionarTrimestre(sedeSeleccionada, jornadaSeleccionada);
          }
        });
      })
      .catch((error) => {
        mostrarError("Error al obtener jornadas", error.message);
      });
  }

  // Función para buscar fichas sin horarios según los filtros
  function buscarFichasSinHorarios(sedeId, jornada) {
    if (!sedeId) {
      Swal.fire("Error", "Debes seleccionar una sede primero", "error");
      return;
    }
    const params = new URLSearchParams();
    // enviamos el id de la sede bajo el parámetro 'sede'
    params.append("sede", sedeId);
    if (jornada) params.append("jornada", jornada);

    fetch(`/fichas_sin_horarios?${params.toString()}`)
      .then(async (r) => {
        const body = await r.json().catch(() => []);
        if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
        return body;
      })
      .then((fichas) => {
        if (!fichas.length) {
          Swal.fire({
            title: "Fichas sin Horarios",
            html: "<p>No hay fichas sin horarios asociados para los filtros seleccionados.</p>",
            width: 600,
            confirmButtonText: "Cerrar",
            ...sweetAlertConfig,
            didOpen: insertarLogo,
          });
          return;
        }

        // Construyo la tabla y el buscador igual que antes
        const listaItems = fichas
          .map(
            (f) =>
              `<tr data-ficha="${f.numero_ficha}" class="ficha-row">
               <td>${f.numero_ficha}</td>
               <td>${f.nombre_programa}</td>
               <td>${f.jornada}</td>
             </tr>`
          )
          .join("");

        const contenidoHTML = `
            <div style="margin-bottom: 15px;">
              <input type="text" id="buscador-fichas" class="swal2-input" 
                     placeholder="Buscar por número o nombre..." 
                     style="width: 100%; margin: 10px auto;">
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #39A900; color: white;">
                    <th style="padding: 8px; text-align: left;">Ficha</th>
                    <th style="padding: 8px; text-align: left;">Programa</th>
                    <th style="padding: 8px; text-align: left;">Jornada</th>
                  </tr>
                </thead>
                <tbody id="tabla-fichas">
                  ${listaItems}
                </tbody>
              </table>
            </div>
            <div id="mensaje-no-resultados" style="display: none; text-align: center; margin-top: 15px;">
              No se encontraron fichas con ese criterio de búsqueda.
            </div>
          `;

        Swal.fire({
          title: "Fichas sin Horarios",
          html: contenidoHTML,
          width: 700,
          confirmButtonText: "Cerrar",
          ...sweetAlertConfig,
          didOpen: () => {
            insertarLogo();

            const buscador = document.getElementById("buscador-fichas");
            const tabla = document.getElementById("tabla-fichas");
            const mensajeNoResultados = document.getElementById(
              "mensaje-no-resultados"
            );

            buscador.addEventListener("keyup", () => {
              const valor = buscador.value.toLowerCase();
              let hayResultados = false;

              tabla.querySelectorAll("tr.ficha-row").forEach((fila) => {
                const numero = fila.cells[0].textContent.toLowerCase();
                const programa = fila.cells[1].textContent.toLowerCase();

                if (numero.includes(valor) || programa.includes(valor)) {
                  fila.style.display = "";
                  hayResultados = true;
                } else {
                  fila.style.display = "none";
                }
              });

              mensajeNoResultados.style.display = hayResultados
                ? "none"
                : "block";
            });

            // reaplico estilos y eventos de fila
            tabla.querySelectorAll("tr.ficha-row").forEach((fila, idx) => {
              fila.style.backgroundColor = idx % 2 === 0 ? "#f2f2f2" : "white";
              fila.querySelectorAll("td").forEach((c) => {
                c.style.padding = "8px";
                c.style.borderBottom = "1px solid #ddd";
              });
              fila.addEventListener(
                "mouseenter",
                () => (fila.style.backgroundColor = "#d9f2e6")
              );
              fila.addEventListener("mouseleave", () => {
                fila.style.backgroundColor =
                  idx % 2 === 0 ? "#f2f2e2" : "white";
              });
              fila.addEventListener("click", () => {
                console.log(`Ficha seleccionada: ${fila.dataset.ficha}`);
              });
            });
          },
        });
      })
      .catch((err) => mostrarError("Error al obtener fichas", err.message));
  }

  // Exportar la función para que sea accesible desde el HTML
  window.obtenerFichasSinHorarios = obtenerFichasSinHorarios;

  // Horarios y días para cada turno
  const shifts = {
    morning: {
      hours: [
        "6:00–7:00",
        "7:00–8:00",
        "8:00–9:00",
        "9:00–10:00",
        "10:00–11:00",
        "11:00–12:00",
      ],
      days: ["Lun", "Mar", "Mié", "Jue", "Vie"],
    },
    afternoon: {
      hours: [
        "12:00–13:00",
        "13:00–14:00",
        "14:00–15:00",
        "15:00–16:00",
        "16:00–17:00",
        "17:00–18:00",
      ],
      days: ["Lun", "Mar", "Mié", "Jue", "Vie"],
    },
    night: {
      // Horas originales (18–22) solo para Lun–Vie
      hours: ["18:00–19:00", "19:00–20:00", "20:00–21:00", "21:00–22:00"],
      days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    },
  };
  const ROW_HEIGHT = +getComputedStyle(
    document.documentElement
  ).getPropertyValue("--row-height");
  let slotCounter = 0,
    currentSlot = null,
    isResizing = false,
    startY,
    startH,
    rendered = new Set();

  // Crea un placeholder al arrastrar sobre celda vacía
  function showPlaceholder(cell) {
    if (!cell.querySelector(".placeholder")) {
      const ph = document.createElement("div");
      ph.className = "placeholder";
      cell.appendChild(ph);
    }
  }
  // Elimina placeholder cuando sales de la celda
  function removePlaceholder(cell) {
    const ph = cell.querySelector(".placeholder");
    if (ph) ph.remove();
  }
  // Agita el bloque para indicar error (por ejemplo, al mover a celda ocupada)
  function flash(el) {
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 300);
  }
  // Adjunta eventos dragstart, dragend, contextmenu y resize a un bloque
  function attachEvents(slot) {
    slot.draggable = true;
    slot.setAttribute("aria-grabbed", "false");

    slot.addEventListener("dragstart", (e) => {
      const mode = e.ctrlKey ? "copy" : "move"; // Cambio de altKey a ctrlKey
      e.dataTransfer.setData("text/plain", mode + ":" + slot.id);
      slot.setAttribute("aria-grabbed", "true");
    });

    slot.addEventListener("dragend", () => {
      slot.setAttribute("aria-grabbed", "false");
    });

    slot.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openForm(slot);
    });

    // Redimensionamiento: mousedown en la manija
    slot.querySelector(".handle").addEventListener("mousedown", (e) => {
      e.stopPropagation();
      currentSlot = slot;
      isResizing = true;
      startY = e.clientY;
      startH = parseInt(getComputedStyle(slot).height);
      slot.classList.add("resizing");
    });
    // Al hacer clic sencillo, abrimos el modal de info
    slot.addEventListener("click", (e) => {
      e.stopPropagation(); // no interferir con drag
      const data = {
        ficha: slot.id,
        numero: slot.querySelector(".slot-title").textContent,
        programa:
          slot.getAttribute("data-programa") ||
          slot.querySelector(".slot-title").textContent,
        instructor: slot
          .querySelector(".slot-instructor")
          .textContent.replace("Instructor: ", ""),
        ambiente: slot.querySelector(".slot-ambiente").textContent,
        competencia: slot.getAttribute("data-competencia") || "—",
        raps: JSON.parse(slot.getAttribute("data-raps") || "[]"),
      };
      openInfoModal(data);
    });
  }

  // Crea un nuevo bloque usando el template hidden
  // Unique color assignment for slots
  /**
   * Genera un nuevo hue (0–359) usando el ángulo dorado
   * para maximizar la distancia entre tonos sucesivos.
   */
  function getDistinctHue() {
    const goldenAngle = 137.508; // ángulo dorado en grados
    const hue = Math.round((hueCounter * goldenAngle) % 360);
    hueCounter++;
    return hue;
  }

  function createSlot(sig, instr, amb) {
    const tpl = document.getElementById("slot-template");
    const slot = tpl.content.firstElementChild.cloneNode(true);
    slot.id = `slot-${slotCounter++}`;
    slot.querySelector(".slot-title").textContent = sig;
    slot.querySelector(".slot-instructor").textContent = "Instructor: " + instr;
    slot.querySelector(".slot-ambiente").textContent = amb;

    // En lugar de getUniqueHue()
    const hue = getDistinctHue();
    slot.style.background = `hsl(${hue},60%,50%)`;

    // Eventos y actualizaciones
    attachEvents(slot);
    construirLeyendas();
    saveState();

    return slot;
  }

  // Maneja drop en una celda: mover o clonar bloque
  function handleDrop(e, cell) {
    e.preventDefault();
    removePlaceholder(cell);
    const [mode, id] = e.dataTransfer.getData("text/plain").split(":");
    const orig = document.getElementById(id);
    if (mode === "move") {
      if (cell.querySelector(".time-slot")) {
        flash(orig);
        return;
      }
      cell.appendChild(orig);
    } else {
      const clone = orig.cloneNode(true);
      clone.id = `slot-${slotCounter++}`;
      attachEvents(clone);
      cell.appendChild(clone);
    }
    saveState();
    construirLeyendas();
  }
  // Guarda estado actual (posición y tamaño de bloques) en localStorage
  function saveState() {
    const arr = [];
    document.querySelectorAll(".time-slot").forEach((s) => {
      arr.push({
        id: s.id,
        parent: s.parentElement.dataset.pos,
        height: s.style.height,
        sig: s.querySelector(".slot-title").textContent,
        instr: s.querySelector(".slot-instructor").textContent,
        amb: s.querySelector(".slot-ambiente").textContent,
      });
    });
    localStorage.setItem("horario-data", JSON.stringify(arr));
  }
  // Carga estado guardado y reconstituye bloques
  function loadState() {
    JSON.parse(localStorage.getItem("horario-data") || "[]").forEach((d) => {
      const slot = document.getElementById(d.id);
      const cell = document.querySelector(`.cell[data-pos="${d.parent}"]`);
      if (slot && cell) {
        cell.appendChild(slot);
        slot.style.height = d.height;
        slot.querySelector(".slot-title").textContent = d.sig;
        slot.querySelector(".slot-instructor").textContent = d.instr;
        slot.querySelector(".slot-ambiente").textContent = d.amb;
      }
    });
  }
  // Abre modal para crear/editar bloque
  // Modificación al código JavaScript existente para cargar ambientes por tipo

  // Función para cargar ambientes según el tipo seleccionado
  function cargarAmbientesPorTipo(tipoAmbiente) {
    return fetch(`/obtener_ambientes?tipo=${tipoAmbiente}`).then(
      async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            body.error || `HTTP ${response.status} ${response.statusText}`
          );
        }
        return body;
      }
    );
  }

  // Modificación para la función openForm para agregar la carga dinámica de ambientes
  function openForm(slot, cell) {
    currentSlot = slot;
    // Obtener valores previos
    const prevSig = slot ? slot.querySelector(".slot-title").textContent : "";
    const prevInstr = slot
      ? slot
          .querySelector(".slot-instructor")
          .textContent.replace("Instructor: ", "")
      : "";
    const prevAmb = slot
      ? slot.querySelector(".slot-ambiente").textContent
      : "";

    // HTML para el formulario inicial (con selección de tipo de ambiente)
    const formHTML = `
            <input id="swal-sigla" class="swal2-input" placeholder="Sigla" value="${prevSig}">
            <input id="swal-instr" class="swal2-input" placeholder="Instructor" value="${prevInstr}">
            <div class="form-group">
                <div style="text-align: center; margin-bottom: 5px; margin-top: 10px;" >
                    Tipo de Ambiente:
                </div>
                <select id="swal-tipo-amb" class="swal2-select">
                    <option value="">Seleccionar Tipo</option>
                    <option value="0">Convencional</option>
                    <option value="1">Especializado</option>
                    <option value="2">Taller</option>
                    <option value="3">Laboratorio</option>
                </select>
            </div>
            <div class="form-group">
                <div style="text-align: center; margin-bottom: 5px; margin-top: 10px;">
                    Ambiente:
                </div>
                <select id="swal-amb" class="swal2-select">
                    <option value="">Seleccione un tipo primero</option>
                </select>
            </div>
        `;

    Swal.fire({
      title: "Editar Bloque",
      html: formHTML,
      showCloseButton: true,
      focusConfirm: false,
      preConfirm: () => {
        const sig = document.getElementById("swal-sigla").value.trim();
        const instr = document.getElementById("swal-instr").value.trim();
        const amb = document.getElementById("swal-amb").value;
        if (!sig) {
          Swal.showValidationMessage("La sigla es obligatoria");
          return false;
        }
        // if (!amb) {
        //     Swal.showValidationMessage('Debe seleccionar un ambiente');
        //     return false;
        // }
        return { sig, instr, amb };
      },
      ...sweetAlertConfig,
      didOpen: (popup) => {
        insertarLogo();

        // Obtener el select de tipo de ambiente y el select de ambiente
        const tipoAmbSelect = document.getElementById("swal-tipo-amb");
        const ambSelect = document.getElementById("swal-amb");

        // Evento para cargar ambientes cuando se selecciona un tipo
        tipoAmbSelect.addEventListener("change", () => {
          const tipoSeleccionado = tipoAmbSelect.value;

          if (!tipoSeleccionado) {
            // Si no hay tipo seleccionado, vaciar el select de ambientes
            ambSelect.innerHTML =
              '<option value="">Seleccione un tipo primero</option>';
            return;
          }

          // Mostrar indicador de carga
          ambSelect.innerHTML = '<option value="">Cargando...</option>';

          // Cargar ambientes según el tipo seleccionado
          cargarAmbientesPorTipo(tipoSeleccionado)
            .then((ambientes) => {
              if (ambientes.length === 0) {
                ambSelect.innerHTML =
                  '<option value="">No hay ambientes disponibles</option>';
                return;
              }

              // Llenar el select con los ambientes obtenidos
              ambSelect.innerHTML =
                '<option value="">Seleccionar Ambiente</option>';
              ambientes.forEach((ambiente) => {
                const option = document.createElement("option");
                option.value = ambiente.nombre;
                option.textContent = ambiente.nombre;

                // Si coincide con el ambiente previo, seleccionarlo
                if (ambiente.nombre === prevAmb) {
                  option.selected = true;
                }

                ambSelect.appendChild(option);
              });
            })
            .catch((error) => {
              console.error("Error al cargar ambientes:", error);
              ambSelect.innerHTML =
                '<option value="">Error al cargar ambientes</option>';
            });
        });

        // Si ya hay un ambiente previo, intentar seleccionar el tipo adecuado
        if (prevAmb) {
          // Aquí podríamos hacer una consulta adicional para obtener el tipo del ambiente previo
          // Por simplicidad, simplemente dejamos que el usuario seleccione el tipo
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { sig, instr, amb } = result.value;
        if (currentSlot) {
          currentSlot.querySelector(".slot-title").textContent = sig;
          currentSlot.querySelector(".slot-instructor").textContent =
            "Instructor: " + instr;
          currentSlot.querySelector(".slot-ambiente").textContent = amb;
        } else {
          const free = document.querySelector(".cell:not(:has(.time-slot))");
          if (free) free.appendChild(createSlot(sig, instr, amb));
        }
        saveState();
        construirLeyendas();
      }
    });
  }
  // Cierra el modal sin guardar
  function closeForm() {
    document.getElementById("form-overlay").style.display = "none";
  }
  // Guarda datos del formulario y actualiza/crea bloque
  window.saveForm = () => {
    const sig = document.getElementById("f-sigla").value.trim();
    if (!sig) {
      alert("La sigla es obligatoria");
      return;
    }
    const instr = document.getElementById("f-instructor").value;
    const amb = document.getElementById("f-ambiente").value;
    if (currentSlot) {
      currentSlot.querySelector(".slot-title").textContent = sig;
      currentSlot.querySelector(".slot-instructor").textContent =
        "Instructor: " + instr;
      currentSlot.querySelector(".slot-ambiente").textContent = amb;
    } else {
      const free = document.querySelector(".cell:not(:has(.time-slot))");
      if (!free) {
        alert("No hay espacio libre");
        closeForm();
        return;
      }
      free.appendChild(createSlot(sig, instr, amb));
    }
    closeForm();
    saveState();
    construirLeyendas();
  };

  // Renderiza la tabla de un turno dado
  function renderGrid(container, hoursArr, daysArr, key, activeMap = null) {
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.setAttribute("role", "grid");
    grid.style.gridTemplateColumns = `150px repeat(${daysArr.length},1fr)`;

    // Cabeceras
    ["Hora", ...daysArr].forEach((txt) => {
      const h = document.createElement("div");
      h.className = "header";
      h.textContent = txt;
      grid.appendChild(h);
    });

    hoursArr.forEach((hr, r) => {
      const tcell = document.createElement("div");
      tcell.className = "time-cell";
      tcell.textContent = hr;
      grid.appendChild(tcell);

      daysArr.forEach((day, c) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.pos = `${key}-${r}-${c}`;

        const isActive = !activeMap || activeMap[day].includes(hr);
        if (isActive) {
          cell.addEventListener("dragover", (e) => {
            e.preventDefault();
            showPlaceholder(cell);
          });
          cell.addEventListener("dragleave", () => removePlaceholder(cell));
          cell.addEventListener("drop", (e) => handleDrop(e, cell));
          cell.addEventListener("click", () => openForm(null, cell));
        } else {
          cell.classList.add("disabled"); // Puedes estilizarla en CSS si quieres
        }

        grid.appendChild(cell);
      });
    });

    container.appendChild(grid);
  }

  function renderShift(id) {
    if (rendered.has(id)) return;
    rendered.add(id);
    const sec = document.getElementById(id);

    if (id === "night") {
      const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const hours = [
        "14:00–15:00",
        "15:00–16:00",
        "16:00–17:00",
        "17:00–18:00",
        "18:00–19:00",
        "19:00–20:00",
        "20:00–21:00",
        "21:00–22:00",
      ];

      // Mapa de activación por día
      const activeMap = {
        Lun: ["18:00–19:00", "19:00–20:00", "20:00–21:00", "21:00–22:00"],
        Mar: ["18:00–19:00", "19:00–20:00", "20:00–21:00", "21:00–22:00"],
        Mié: ["18:00–19:00", "19:00–20:00", "20:00–21:00", "21:00–22:00"],
        Jue: ["18:00–19:00", "19:00–20:00", "20:00–21:00", "21:00–22:00"],
        Vie: ["18:00–19:00", "19:00–20:00", "20:00–21:00", "21:00–22:00"],
        Sáb: hours, // todas activas
      };

      renderGrid(sec, hours, days, id, activeMap);
      return;
    }

    // Turnos normales
    const { hours, days } = shifts[id];
    renderGrid(sec, hours, days, id);
  }

  // Exportaciones usando librerías externas

  // Exportar como PDF
  window.descargarPDF = () =>
    html2pdf()
      .from(document.querySelector("section.active"))
      .set({
        margin: [10, 10, 10, 10],
        backgroundColor: "#ffffff",
        filename: `horario-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "png", quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: "pt", format: "a3", orientation: "landscape" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .save();

  // Exportar como CSV
  window.descargarCSV = () => {
    const g = document.querySelector("section.active .grid"),
      cells = Array.from(
        g.querySelectorAll("div.header,div.time-cell,div.cell")
      ),
      cols = g.style.gridTemplateColumns.split(" ").length,
      rows = [];

    for (let i = 0; i < cells.length; i += cols) {
      rows.push(
        cells
          .slice(i, i + cols)
          .map(
            (c) =>
              '"' +
              (
                c.querySelector(".slot-title")?.textContent ||
                c.textContent.trim()
              ).replace(/"/g, '""') +
              '"'
          )
          .join(",")
      );
    }

    const blob = new Blob([rows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      }),
      link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "horario.csv";
    link.click();
  };

  // Exportar como Excel
  window.descargarExcel = () => {
    const g = document.querySelector("section.active .grid"),
      cells = Array.from(
        g.querySelectorAll("div.header,div.time-cell,div.cell")
      ),
      cols = g.style.gridTemplateColumns.split(" ").length,
      data = [];

    for (let i = 0; i < cells.length; i += cols) {
      data.push(
        cells
          .slice(i, i + cols)
          .map(
            (c) =>
              c.querySelector(".slot-title")?.textContent ||
              c.textContent.trim()
          )
      );
    }

    const wb = XLSX.utils.book_new(),
      ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Horario");
    XLSX.writeFile(wb, "horario.xlsx");
  };

  // Exportar como Resumen (TXT)
  window.descargarResumen = () => {
    const slots = Array.from(
        document.querySelectorAll("section.active .time-slot")
      ),
      lines = slots.map((s) => {
        const t = s.querySelector(".slot-title").textContent,
          instr = s
            .querySelector(".slot-instructor")
            .textContent.replace("Instructor: ", ""),
          amb = s.querySelector(".slot-ambiente").textContent,
          time = s.closest(".cell").previousElementSibling.textContent.trim();
        return `${t} - ${instr} - ${time} en ${amb}`;
      });

    const blob = new Blob([lines.join("\n")], {
        type: "text/plain;charset=utf-8;",
      }),
      link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resumen.txt";
    link.click();
  };
})();

function openInfoModal(data) {
  // Combina número y nombre en el título de ficha
  const fichaEl = document.getElementById("info-ficha");
  fichaEl.textContent = `Ficha: ${data.numero} - ${data.ficha}`;
  document.getElementById("info-instructor").textContent = data.instructor;
  document.getElementById("info-ambiente").textContent = data.ambiente;
  document.getElementById("info-competencia").textContent = data.competencia;
  const rapsContainer = document.getElementById("info-raps");
  rapsContainer.innerHTML = "";
  (data.raps || []).forEach((rap) => {
    const p = document.createElement("p");
    p.textContent = `• ${rap}`;
    rapsContainer.appendChild(p);
  });
  document.getElementById("info-overlay").style.display = "flex";
}

function closeInfoModal() {
  document.getElementById("info-overlay").style.display = "none";
}

function poblarFiltros(data) {
  const comp = document.getElementById("filter-competencias");
  const res = document.getElementById("filter-resultados");
  const inst = document.getElementById("filter-instructor");

  // Ejemplo: data.competencias = ['Corte', 'Cocción', 'Higiene']
  data.competencias.forEach((c) => {
    let o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    comp.appendChild(o);
  });
  // Similar para resultados e instructor...
}

document.getElementById("view-summary").addEventListener("click", () => {
  // Lógica para mostrar el resumen filtrado
  mostrarResumenConFiltros(comp.value, res.value, inst.value);
});

// Obtén referencias
const summaryOverlay = document.getElementById("summary-overlay");
const summaryCompet = document.getElementById("summary-competencias");
const summaryRaps = document.getElementById("summary-raps");
const summaryInst = document.getElementById("summary-instructores");
const viewSummaryBtn = document.getElementById("view-summary");
const assignBtn = document.getElementById("assign-btn");

// Función para rellenar y mostrar modal
function mostrarResumenConFiltros(compVal, rapVal, instVal) {
  // Limpia listas
  [summaryCompet, summaryRaps, summaryInst].forEach(
    (ul) => (ul.innerHTML = "")
  );

  // Ejemplo: valores separados por comas (ajusta según tus datos reales)
  compVal.split(",").forEach((c) => {
    if (c.trim()) summaryCompet.innerHTML += `<li>${c.trim()}</li>`;
  });
  rapVal.split(",").forEach((r) => {
    if (r.trim()) summaryRaps.innerHTML += `<li>${r.trim()}</li>`;
  });
  instVal.split(",").forEach((i) => {
    if (i.trim()) summaryInst.innerHTML += `<li>${i.trim()}</li>`;
  });

  // Muestra modal
  summaryOverlay.style.display = "flex";
  summaryOverlay.setAttribute("aria-hidden", "false");
}

// Cierra modal al hacer clic fuera de él
summaryOverlay.addEventListener("click", (e) => {
  if (e.target === summaryOverlay) closeResumen();
});

// Handler del botón Ver resumen
viewSummaryBtn.addEventListener("click", () => {
  mostrarResumenConFiltros(
    document.getElementById("filter-competencias").value,
    document.getElementById("filter-resultados").value,
    document.getElementById("filter-instructor").value
  );
  construirLeyendas();
});

// Función para cerrar
function closeResumen() {
  summaryOverlay.style.display = "none";
  summaryOverlay.setAttribute("aria-hidden", "true");
}

// Handler de "Asignar"
assignBtn.addEventListener("click", () => {
  // Aquí tu lógica de asignación...
  console.log("Asignando con:", {
    competencias: summaryCompet.innerText,
    raps: summaryRaps.innerText,
    instructores: summaryInst.innerText,
  });
  closeResumen();
  construirLeyendas();
});

// Función para construir leyendas de colores
// Esta función recorre cada sección (turno) y genera leyendas
// basadas en los colores de fondo de los bloques de horarios

document.addEventListener("DOMContentLoaded", () => {
  construirLeyendas(); // al cargar la página
});

function construirLeyendas() {
  ["morning", "afternoon", "night"].forEach((shiftId) => {
    const section = document.getElementById(shiftId);
    if (!section) return;
    const legendContainer = section.querySelector(".legend-container");
    if (!legendContainer) {
      console.warn(`No encontré legend-container en ${shiftId}`);
      return;
    }
    legendContainer.innerHTML = ""; // limpia leyenda previa

    const mapInstColor = {};

    // Encuentra todos los slots dentro de este turno
    const slots = section.querySelectorAll(".time-slot");
    slots.forEach((slot) => {
      // el texto del instructor
      const instructor = slot
        .querySelector(".slot-instructor")
        ?.innerText.trim();
      if (!instructor) return; // salta si está vacío

      // color: inline si existe, o CSS computado
      const inline = slot.style.backgroundColor;
      const bg = inline || getComputedStyle(slot).backgroundColor;

      // asigna si no existía antes
      if (!mapInstColor[instructor]) {
        mapInstColor[instructor] = bg;
      }
    });

    // crea los ítems
    Object.entries(mapInstColor).forEach(([inst, color]) => {
      const item = document.createElement("div");
      item.className = "legend-item";

      const swatch = document.createElement("div");
      swatch.className = "legend-color";
      swatch.style.backgroundColor = color;

      const label = document.createElement("span");
      label.innerText = inst;

      item.append(swatch, label);
      legendContainer.appendChild(item);
    });

    // Si no hay items, opcionalmente muestra un mensaje
    if (Object.keys(mapInstColor).length === 0) {
      legendContainer.innerHTML = "<em>No hay bloques asignados aún</em>";
    }
  });
}

// FUNCIÓN PARA CAMBIAR ENTRE TURNOS
// Esta función permite navegar entre los turnos (morning, afternoon, night)
document.addEventListener("DOMContentLoaded", () => {
  const shifts = ["morning", "afternoon", "night"];
  let idx = 0;

  const updateShift = (newIdx) => {
    // actualizar sección visible
    document.querySelector(`.nav-btn.active`).classList.remove("active");
    document.querySelector(`section.shift.active`).classList.remove("active");

    idx = (newIdx + shifts.length) % shifts.length; // wrap-around
    const target = shifts[idx];

    document
      .querySelector(`.nav-btn[data-target="${target}"]`)
      .classList.add("active");
    document.getElementById(target).classList.add("active");
  };

  document.getElementById("next-btn").addEventListener("click", () => {
    updateShift(idx + 1);
  });

  document.getElementById("prev-btn").addEventListener("click", () => {
    updateShift(idx - 1);
  });
});

// Ejemplo: si tus slots cambian tras una llamada AJAX o interacción,
// vuelve a ejecutar:
// construirLeyendas();
