// document.addEventListener('DOMContentLoaded', function() {
//   const mainForm = document.getElementById('mainForm');
  
//   if (mainForm) {
//     mainForm.addEventListener('submit', function(e) {
//       e.preventDefault(); // Prevenir el envío inmediato para realizar la verificación
      
//       const fechaInicio = document.getElementById('fechaInicio').value;
//       const fechaFin = document.getElementById('fechaFin').value;
//       const inicio = new Date(fechaInicio);
//       const fin = new Date(fechaFin);
      
//       // Validar que la fecha fin sea mayor a la fecha inicio
//       if (fin <= inicio) {
//         Swal.fire({
//           icon: 'error',
//           title: 'Fechas incorrectas',
//           text: 'La fecha fin debe ser mayor que la fecha inicio.',
//           background: "#fff",
//           backdrop: "rgba(0,0,0,0.4)",
//           didOpen: () => {
//               const popup = Swal.getPopup(); 
//               const logo = document.createElement("img");
//               logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
              
//               // Estilos para el logo
//               Object.assign(logo.style, {
//                   position: "absolute",
//                   top: "50%",
//                   left: "50%",
//                   transform: "translate(-50%, -50%)",
//                   opacity: "0.2",
//                   width: "220px",
//                   pointerEvents: "none",
//                   zIndex: "0"
//               });
              
//               // Insertar el logo
//               popup.insertBefore(logo, popup.firstChild);
              
//               // Asegurar que contenido esté por encima
//               popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
//                   .forEach(el => el.style.zIndex = "1");
              
//               // Específicamente para el icono de success
//               const successIcon = popup.querySelector(".swal2-icon.swal2-success");
//               if (successIcon) {
//                   // Hacer transparente el fondo circular blanco del icono success
//                   const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
//                   circularLines.forEach(el => {
//                       el.style.backgroundColor = "transparent";
//                   });
                  
//                   // También hacer transparente el fix que SweetAlert2 usa
//                   const successFix = popup.querySelector(".swal2-success-fix");
//                   if (successFix) {
//                       successFix.style.backgroundColor = "transparent";
//                   }
                  
//                   // Asegurar que el anillo y la marca de verificación sean visibles
//                   const successRing = popup.querySelector(".swal2-success-ring");
//                   if (successRing) {
//                       successRing.style.zIndex = "1";
//                   }
                  
//                   const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
//                   successLines.forEach(el => {
//                       el.style.zIndex = "2";
//                   });
//               }
//           }
//         });
//         return;
//       }
      
//       // Obtener el trimestre seleccionado
//       const trimestre = document.getElementById('trimestres').value;
      
//       // Llamada AJAX al endpoint /check_duplicates
//       fetch(`/check_duplicates?trimestre=${trimestre}&fechaInicio=${fechaInicio}`)
//         .then(response => response.json())
//         .then(data => {
//           if (data.duplicate) {
//             // Si hay duplicados, se muestra el SweetAlert
//             Swal.fire({
//               icon: 'error',
//               title: `Registro duplicado en el trimestre ${data.trimestre}`,
//               html: `Ya existen registros para las siguientes fichas: <strong>${data.duplicate_fichas}</strong>`,
//               confirmButtonText: 'Aceptar',
//               confirmButtonColor: '#218838',
//               background: "#fff",
//               backdrop: "rgba(0,0,0,0.4)",
//               didOpen: () => {
//                   const popup = Swal.getPopup(); 
//                   const logo = document.createElement("img");
//                   logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
                  
//                   // Estilos para el logo
//                   Object.assign(logo.style, {
//                       position: "absolute",
//                       top: "50%",
//                       left: "50%",
//                       transform: "translate(-50%, -50%)",
//                       opacity: "0.2",
//                       width: "220px",
//                       pointerEvents: "none",
//                       zIndex: "0"
//                   });
                  
//                   // Insertar el logo
//                   popup.insertBefore(logo, popup.firstChild);
                  
//                   // Asegurar que contenido esté por encima
//                   popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
//                       .forEach(el => el.style.zIndex = "1");
                  
//                   // Específicamente para el icono de success
//                   const successIcon = popup.querySelector(".swal2-icon.swal2-success");
//                   if (successIcon) {
//                       // Hacer transparente el fondo circular blanco del icono success
//                       const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
//                       circularLines.forEach(el => {
//                           el.style.backgroundColor = "transparent";
//                       });
                      
//                       // También hacer transparente el fix que SweetAlert2 usa
//                       const successFix = popup.querySelector(".swal2-success-fix");
//                       if (successFix) {
//                           successFix.style.backgroundColor = "transparent";
//                       }
                      
//                       // Asegurar que el anillo y la marca de verificación sean visibles
//                       const successRing = popup.querySelector(".swal2-success-ring");
//                       if (successRing) {
//                           successRing.style.zIndex = "1";
//                       }
                      
//                       const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
//                       successLines.forEach(el => {
//                           el.style.zIndex = "2";
//                       });
//                   }
//               }
//             });
//           } else {
//             // Si no hay duplicados, se envía el formulario
//             mainForm.submit();
//           }
//         })
//         .catch(error => {
//           console.error('Error al verificar duplicados:', error);
//           // Si ocurre un error en la verificación, se puede optar por enviar el formulario o mostrar un mensaje
//           mainForm.submit();
//         });
//     });
//   }
  
//   // Mostrar el modal si se definieron las variables globales para fichas en oferta 1
//   if (window.modalHTML && window.modalData) {
//     const selectedTrimestre = window.modalData.selectedTrimestre;
//     const mainFechaInicio = new Date(window.modalData.mainFechaInicioStr);
    
//     Swal.fire({
//       title: 'Confirmar Fechas para las Fichas Cerradas',
//       html: window.modalHTML,
//       width: '1200px',
//       showCancelButton: true,
//       confirmButtonText: 'Guardar',
//       confirmButtonColor: '#1e7e34',
//       cancelButtonText: 'Cancelar',
//       preConfirm: () => {
//         const rows = document.querySelectorAll("#confirmForm tbody tr");
//         for (let row of rows) {
//           const startInput = row.querySelector("input[name='fecha_inicio[]']");
//           const endInput = row.querySelector("input[name='fecha_fin[]']");
//           if (startInput && endInput) {
//             const startDate = new Date(startInput.value);
//             const endDate = new Date(endInput.value);
//             if (endDate <= startDate) {
//               Swal.showValidationMessage("La fecha fin debe ser mayor que la fecha inicio en todas las filas.");
//               return false;
//             }
//             if (selectedTrimestre === "1" && startDate < mainFechaInicio) {
//               Swal.showValidationMessage("Para el Trimestre 1, la fecha inicio de las fichas en oferta 1 no puede ser anterior a la fecha inicio de las fichas en oferta 0.");
//               return false;
//             }
//           }
//         }
//         document.getElementById('confirmForm').submit();
//       },
//       background: "#fff",
//       backdrop: "rgba(0,0,0,0.4)",
//       didOpen: () => {
//           const popup = Swal.getPopup(); 
//           const logo = document.createElement("img");
//           logo.src = "../../static/img/logo-sena-verde-png-sin-fondo.webp";
          
//           // Estilos para el logo
//           Object.assign(logo.style, {
//               position: "absolute",
//               top: "50%",
//               left: "50%",
//               transform: "translate(-50%, -50%)",
//               opacity: "0.2",
//               width: "220px",
//               pointerEvents: "none",
//               zIndex: "0"
//           });
          
//           // Insertar el logo
//           popup.insertBefore(logo, popup.firstChild);
          
//           // Asegurar que contenido esté por encima
//           popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
//               .forEach(el => el.style.zIndex = "1");
          
//           // Específicamente para el icono de success
//           const successIcon = popup.querySelector(".swal2-icon.swal2-success");
//           if (successIcon) {
//               // Hacer transparente el fondo circular blanco del icono success
//               const circularLines = popup.querySelectorAll(".swal2-success-circular-line-left, .swal2-success-circular-line-right");
//               circularLines.forEach(el => {
//                   el.style.backgroundColor = "transparent";
//               });
              
//               // También hacer transparente el fix que SweetAlert2 usa
//               const successFix = popup.querySelector(".swal2-success-fix");
//               if (successFix) {
//                   successFix.style.backgroundColor = "transparent";
//               }
              
//               // Asegurar que el anillo y la marca de verificación sean visibles
//               const successRing = popup.querySelector(".swal2-success-ring");
//               if (successRing) {
//                   successRing.style.zIndex = "1";
//               }
              
//               const successLines = popup.querySelectorAll(".swal2-success-line-tip, .swal2-success-line-long");
//               successLines.forEach(el => {
//                   el.style.zIndex = "2";
//               });
//           }
//       }
//     });
//   }
// });

// trimestresAño.js
document.addEventListener('DOMContentLoaded', function() {
    // Configuración del logo para SweetAlert
    const logoConfig = {
        src: "../../static/img/logo-sena-verde-png-sin-fondo.webp",
        style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: "0.2",
            width: "220px",
            pointerEvents: "none",
            zIndex: "0"
        }
    };

    // Función para agregar logo a SweetAlert
    function addLogoToSwal() {
        const popup = Swal.getPopup();
        const logo = document.createElement("img");
        logo.src = logoConfig.src;
        
        Object.assign(logo.style, logoConfig.style);
        
        popup.insertBefore(logo, popup.firstChild);
        popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
            .forEach(el => el.style.zIndex = "1");
    }

    // Configuración base de SweetAlert
    const swalBaseConfig = {
        background: "#fff",
        backdrop: "rgba(0,0,0,0.4)",
        didOpen: addLogoToSwal
    };

    // Manejo del formulario principal
    const mainForm = document.getElementById('mainForm');
    
    if (mainForm) {
        mainForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            
            // Validar fechas
            if (fin <= inicio) {
                Swal.fire({
                    ...swalBaseConfig,
                    icon: 'error',
                    title: 'Fechas incorrectas',
                    text: 'La fecha fin debe ser mayor que la fecha inicio.'
                });
                return;
            }
            
            // Verificar duplicados
            const trimestre = document.getElementById('trimestres').value;
            checkDuplicates(trimestre, fechaInicio, mainForm);
        });
    }

    // Función para verificar duplicados
    function checkDuplicates(trimestre, fechaInicio, form) {
        fetch(`/check_duplicates?trimestre=${trimestre}&fechaInicio=${fechaInicio}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    Swal.fire({
                        ...swalBaseConfig,
                        icon: 'error',
                        title: 'Error',
                        text: data.message
                    });
                } else if (data.duplicate) {
                    Swal.fire({
                        ...swalBaseConfig,
                        icon: 'error',
                        title: `Registro duplicado en el trimestre ${data.trimestre} del año`,
                        html: `Ya existen registros para las siguientes fichas: <strong>${data.duplicate_fichas}</strong>`,
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#218838'
                    });
                } else {
                    form.submit();
                }
            })
            .catch(error => {
                console.error('Error al verificar duplicados:', error);
                form.submit();
            });
    }

    // Manejo del modal para fichas en oferta 1
    if (window.modalConfig && window.modalConfig.showModal) {
        showConfirmationModal();
    }

    // Función para mostrar el modal de confirmación
    function showConfirmationModal() {
        const config = window.modalConfig;
        const selectedTrimestre = config.selectedTrimestre;
        const mainFechaInicio = new Date(config.mainFechaInicioStr);
        
        Swal.fire({
            ...swalBaseConfig,
            title: 'Confirmar Fechas para las Fichas Cerradas',
            html: config.modalHTML,
            width: '1200px',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            confirmButtonColor: '#1e7e34',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return validateModalForm(selectedTrimestre, mainFechaInicio);
            }
        });
    }

    // Función para validar el formulario del modal
    function validateModalForm(selectedTrimestre, mainFechaInicio) {
        const rows = document.querySelectorAll("#confirmForm tbody tr");
        
        for (let row of rows) {
            const startInput = row.querySelector("input[name='fecha_inicio[]']");
            const endInput = row.querySelector("input[name='fecha_fin[]']");
            
            if (startInput && endInput) {
                const startDate = new Date(startInput.value);
                const endDate = new Date(endInput.value);
                
                // Validar que fecha fin sea mayor que fecha inicio
                if (endDate <= startDate) {
                    Swal.showValidationMessage("La fecha fin debe ser mayor que la fecha inicio en todas las filas.");
                    return false;
                }
                
                // Validar fecha específica para trimestre 1
                if (selectedTrimestre === "1" && startDate < mainFechaInicio) {
                    Swal.showValidationMessage("Para el Trimestre 1, la fecha inicio de las fichas en oferta 1 no puede ser anterior a la fecha inicio de las fichas en oferta 0.");
                    return false;
                }
            }
        }
        
        // Si todas las validaciones pasan, enviar el formulario
        document.getElementById('confirmForm').submit();
        return true;
    }
});