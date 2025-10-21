function toggleFields() {
    var userType = document.getElementById("tipoUsuario").value;
    var instructorFields = document.getElementById("instructorFields");
    var gestorFields = document.getElementById("gestorFields");
    var adminFields = document.getElementById("adminFields");
    
    instructorFields.classList.add("hidden");
    gestorFields.classList.add("hidden");
    adminFields.classList.add("hidden");
    
    if (userType === "Instructor") {
        instructorFields.classList.remove("hidden");
    } else if (userType === "Gestor") {
        gestorFields.classList.remove("hidden");
    } else if (userType === "Administrador") {
        adminFields.classList.remove("hidden");
    }
}