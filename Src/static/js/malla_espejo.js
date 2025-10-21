function duplicarFila(boton) {
  // 1) Obtén la fila (tr) donde hiciste clic
  const row = boton.closest('tr');

  // 2) Extrae datos de la fila original.
  //    Según tu HTML, las celdas son:
  //    0: id_malla
  //    1: Ficha
  //    2: Programa
  //    3: Jornada
  //    4: Horas Trimestre (330/286/308)
  const original_id_malla = row.cells[0].innerText.trim();
  // const original_ficha    = row.cells[1].innerText.trim(); // si lo necesitas
  // const original_programa = row.cells[2].innerText.trim(); // si lo necesitas

  // 3) Obtén los valores de la "Ficha Seleccionada" que aparecen arriba (recuadro verde),
  //    usando los inputs ocultos que agregaste en la plantilla.
  const newFicha     = document.getElementById('fichaSeleccionadaNumero')?.value;
  const newPrograma  = document.getElementById('fichaSeleccionadaPrograma')?.value;

  // Verifica que existan
  if (!newFicha || !newPrograma) {
    Swal.fire({
      icon: 'warning',
      title: 'Atención',
      text: 'No se encontró la ficha o el programa de destino.',
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

  // 4) Haz la llamada al endpoint que duplicará la malla en la base de datos.
  fetch('/duplicar_malla', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original_malla_id: original_id_malla,
      numeroFicha: newFicha,
      nuevoPrograma: newPrograma
    })
  })
  .then(resp => resp.json())
  .then(data => {
    if (data.success) {
      // Malla duplicada con éxito
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Malla duplicada con éxito',
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
      }).then(() => {
        // Puedes recargar la página para ver la nueva malla, o realizar otra acción
        location.reload();
      });
    } else {
      // Error al duplicar malla
      Swal.fire({
        icon: 'error',
        title: 'Error al duplicar malla',
        text: data.message || 'Desconocido',
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
    }
  })
  .catch(err => {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo contactar al servidor.',
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


// Por ejemplo, si decides hacer un POST al servidor para marcar que se ha autorizado el acceso:
fetch('/autorizar_espejo', { method: 'POST', credentials: 'include' })
  .then(resp => resp.json())
  .then(data => {
    if (data.success) {
      window.location.href = '/malla_espejo';
    } else {
      Swal.fire({
        icon: 'error',
        title: 'No autorizado',
        text: 'No se cuenta con los permisos necesarios.',
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
    }
  });

  