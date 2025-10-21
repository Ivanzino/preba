// Obtener el formulario y el flag de existencia desde el atributo HTML
const form = document.querySelector('form'); 
// Leer directamente el atributo data-existe-principal para evitar ambigüedades
const existePrincipalBD = form.getAttribute('data-existe-principal') === 'true';

const nombreSedeInput = document.getElementById("nombreSede");
const municipioInput = document.getElementById("municipio");
const sedePrincipalCheckbox = document.getElementById("sedePrincipal");

// Función para mostrar el SweetAlert con el logo
function mostrarSweetAlert(opciones) {
  return Swal.fire({
    ...opciones,
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

form.addEventListener("submit", async function(event) {
  event.preventDefault();
  const nombreSede = nombreSedeInput.value.trim();
  const municipio = municipioInput.value;
  const esPrincipal = sedePrincipalCheckbox.checked;
  
  // Validación de campos
  if (!nombreSede || !municipio) {
    return mostrarSweetAlert({
      icon: "error",
      title: "¡Error!",
      text: "Por favor, llena todos los campos."
    });
  }
  
  // Solo preguntar confirmación si ya hay una sede principal en la BD
  if (esPrincipal) {
    if (existePrincipalBD) {
      const { isConfirmed } = await mostrarSweetAlert({
        title: "¿Estás seguro de cambiar la sede principal?",
        text: "Ya hay una sede principal. Confirma para reasignar.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "No, cancelar",
        customClass: { cancelButton: "boton-cancelar" }
      });
      
      if (!isConfirmed) {
        return mostrarSweetAlert({
          title: "Cancelado",
          text: "No se realizaron cambios.",
          icon: "info"
        });
      }
    }
    // si no existePrincipalBD, no pregunta, va directo
    await mostrarSweetAlert({ 
      title: "Éxito", 
      text: "Sede principal registrada.", 
      icon: "success"
    });
  } else {
    // No es principal: flujo normal
    await mostrarSweetAlert({ 
      title: "Éxito", 
      text: "Sede registrada.", 
      icon: "success"
    });
  }
  
  form.submit();
});

// Inicializar Select2 sin cambios
$(document).ready(function () {
  $('.js-example-basic-single').select2();
  $('#js-example-basic-hide-search-multi').select2();
  $('select').on('select2:opening select2:closing', function(event) {
    var $searchfield = $('#' + event.target.id).parent().find('.select2-search__field');
    $searchfield.prop('disabled', true);
  });
  
  // Animación adicional para el switch de sede principal
  sedePrincipalCheckbox.addEventListener('change', function() {
    const switchLabel = document.querySelector('.switch-label');
    
    if(this.checked) {
      switchLabel.style.color = '#28a745';
      
      // Efecto de pulso en el switch cuando se activa
      const slider = document.querySelector('.slider');
      slider.classList.add('pulse');
      
      setTimeout(() => {
        slider.classList.remove('pulse');
      }, 500);
    } else {
      switchLabel.style.color = '';
    }
  });
});