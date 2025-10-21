// registrarAprendiz.js

const fileInput = document.getElementById('file-input');
const fileSelected = document.getElementById('file-selected');

// Mostrar el nombre del archivo seleccionado
fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files.length > 0) {
    fileSelected.textContent = fileInput.files[0].name;
  } else {
    fileSelected.textContent = 'Sin archivos seleccionados';
  }
});

// Enviar el archivo vía AJAX
document.getElementById('upload-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Debes seleccionar un archivo.",
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

  const formData = new FormData();
  formData.append('excel_file', file);

  fetch('/subir_excel_ajax', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    Swal.fire({
      icon: data.status === 'success' ? 'success' : 'error',
      title: data.status.charAt(0).toUpperCase() + data.status.slice(1),
      text: data.message,
      confirmButtonColor: '#218838',
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
  .catch(err => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Hubo un problema con la conexión.",
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
    console.error(err);
  });
});
