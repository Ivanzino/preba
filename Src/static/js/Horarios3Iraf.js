let listaElementos = document.querySelectorAll(".listaBoton-click");
const inicio = document.getElementById("inicio")


inicio.addEventListener("click", ()=>{

})






listaElementos.forEach(listaElemento => {
    listaElemento.addEventListener("click", () => {
        listaElemento.classList.toggle("arrow");

        let height = 0;
        let menus = listaElemento.parentElement.querySelectorAll(".listaShow");

        menus.forEach(menu => {
            if (menu.style.height && menu.style.height !== "0px") {
                menu.style.height = "0";
            } else {
                menu.style.height = menu.scrollHeight + "px";
            }
        });
    });
});










function mostrarSeccion(seccion) {
    var secciones = ['inicio'];
    secciones.forEach(function(id) {

        var contenedor = document.getElementById(id);

        if (contenedor) { 
            contenedor.style.display = (id === seccion) ? 'block' : 'none';
        }

    });
}