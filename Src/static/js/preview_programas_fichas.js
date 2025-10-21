// static/js/preview_programas_fichas.js
$(document).ready(function () {
  // ------------ Helpers ------------
  function initSelect2() {
    $("#edit-oferta, #edit-lider").select2({
      placeholder: "Seleccionar",
      allowClear: true,
      dropdownParent: $("#modal-edit-ficha"),
    });
  }

  // ------------ Inicializaciones ------------
  initSelect2();
  $("#table-programas").DataTable();
  $("#table-fichas").DataTable();
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el));

  // ------------ Toggle + Filtrar Fichas ------------
  $(".btn-view-fichas").on("click", function () {
    const progId = $(this).data("program-id");
    const $sec = $("#fichas-section");
    const $rows = $("#table-fichas tbody tr");

    if ($sec.is(":visible") && $sec.data("last") == progId) {
      $sec.slideUp().removeData("last");
    } else {
      $sec.slideDown();
      $rows.hide().filter(`[data-program-id="${progId}"]`).show();
      $sec.data("last", progId);
    }
  });

  // ------------ Editar Programa ------------
  $(".btn-edit-program").on("click", function () {
    const row = $(this).closest("tr");
    const programId = $(this).data("program-id");

    $("#form-edit-program").html(`
      <input type="hidden" name="id_prog" value="${programId}">
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input type="text" class="form-control" name="nombre" value="${row
          .find("td:eq(2)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Sigla</label>
        <input type="text" class="form-control" name="sigla" value="${row
          .find("td:eq(3)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Trimestres</label>
        <input type="number" class="form-control" name="cant_trimestres" value="${row
          .find("td:eq(4)")
          .text()}">
      </div>
      <button type="submit" class="btn btn-success">Guardar Cambios</button>
    `);
  });

  // ------------ Editar Ficha ------------
  $(".btn-edit-ficha").on("click", function () {
    const row = $(this).closest("tr");
    const fichaId = $(this).data("ficha-id");
    const modCode = row.data("modalidad"); // 0 o 1
    const ofertaCode = row.data("oferta"); // 0 o 1

    $("#form-edit-ficha").html(`
      <input type="hidden" name="numero_ficha" value="${fichaId}">
      <div class="mb-3">
        <label class="form-label">Jornada</label>
        <input type="text" name="jornada" class="form-control" value="${row
          .find("td:eq(3)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Código Sede</label>
        <input type="text" name="codigo_sede" class="form-control" value="${row
          .find("td:eq(4)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Inicio Lectiva</label>
        <input type="date" name="fecha_inicio_lectiva" class="form-control" value="${row
          .find("td:eq(5)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Fin Lectiva</label>
        <input type="date" name="fecha_fin_lectiva" class="form-control" value="${row
          .find("td:eq(6)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Inicio Inducción</label>
        <input type="date" name="fecha_inicio_induccion" class="form-control" value="${row
          .find("td:eq(7)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Fin Inducción</label>
        <input type="date" name="fecha_fin_induccion" class="form-control" value="${row
          .find("td:eq(8)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Instructor (ID)</label>
        <input type="number" name="id_instructor" class="form-control" value="${row
          .find("td:eq(9)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Intensidad (horas)</label>
        <input type="number" name="intensidad" class="form-control" value="${row
          .find("td:eq(10)")
          .text()}">
      </div>
      <div class="mb-3">
        <label class="form-label">Modalidad</label>
        <select id="edit-modalidad" name="modalidad" class="form-select">
          <option value="0">Virtual</option>
          <option value="1">Presencial</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Oferta</label>
        <select id="edit-oferta" name="oferta" class="form-select">
          <option value="0">Abierta</option>
          <option value="1">Cerrada</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Líder de Ficha</label>
        <select id="edit-lider" name="lider" class="form-select">
          <!-- Opciones dinámicas de instructores -->
        </select>
      </div>
      <button type="submit" class="btn btn-success">Guardar Cambios</button>
    `);

    $("#edit-modalidad").val(modCode);
    $("#edit-oferta").val(ofertaCode);
    initSelect2();
  });

  // ------------ Envío de Formularios ------------
  $("#form-edit-program, #form-edit-ficha").on("submit", function (e) {
    e.preventDefault();
    Swal.fire("Guardado", "Cambios almacenados 👍", "success");
    $("#modal-edit-program, #modal-edit-ficha").modal("hide");
    // TODO: agregar AJAX aquí si lo necesitas
  });
});
