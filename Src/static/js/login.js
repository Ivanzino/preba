document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('loginForm');
    const validUser = "3020";           // Usuario correcto
    const validPassword = "101428Sena"; // Contraseña correcta

    form.addEventListener("submit", function(event) {
        event.preventDefault(); // Evita que el formulario se envíe automáticamente

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Validación de usuario y contraseña
        if (username === validUser && password === validPassword) {
            alert("Inicio de sesión exitoso");
            // Redirige a la plantilla si las credenciales son correctas
            window.location.href = "../../template/interfazmarlovy.html";
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    });
});

