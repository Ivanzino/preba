function uploadFile() {
    const fileInput = document.getElementById("archivo");
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("archivo", file);

    fetch("/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("Archivo cargado exitosamente:", data);
    })
    .catch(error => {
        console.error("Error al cargar el archivo:", error);
    });
}
