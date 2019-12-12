function check(ev) {
  var input_files = ev.target.files;
  var table = new Tabulator("#michelin_table");
  var curr_reader = new FileReader();

  curr_reader.onload = function(e) {
    var csv_text = e.target.result;
    var csv_lines = csv_text.split("\n");
    var table_headers = csv_lines[0].split(",");
    var i;
    var table_data = [];
    for (header of table_headers) {
      table.addColumn({title: header, field: header});
    }
    for (i = 1; i < table_headers.length; i++) {
      var tmp_dict = {};
      var curr_data = csv_lines[i].split(",");
      var k;
      for (k = 0; k < curr_data.length; k++) {
        tmp_dict[table_headers[k]] = curr_data[k];
      }
      table_data.push(tmp_dict);
    }
    table.setData(table_data);
  };
  curr_reader.readAsText(input_files[0]);
}
