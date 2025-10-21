// function actualizarProyecto() {
//     const programa = document.getElementById('programa').value;
//     const proyectoP = document.getElementById('proyecto');
//     const codigoVersion = document.getElementById('codigo-version');
//     const codigoProyecto = document.getElementById('codigo-proyecto');

//     if (datosPorPrograma[programa]) {
//         proyectoP.textContent = datosPorPrograma[programa].proyecto;
//         codigoVersion.textContent = datosPorPrograma[programa].codigoVersion;
//         codigoProyecto.textContent = datosPorPrograma[programa].codigoProyecto;
//         mostrarCompetencias(programa);
//     } else {
//         proyectoP.textContent = "...";
//         codigoVersion.textContent = "...";
//         codigoProyecto.textContent = "...";
//         ocultarCompetencias();
//     }
// }

// function mostrarCompetencias(programa, trimestre) {
//     const competencias = document.querySelectorAll(`#competencias-body tr[data-programa]`);
//     competencias.forEach(row => {
//         const rowPrograma = row.getAttribute('data-programa');
//         const rowTrimestre = row.getAttribute('data-trimestre');
//         row.style.display = (rowPrograma === programa && (trimestre === undefined || rowTrimestre === trimestre)) ? '' : 'none';
//     });
// }

// function ocultarCompetencias() {
//     const competencias = document.querySelectorAll(`#competencias-body tr[data-programa]`);
//     competencias.forEach(row => {
//         row.style.display = 'none';
//     });
// }

// function agregarCompetencia() {
//     const programa = document.getElementById('programa-select').value;
//     if (!programa) {
//         alert("Por favor, seleccione un programa.");
//         return;
//     }
    
//     const nombreCompetencia = document.getElementById('nombre-competencia').value;
//     if (!nombreCompetencia) {
//         alert("Por favor, ingrese el nombre de la competencia.");
//         return;
//     }

//     const raps = parseInt(document.getElementById('raps-select').value, 10);
//     const jornada = document.getElementById('jornada-select').value;
//     const trimestre = document.getElementById('trimestre-select').value;

//     if (!raps || !jornada || !trimestre) {
//         alert("Por favor, complete todos los campos.");
//         return;
//     }

//     const tableBody = document.getElementById('competencias-body');
//     const row = document.createElement('tr');
//     row.setAttribute('data-programa', programa);
//     row.setAttribute('data-trimestre', trimestre);

//     let resultadosAprendizajeHTML = '<td><table class="inner-table">';
//     for (let i = 0; i < raps; i++) {
//         resultadosAprendizajeHTML += `<tr><td>RAPS ${i + 1}: ${jornada}</td></tr>`;
//     }
//     resultadosAprendizajeHTML += '</table></td>';

//     row.innerHTML = `
//         <td>${nombreCompetencia}</td>
//         ${resultadosAprendizajeHTML}
//         <td></td>
//     `;
//     tableBody.appendChild(row);

//     document.getElementById('competencia-modal').style.display = 'none';
//     document.getElementById('competencia-form').reset();

//     mostrarCompetencias(programa, trimestre);
// }



// muestra segun la eleccion de trimestre, los botones de paginacion

// document.addEventListener('DOMContentLoaded', function() {
//     const agregarBtn = document.getElementById('agregar-btn');
//     const modal = document.getElementById('competencia-modal');
//     const closeBtn = document.querySelector('.modal .close');
//     const guardarCompetenciaBtn = document.getElementById('guardar-competencia');
//     const cantidadTrimestresSelect = document.getElementById('can'); 
//     const botonesTrimestre = document.querySelectorAll('.paginacion .page-btn'); 
//     const crearMallaBtn = document.getElementById('crear-malla-btn'); 
//     const paginacionSection = document.querySelector('.paginacion'); 
    
//     agregarBtn.addEventListener('click', function() {
//         modal.style.display = 'block';
//     });
    
//     closeBtn.addEventListener('click', function() {
//         modal.style.display = 'none';
//     });
    
//     window.addEventListener('click', function(event) {
//         if (event.target == modal) {
//             modal.style.display = 'none';
//         }
//     });

//     guardarCompetenciaBtn.addEventListener('click', agregarCompetencia);

//     // Evento click para el botón "Crear Malla"
//     crearMallaBtn.addEventListener('click', function() {
//         const cantidadTrimestres = parseInt(cantidadTrimestresSelect.value, 10);
        
//         // Mostrar u ocultar los botones de trimestre
//         botonesTrimestre.forEach((boton, index) => {
//             if (index < cantidadTrimestres) {
//                 boton.style.display = 'inline-block'; // Mostrar botón si está en el rango
//             } else {
//                 boton.style.display = 'none'; // Ocultar botón si está fuera del rango
//             }
//         });

//         // Cerrar el modal
//         modal.style.display = 'none';
        
//         // Desplazarse a la sección de paginación
//         paginacionSection.scrollIntoView({ behavior: 'smooth' });
//     });

//     // Cambiar trimestres y mostrar competencias
//     document.querySelectorAll('.page-btn').forEach(button => {
//         button.addEventListener('click', function() {
//             document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
//             this.classList.add('active');
//             const trimestre = this.getAttribute('data-trimestre');
//             mostrarCompetencias(document.getElementById('programa').value, trimestre);
//         });
//     });
// });

// In your Javascript (external .js resource or <script> tag)
$(document).ready(function() {
    $('.js-example-basic-single').select2();
});

document.addEventListener('DOMContentLoaded', function() {
    const agregarBtn = document.querySelector('.uno'); // Botón para abrir el formulario
    const modal = document.getElementById('competencia-modal');
    const closeBtn = document.querySelector('.modal .close');
    const guardarCompetenciaBtn = document.querySelector('#guardar-competencia'); // Botón dentro del formulario
    const cantidadTrimestresSelect = document.getElementById('can'); // Selección de cantidad de trimestres
    const botonesTrimestre = document.querySelectorAll('.paginacion .page-btn'); // Botones de trimestre
    const paginacionSection = document.querySelector('.paginacion'); // Sección de paginación
  
    // Abre el modal
    agregarBtn.addEventListener('click', function() {
      modal.style.display = 'block';
    });
    
    // Cierra el modal
    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  
    window.addEventListener('click', function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    });
  
    guardarCompetenciaBtn.addEventListener('click', function() {
      const cantidadTrimestres = parseInt(cantidadTrimestresSelect.value, 10);
  
  
      botonesTrimestre.forEach((boton, index) => {
        if (index < cantidadTrimestres) {
          boton.style.display = 'inline-block'; 
        } else {
          boton.style.display = 'none'; 
        }
      });
  

      modal.style.display = 'none';
  
     
      paginacionSection.scrollIntoView({ behavior: 'smooth' });
    });
  
    // color boton verde posicionamiento de paginacion trimestres 
    document.querySelectorAll('.page-btn').forEach(button => {
      button.addEventListener('click', function() {
        document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const trimestre = this.getAttribute('data-trimestre');
        mostrarCompetencias(document.getElementById('programa').value, trimestre);
      });
    });
  });
  