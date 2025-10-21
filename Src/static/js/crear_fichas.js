// Función para cerrar el modal
function cerrarModal() {
    const modal = document.getElementById('modal_oculto');
    modal.style.display = 'none';
}

// Función para convertir fecha al formato YYYY-MM-DD
function convertirFecha(fechaTexto) {
    if (!fechaTexto) return null;
    const fecha = new Date(fechaTexto);
    return isNaN(fecha) ? null : fecha.toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', function () {
    // Evento para el botón de analizar
    document.getElementById('uploadBtn').addEventListener('click', function () {
        const fileInput = document.getElementById('archivo');

        if (fileInput.files.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: '¡Atención!',
                text: 'Por favor, selecciona un archivo.',
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
            return;
        }

        const formData = new FormData();
        formData.append('archivo', fileInput.files[0]);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(async response => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error,
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
                } else {
                    // Guardar el archivo original para usarlo más tarde
                    window.archivoOriginal = fileInput.files[0];
                    
                    const modal_oculto = document.getElementById('modal_oculto');
                    modal_oculto.style.display = 'flex';

                    document.getElementById('nombrePrograma').textContent = data.nombre_programa;
                    document.getElementById('numeroFicha').textContent = data.numero_ficha;
                    document.getElementById('codigo_programa').value = data.codigo_programa;
                    document.getElementById('fecha_inicio_lectiva').value = data.fecha_inicio_lectiva;
                    document.getElementById('fecha_fin_lectiva').value = data.fecha_fin_lectiva;
                    
                    // Establecer las fechas de inducción automáticamente
                    const fechaInicio = convertirFecha(data.fecha_inicio_lectiva);
                    if (fechaInicio) {
                        document.getElementById('fechaInicio').value = fechaInicio;
                        
                        // Calcular fecha fin (fecha inicio + 5 días)
                        const fechaFinDate = new Date(fechaInicio);
                        fechaFinDate.setDate(fechaFinDate.getDate() + 5);
                        const fechaFin = fechaFinDate.toISOString().split('T')[0];
                        
                        document.getElementById('fechaFin').value = fechaFin;
                    }
                }
            } else {
                const htmlText = await response.text();
                console.error('Respuesta inesperada del servidor (HTML):', htmlText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error del servidor',
                    text: 'Se recibió una respuesta inesperada. Consulta la consola para más detalles.',
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
            }
        })
        .catch(error => {
            console.error('Error al subir el archivo:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al subir el archivo.',
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
        });        
    });

    // Evento de envío del formulario de registro
    const formulario = document.getElementById("registro-form");
    formulario.addEventListener('submit', function (event) {
        event.preventDefault();

        const numeroFichaElem = document.getElementById('numeroFicha');
        const codigoProgramaElem = document.getElementById('codigo_programa');
        const jornadaElem = document.getElementById('jornada');
        const sedeElem = document.getElementById('sede');
        const fechaInicioElem = document.getElementById('fecha_inicio_lectiva');
        const fechaFinElem = document.getElementById('fecha_fin_lectiva');
        const fechaInicioInduccionElem = document.getElementById('fechaInicio');
        const fechaFinInduccionElem = document.getElementById('fechaFin');
        const instructorElem = document.getElementById('instructor');
        const intensidadElem = document.getElementById('trimestre');
        const modalidadElem = document.getElementById('oferta');
        const siglaElem = document.getElementById('sigla');

        if (!numeroFichaElem || !codigoProgramaElem || !jornadaElem || !sedeElem ||
            !fechaInicioElem || !fechaFinElem || !fechaInicioInduccionElem || !fechaFinInduccionElem ||
            !instructorElem || !intensidadElem || !modalidadElem || !siglaElem) {
            Swal.fire({
                icon: 'warning',
                title: 'Advertencia',
                text: 'Faltan elementos en el formulario.',
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
            return;
        }

        // Validación extra: fechas de inducción diferentes
        const fechaInduccionInicio = convertirFecha(fechaInicioInduccionElem.value);
        const fechaInduccionFin = convertirFecha(fechaFinInduccionElem.value);

        if (fechaInduccionInicio && fechaInduccionFin && fechaInduccionInicio === fechaInduccionFin) {
            Swal.fire({
                icon: 'warning',
                title: 'Fechas iguales',
                text: 'La fecha de inicio y fin de inducción no pueden ser iguales.',
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
            return;
        }

        const jsonData = {
            numero_ficha: numeroFichaElem.textContent.trim(),
            codigo_programa: codigoProgramaElem.value.trim(),
            jornada: jornadaElem.value,
            codigo_sede: sedeElem.value,
            fecha_inicio_lectiva: convertirFecha(fechaInicioElem.value),
            fecha_fin_lectiva: convertirFecha(fechaFinElem.value),
            fecha_inicio_induccion: fechaInduccionInicio,
            fecha_fin_induccion: fechaInduccionFin,
            id_instructor: instructorElem.value,
            intensidad: intensidadElem.value,
            oferta: modalidadElem.value, 
            modalidad: 1,
            sigla: siglaElem.value.trim()
        };

        console.log("Datos que se envían al backend:", jsonData);

        fetch('/enviar_fichas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        })
        .then(async response => {
            const contentType = response.headers.get("Content-Type") || "";
            if (!contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error("Respuesta inesperada del servidor:\n" + text.slice(0, 200));
            }

            const result = await response.json();

            if (!response.ok) {
                console.error("Error devuelto por el backend:", result);
                throw new Error(result.error || "Error desconocido al guardar la ficha.");
            }

            return result;
        })
        .then(data => {
            // Ahora que la ficha se ha registrado correctamente, 
            // procesamos el mismo archivo Excel para extraer los aprendices
            registrarAprendicesConMismoArchivo(numeroFichaElem.textContent.trim());
        })
        .catch(error => {
            console.error('Error al enviar los datos:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Hubo un problema inesperado al enviar los datos.',
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
        });
    });

    // Función para registrar los aprendices con el mismo archivo Excel
    function registrarAprendicesConMismoArchivo(numeroFicha) {
        // Utilizamos el archivo Excel que ya se cargó previamente
        if (!window.archivoOriginal) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró el archivo Excel original.',
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
            return;
        }

        // Crear un FormData con el archivo original
        const formData = new FormData();
        formData.append('excel_file', window.archivoOriginal);

        // Mostrar mensaje de procesamiento
        Swal.fire({
            title: 'Procesando',
            text: 'Registrando aprendices para la ficha ' + numeroFicha,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            background: "#fff",
            backdrop: "rgba(0,0,0,0.4)",
            didOpen: () => {
                Swal.showLoading(); // Mostrar spinner de carga
        
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
                    width: "180px",
                    pointerEvents: "none",
                    zIndex: "0"
                });
                
                // Insertar el logo
                popup.insertBefore(logo, popup.firstChild);
                
                // Asegurar que contenido esté por encima
                popup.querySelectorAll(".swal2-title, .swal2-html-container, .swal2-actions")
                    .forEach(el => el.style.zIndex = "1");
        
                // Opcional: si quieres modificar íconos de éxito (aunque aquí no se muestra success)
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
        });        

        // Enviar el archivo para procesar los aprendices
        fetch('/subir_excel_ajax', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            Swal.close();
            
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Proceso completado',
                    html: `
                        <p>La ficha se ha registrado correctamente.</p>
                        <p>${data.message}</p>
                    `,
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
                }).then(() => {
                    window.location.href = '/crear_fichas';
                });
            } else {
                // La ficha se registró pero hubo problemas con los aprendices
                Swal.fire({
                    icon: 'warning',
                    title: 'Ficha registrada, pero...',
                    html: `
                        <p>La ficha se registró correctamente, pero hubo un problema al registrar los aprendices:</p>
                        <p>${data.message}</p>
                    `,
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
                }).then(() => {
                    window.location.href = '/crear_fichas';
                });
            }
        })
        .catch(error => {
            Swal.close();
            console.error('Error al procesar aprendices:', error);
            
            // La ficha se registró pero hubo un error al procesar aprendices
            Swal.fire({
                icon: 'warning',
                title: 'Ficha registrada',
                html: `
                    <p>La ficha se registró correctamente, pero hubo un error al procesar los aprendices.</p>
                    <p>Puede registrar los aprendices más tarde desde la sección "Registrar Aprendices".</p>
                `,
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
            }).then(() => {
                window.location.href = '/crear_fichas';
            });
        });
    }
});