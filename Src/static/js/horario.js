
const celdas = document.querySelectorAll('.grid-table td');

// Función para verificar el contenido de cada celda
function verificarCeldas() {
    celdas.forEach(cell => {
        if (cell.textContent.trim() !== '') {
            cell.classList.add('filled');
        } else {
            cell.classList.remove('filled');
        }
    });
}

// Verificamos inicialmente
verificarCeldas();

// Crear un MutationObserver para detectar cambios en las celdas
const observer = new MutationObserver(verificarCeldas);
celdas.forEach(cell => {
    observer.observe(cell, { childList: true, subtree: true });
});
