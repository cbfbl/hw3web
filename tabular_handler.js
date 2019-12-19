function initPage() {
  table = new Tabulator("#michelin_table", {
    pagination: "local",
    paginationSize: 10
  });
}

function setTableData(ev) {
  var input_files = ev.target.files;
  var curr_reader = new FileReader();
  var table_data = [];
  Papa.parse(input_files[0], {
    header: true,
    complete: function(results) {
      var table_headers = Object.keys(results.data[0]);
      for (header of table_headers) {
        if (header === "name") {
          table.addColumn({title: header, field: header, headerFilter: true});
        } else {
          table.addColumn({title: header, field: header});
        }
      }
      table_data = results.data;
      table_data.pop();
      table.setData(table_data).then(loadPricePie(table_data));
    }
  });
}

function downloadTable() {
  table.download("csv", "table_data.csv");
}

function loadPricePie(table_data) {
  var chart = am4core.create("pie_price", "PieChart");
  var tmp_data = [];
  var price_fields = {$: 0, $$: 0, $$$: 0, $$$$: 0, $$$$$: 0, "N/A": 0};
  for (var data of table_data) {
    price_fields[data.price]++;
  }
  for (var key of Object.keys(price_fields)) {
    tmp_data.push({price: key, cost: price_fields[key]});
  }
  chart.data = tmp_data;
  var pieSeries = chart.series.push(new am4charts.PieSeries());
  pieSeries.dataFields.value = "cost";
  pieSeries.dataFields.category = "price";
}
