
let tabla = new DataTable('#Mytables', {

    layout: {
        topEnd: {
            pageLength: {
                menu: [8, 5]
            }
        },
        topStart: {
            search: {
                placeholder: 'Filtro General'
            }
        },
    },
    pageLength: 8, // Valor inicial que coincide con una de las opciones del menú
    // es serive para cambiar en prural o singular la info 
    language: {
        search: "Buscar:",
        lengthMenu: " _MENU_ Competencias por Pagina",
        info: "Mostrando Competencias de _START_ al _END_ de un total de _TOTAL_ Competencias",
        // infoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
        infoFiltered: "(filtrado de un total de _MAX_ registros)",
        zeroRecords: "No se encontraron resultados",
        emptyTable: "No hay datos disponibles en la tabla",
        entries: {
            _: 'Competencia',
            1: 'Competencia'
        }

    },

});

let tabla2 = new DataTable('#tec-serv', {

    layout: {
        topEnd: {
            pageLength: {
                menu: [5, 10, 15]
            }
        },
        topStart: {
            search: {
                placeholder: 'Filtro General'
            }
        },
    },
    // es serive para cambiar en prural o singular la info 
    language: {
        search: "Buscar:",
        lengthMenu: " _MENU_ Registros",
        info: "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
        // infoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
        infoFiltered: "(filtrado de un total de _MAX_ registros)",
        zeroRecords: "No se encontraron resultados",
        emptyTable: "No hay datos disponibles en la tabla",
        entries: {
            _: 'personas',
            1: 'persona'
        }

    },
    "scrollY": "calc(70vh - 230px)", // Fijar la altura del área de desplazamiento

});



//=================================================================================
//                      REPARACIONES
// Selecciona los elementos del modal y el botón de apertura
const modal = document.getElementById("modal");
const openModalBtn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close");

// Evento para abrir el modal
openModalBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

// Evento para cerrar el modal al hacer clic en el botón "X"
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Cerrar el modal al hacer clic fuera del contenido del modal
window.addEventListener("click", (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});

//                      TABLA DE REPARACIONES



// ===========================================================================================================
//                      COTIZACIONES
const madulo = document.getElementById("madulo");
const Btn2 = document.getElementById("Btn2");
const close2 = document.querySelector(".close-2");

Btn2.addEventListener("click", () => {
    madulo.style.display = "flex";
});

close2.addEventListener("click", () => {
    madulo.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target == madulo) {
        madulo.style.display = "none";
    }
});
// registrar intructor//
const caja_nuevo = document.getElementById("caja_nuevo");
const boton_nuevo = document.getElementById("boton_nuevo");
const close3 = document.querySelector(".close3");

boton_nuevo.addEventListener("click", () => {
    caja_nuevo.style.display = "flex";
});

close3.addEventListener("click", () => {
    caja_nuevo.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target == caja_nuevo) {
        caja_nuevo.style.display = "none";
    }
});
//                  TABLA DE COTIZACIONES

////////////////////MASIVO///////////////////


const masivo = document.getElementById("masivo");
const boton_masivo = document.getElementById("boton_masivo");
const close4 = document.getElementById("close4");

boton_masivo.addEventListener("click", () => {
    masivo.style.display = "flex";
});

close4.addEventListener("click", () => {
    masivo.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target == masivo) {
        masivo.style.display = "none";
    }
});

 // Seleccionar los elementos necesarios
 const fileInput = document.querySelector('.file');
 const fileLabel = document.getElementById('file-label');

 // Escuchar el evento de cambio en el input de tipo file
 fileInput.addEventListener('change', function () {
   if (fileInput.files.length > 0) {
     // Si hay un archivo seleccionado, mostrar su nombre
     fileLabel.textContent = fileInput.files[0].name;
   } else {
     // Si no hay archivo seleccionado, restablecer el texto por defecto
     fileLabel.textContent = 'Ningún Archivo Seleccionado';
   }
 });

 // Escuchar el evento de click en el botón para eliminar archivo si aplica
 fileInput.addEventListener('click', function () {
   // Si el usuario decide quitar el archivo antes de confirmar
   fileInput.value = ''; // Vaciar el valor del input
   fileLabel.textContent = 'Ningún Archivo Seleccionado'; // Restablecer el texto
 });

///////////////////////////calendario/////////////////////////

const calendario_caja = document.getElementById("calendario_caja");
const calendario = document.getElementById("calendario");
const close5 = document.getElementById("close5");

calendario.addEventListener("click", () => {
    calendario_caja.style.display = "flex";
});

close5.addEventListener("click", () => {
    calendario_caja.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target == calendario_caja) {
        calendario_caja.style.display = "none";
    }
});

//////////////////////////////////////////////////
function showAlert() {
    Swal.fire({
        title: "Instructor Registrado con exito, Desea asociar al instructor?",
        showDenyButton: true,
        // showCancelButton: true,
        confirmButtonText: "Registrar",
        denyButtonText: `Cancelar`,
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
            Swal.fire("Registrado!", "", "success").then(() => {
                // Enviar el formulario después de mostrar el mensaje de éxito
                document.getElementById('registro-form').submit();
            });
        } else if (result.isDenied) {
            Swal.fire("Cancelaste el registro", "", "info");
        }
    });
}


function showAlert2() {
    Swal.fire({
        title: "Instructor Registrado con exito, Desea asociar al instructor?",

        showCancelButton: true,
        confirmButtonText: "Guardar",
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
            Swal.fire("Tus datos se guardaron Satisfactoriamente", "", "success").then(() => {
                // Enviar el formulario después de mostrar el mensaje de éxito
                document.getElementById('registro-form').submit();
            });
        } else if (result.isDenied) {
            Swal.fire("Los cambios no se guardaron", "", "info");
        }
    });
}


/////////////////////////////////////////////////
$(document).ready(function () {
    $('#titulosCarreras').select2({
        placeholder: 'Selecciona un título o carrera',
        allowClear: true
    });
});

/////////////////////////////////////////////////


$(document).ready(function () {
    // Inicializar Select2 sobre el select oculto
    $('#asociar').select2({
        placeholder: "Escribe para buscar...",
        allowClear: true
    });
});



//////////////////////////////////////////////


