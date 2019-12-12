function check(ev) {
  input_files = ev.target.files;
  var table = new Tabulator("#michelin_table");
  curr_reader = new FileReader();
  console.log(curr_reader.readAsText(input_files[0]));
  table.addColumn({title: "age", field: "ppp"});
}
