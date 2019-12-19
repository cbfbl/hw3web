function initPage() {
  tables_data = [];
  tables_data_dict = {};
  resturants = undefined;
}

function setTablesData(ev) {
  var map_control = document.getElementsByClassName("map_control");
  map_control[0].style.visibility = "visible";
  table = new Tabulator("#michelin_table_1", {
    pagination: "local",
    paginationSize: 10
  });
  table_data = [];
  tables_data_dict = {};
  const input_files = ev.target.files;
  Papa.parse(input_files[0], {
    header: true,
    complete: function(results) {
      var table_headers = Object.keys(results.data[0]);
      for (var header of table_headers) {
        if (header === "name") {
          table.addColumn({title: header, field: header, headerFilter: true});
        } else {
          table.addColumn({title: header, field: header});
        }
      }
      table.addColumn({title: "stars", field: "stars"});
      tables_data = results.data;
      tables_data.pop();
      let stars_prefix = input_files[0].name.split("-")[0];
      for (const data of tables_data) {
        data["stars"] = stars_prefix;
      }
      tables_data_dict[stars_prefix] = tables_data;
      table.setData(tables_data).then(
        Papa.parse(input_files[1], {
          header: true,
          complete: function(results) {
            let curr_table_data = results.data;
            curr_table_data.pop();
            stars_prefix = input_files[1].name.split("-")[0];
            for (const data of curr_table_data) {
              data["stars"] = stars_prefix;
            }
            tables_data = tables_data.concat(curr_table_data);
            tables_data_dict[stars_prefix] = curr_table_data;
            table.setData(tables_data).then(
              Papa.parse(input_files[2], {
                header: true,
                complete: function(results) {
                  let curr_table_data = results.data;
                  curr_table_data.pop();
                  stars_prefix = input_files[2].name.split("-")[0];
                  for (const data of curr_table_data) {
                    data["stars"] = stars_prefix;
                  }
                  tables_data = tables_data.concat(curr_table_data);
                  tables_data_dict[stars_prefix] = curr_table_data;
                  table.setData(tables_data).then(loadMap());
                }
              })
            );
          }
        })
      );
    }
  });
}

function downloadTable() {
  table.download("csv", "tables_data.csv");
}

function callLoadersFunctions() {
  loadPricePie();
  loadRegionStackedBar();
  loadColumn();
  loadMap();
}

function loadPricePie() {
  var chart = am4core.create("pie_price", "PieChart");
  var tmp_data = [];
  var price_fields = {$: 0, $$: 0, $$$: 0, $$$$: 0, $$$$$: 0, "N/A": 0};
  for (var data of tables_data) {
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

function loadRegionStackedBar() {
  var chart = am4core.create("stackedbar_region", am4charts.XYChart);
  var regions_rating1 = getRatings(tables_data_dict["one"]);
  regions_rating1.stars = "1";
  var regions_rating2 = getRatings(tables_data_dict["two"]);
  regions_rating2.stars = "2";
  var regions_rating3 = getRatings(tables_data_dict["three"]);
  regions_rating3.stars = "3";
  var tmp_data = [];
  tmp_data.push(regions_rating1);
  tmp_data.push(regions_rating2);
  tmp_data.push(regions_rating3);
  chart.data = tmp_data;

  var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "stars";
  categoryAxis.renderer.grid.template.location = 0;
  var valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
  valueAxis.renderer.inside = true;
  valueAxis.renderer.labels.template.disabled = true;
  valueAxis.min = 0;
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.name = "United Kingdom";
  series.dataFields.valueX = "United Kingdom";
  series.dataFields.categoryY = "stars";
  series.sequencedInterpolation = true;
  series.stacked = true;
  series.columns.template.width = am4core.percent(60);
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.name = "Sweden";
  series.dataFields.valueX = "Sweden";
  series.dataFields.categoryY = "stars";
  series.sequencedInterpolation = true;
  series.stacked = true;
  series.columns.template.width = am4core.percent(60);
  for (series_data of tmp_data) {
    for (key of Object.keys(series_data)) {
      if (key != "stars") {
        createSeriesForRegions(chart, key);
      }
    }
  }
  chart.legend = new am4charts.Legend();
}

function getRatings(table_data) {
  var regions = [];
  for (var data of table_data) {
    regions.push(data.region);
  }
  var unique_regions = Array.from(new Set(regions));
  var regions_rating = {};
  for (var region of unique_regions) {
    regions_rating[region] = 0;
  }
  for (var region of regions) {
    regions_rating[region]++;
  }
  return regions_rating;
}

function createSeriesForRegions(chart, region) {
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.name = region;
  series.dataFields.valueX = region;
  series.dataFields.categoryY = "stars";
  series.sequencedInterpolation = true;
  series.stacked = true;
  series.columns.template.width = am4core.percent(60);
  var labelBullet = series.bullets.push(new am4charts.LabelBullet());
  labelBullet.label.text = 3;
  labelBullet.locationY = 0.5;
  return series;
}

function loadColumn() {
  var chart = am4core.create("column_cuisine", am4charts.XYChart);
  let tmp_data = {};
  for (data of tables_data) {
    tmp_data[data["cuisine"]] = 0;
  }
  for (data of tables_data) {
    tmp_data[data["cuisine"]]++;
  }
  let future_data = [];
  for (tmp_key of Object.keys(tmp_data)) {
    future_data.push({cuisine: tmp_key, counts: tmp_data[tmp_key]});
  }
  chart.data = future_data;

  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "cuisine";
  categoryAxis.renderer.grid.template.location = 0;
  categoryAxis.renderer.minGridDistance = 30;
  categoryAxis.renderer.labels.template.adapter.add("dy", function(dy, target) {
    if (target.dataItem && target.dataItem.index & (2 == 2)) {
      return dy + 25;
    }
    return dy;
  });
  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.dataFields.valueY = "counts";
  series.dataFields.categoryX = "cuisine";
  series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
  series.columns.template.fillOpacity = 0.8;

  var columnTemplate = series.columns.template;
  columnTemplate.strokeWidth = 2;
  columnTemplate.strokeOpacity = 1;
}

function loadMap() {
  var layer = new L.StamenTileLayer("terrain");
  mymap = new L.Map("leaflet_map", {
    center: new L.LatLng(37.7, -122.4),
    zoom: 12
  });
  mymap.addLayer(layer);
}

function changeMarkers(ev) {
  if (resturants != undefined) {
    mymap.removeLayer(resturants);
  }
  const current_radio_btn = ev.target;
  let coord_table = undefined;
  if (current_radio_btn.value === "all") {
    coord_table = table_data;
  } else if (current_radio_btn.value === "none") {
    return;
  } else {
    coord_table = tables_data_dict[current_radio_btn.value];
  }
  let resturants_markers = [];
  for (const data of coord_table) {
    const coord = [data["latitude"], data["longitude"]];
    resturants_markers.push(L.marker(coord));
  }
  resturants = L.layerGroup(resturants_markers);
  mymap.addLayer(resturants);
}
