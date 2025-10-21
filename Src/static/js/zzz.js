// In your Javascript (external .js resource or <script> tag)
$(document).ready(function () {
  // Inicializar Select2
  $('.js-example-basic-single').select2();
  $('#js-example-basic-hide-search-multi').select2();

  $('select').on('select2:opening select2:closing', function( event ) {
    var $searchfield = $( '#'+event.target.id ).parent().find('.select2-search__field');
    $searchfield.prop('disabled', true);
  });
  // Inicializar la tabla de resultados
  var table = $('#resultados').DataTable();
  $('#asociar-btn').on('click', function () {
    var competencia = $('#competencia').val();
    var rap = $('#rap').val();
    var horas = $('#horas').val();
    // Agregar una nueva fila a la tabla
    table.row.add([competencia, rap, horas]).draw();
    // Limpiar los campos
    $('#competencia').val(null).trigger('change');
    $('#rap').val(null).trigger('change');
    $('#horas').val('');
  });
});
  
