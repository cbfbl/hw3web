function initPage() {
  tables_data = [];
  tables_data_dict = {};
  restaurants = undefined;
  last_radio_btn_value = undefined;
  last_region_selected = "none";
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
    delimiter: ",",
    skipEmptyLines: true,
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
      let stars_prefix = input_files[0].name.split("-")[0];
      for (const data of tables_data) {
        data["stars"] = stars_prefix;
      }
      tables_data_dict[stars_prefix] = tables_data;
      table.setData(tables_data).then(
        Papa.parse(input_files[1], {
          header: true,
          delimiter: ",",
          skipEmptyLines: true,
          complete: function(results) {
            let curr_table_data = results.data;
            stars_prefix = input_files[1].name.split("-")[0];
            for (const data of curr_table_data) {
              data["stars"] = stars_prefix;
            }
            tables_data = tables_data.concat(curr_table_data);
            tables_data_dict[stars_prefix] = curr_table_data;
            table.setData(tables_data).then(
              Papa.parse(input_files[2], {
                header: true,
                delimiter: ",",
                skipEmptyLines: true,
                complete: function(results) {
                  let curr_table_data = results.data;
                  stars_prefix = input_files[2].name.split("-")[0];
                  for (const data of curr_table_data) {
                    data["stars"] = stars_prefix;
                  }
                  tables_data = tables_data.concat(curr_table_data);
                  tables_data_dict[stars_prefix] = curr_table_data;
                  table.setData(tables_data).then(callLoadersFunctions());
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
  loadAvgPriceCuisine();
  loadRegions();
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
  chart.legend = new am4charts.Legend();
  chart.legend.position = "right";
  var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "stars";
  categoryAxis.renderer.grid.template.opacity = 0;
  var valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
  valueAxis.min = 0;
  valueAxis.renderer.grid.template.opacity = 0;
  valueAxis.renderer.ticks.template.strokeOpacity = 0.5;
  valueAxis.renderer.ticks.template.stroke = am4core.color("#495C43");
  valueAxis.renderer.ticks.template.length = 10;
  valueAxis.renderer.line.strokeOpacity = 0.5;
  valueAxis.renderer.baseGrid.disabled = true;
  valueAxis.renderer.minGridDistance = 40;
  // var series = chart.series.push(new am4charts.ColumnSeries());
  // series.name = "United Kingdom";
  // series.dataFields.valueX = "United Kingdom";
  // series.dataFields.categoryY = "stars";
  // series.sequencedInterpolation = true;
  // series.stacked = true;
  // series.columns.template.width = am4core.percent(60);
  // var series = chart.series.push(new am4charts.ColumnSeries());
  // series.name = "Sweden";
  // series.dataFields.valueX = "Sweden";
  // series.dataFields.categoryY = "stars";
  // series.sequencedInterpolation = true;
  // series.stacked = true;
  // series.columns.template.width = am4core.percent(60);
  let already_saw_keys = ["stars"];
  for (let series_data of tmp_data) {
    for (let key of Object.keys(series_data)) {
      if (already_saw_keys.includes(key)) {
        continue;
      } else {
        createSeriesForRegions(chart, key);
        already_saw_keys.push(key);
      }
    }
  }
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
  series.dataFields.valueX = region;
  series.dataFields.categoryY = "stars";
  series.stacked = true;
  series.name = region;

  var labelBullet = series.bullets.push(new am4charts.LabelBullet());
  labelBullet.locationX = 0.5;
  labelBullet.label.text = "{valueX}";
  labelBullet.label.fill = am4core.color("#fff");
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
  categoryAxis.renderer.labels.template.disabled = true;
  // categoryAxis.renderer.labels.template.adapter.add("dy", function(dy, target) {
  //   if (target.dataItem && target.dataItem.index & (2 == 2)) {
  //     return dy + 25;
  //   }
  //   return dy;
  // });
  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.dataFields.valueY = "counts";
  series.dataFields.categoryX = "cuisine";
  series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
  series.columns.template.fillOpacity = 0.8;

  // var columnTemplate = series.columns.template;
  // columnTemplate.strokeWidth = 2;
  // columnTemplate.strokeOpacity = 1;
}

function loadMap() {
  var layer = new L.StamenTileLayer("terrain");
  mymap = new L.Map("leaflet_map", {
    center: new L.LatLng(32.7775, 35.021667),
    zoom: 12
  });
  mymap.addLayer(layer);
}

function changeMarkers(ev) {
  if (restaurants != undefined) {
    mymap.removeLayer(restaurants);
  }
  const current_radio_btn = ev.target;
  last_radio_btn_value = current_radio_btn.value;
  let coord_table = undefined;
  if (current_radio_btn.value === "all") {
    coord_table = tables_data;
  } else if (current_radio_btn.value === "none") {
    return;
  } else {
    coord_table = tables_data_dict[current_radio_btn.value];
  }
  let restaurants_markers = [];
  for (const data of coord_table) {
    if (
      last_region_selected === "none" ||
      data["region"] === last_region_selected
    ) {
      const coord = [data["latitude"], data["longitude"]];
      restaurants_markers.push(L.marker(coord));
    }
  }
  restaurants = L.layerGroup(restaurants_markers);
  mymap.addLayer(restaurants);
}

function changeRegionSelect(ev) {
  last_region_selected = ev.target.value;
  if (last_radio_btn_value === undefined) {
    return;
  }
  if (restaurants != undefined) {
    mymap.removeLayer(restaurants);
  }
  let coord_table = undefined;
  if (last_radio_btn_value === "all") {
    coord_table = tables_data;
  } else if (last_radio_btn_value === "none") {
    return;
  } else {
    coord_table = tables_data_dict[last_radio_btn_value];
  }
  let restaurants_markers = [];
  for (const data of coord_table) {
    if (
      last_region_selected === "none" ||
      data["region"] === last_region_selected
    ) {
      const coord = [data["latitude"], data["longitude"]];
      restaurants_markers.push(L.marker(coord));
    }
  }
  restaurants = L.layerGroup(restaurants_markers);
  mymap.addLayer(restaurants);
}

function loadRegions() {
  region_select = document.getElementById("regions_select");
  region_select_adv = document.getElementById("regions_select_adv");
  select_html_start = "<option value='none'>No filter</options>";
  select_html_start_adv = "<option value='none'>Select region</options>";
  select_html = "";
  let regions = [];
  for (const data of tables_data) {
    regions.push(data.region);
  }
  const unique_regions = Array.from(new Set(regions));
  for (region of unique_regions) {
    select_html += `<option value="${region}">${region}</option>`;
  }
  region_select.innerHTML = select_html_start + select_html;
  region_select_adv.innerHTML = select_html_start_adv + select_html;
}

function loadAvgPriceCuisine() {
  var chart = am4core.create("avg_cuisine_radial", am4charts.RadarChart);
  let cuisine_hist = {};
  let cuisine_price = {};
  for (let data of tables_data) {
    cuisine_hist[data["cuisine"]] = 0;
    cuisine_price[data["cuisine"]] = 0;
  }
  for (let data of tables_data) {
    cuisine_hist[data["cuisine"]]++;
    cuisine_price[data["cuisine"]] += data["price"].length;
  }
  let cuisine_avg = [];
  for (let key of Object.keys(cuisine_price)) {
    if (cuisine_hist[key] == 0) {
      continue;
    }
    cuisine_avg.push({
      cuisine: key,
      avg: cuisine_price[key] / cuisine_hist[key]
    });
  }

  chart.data = cuisine_avg;
  chart.radius = am4core.percent(100);
  chart.innerRadius = am4core.percent(50);

  chart.scrollbarX = new am4core.Scrollbar();
  // Create axes
  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "cuisine";
  categoryAxis.renderer.grid.template.location = 0;
  categoryAxis.renderer.minGridDistance = 30;
  categoryAxis.tooltip.disabled = true;
  categoryAxis.renderer.minHeight = 110;
  categoryAxis.renderer.grid.template.disabled = true;
  categoryAxis.renderer.labels.template.disabled = true;
  let labelTemplate = categoryAxis.renderer.labels.template;
  labelTemplate.radius = am4core.percent(-60);
  labelTemplate.location = 0.5;
  labelTemplate.relativeRotation = 90;

  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  valueAxis.renderer.grid.template.disabled = true;
  valueAxis.renderer.labels.template.disabled = true;
  valueAxis.tooltip.disabled = true;

  // Create series
  var series = chart.series.push(new am4charts.RadarColumnSeries());
  series.sequencedInterpolation = true;
  series.dataFields.valueY = "avg";
  series.dataFields.categoryX = "cuisine";
  series.columns.template.strokeWidth = 0;
  series.tooltipText = "{categoryX}:{valueY}";
  series.columns.template.radarColumn.cornerRadius = 10;
  series.columns.template.radarColumn.innerCornerRadius = 0;

  series.tooltip.pointerOrientation = "vertical";

  // on hover, make corner radiuses bigger
  let hoverState = series.columns.template.radarColumn.states.create("hover");
  hoverState.properties.cornerRadius = 0;
  hoverState.properties.fillOpacity = 1;

  series.columns.template.adapter.add("fill", function(fill, target) {
    return chart.colors.getIndex(target.dataItem.index);
  });

  // Cursor
  chart.cursor = new am4charts.RadarCursor();
  chart.cursor.innerRadius = am4core.percent(50);
  chart.cursor.lineY.disabled = true;
}

function loadCuisineRegionDistrbution(ev) {
  const region_selected = ev.target.value;
  if (region_selected === "none") {
    return;
  }
  let chart = am4core.create("cuisine_region_column", am4charts.XYChart);
  let cuisine_hist = {};
  for (data of tables_data) {
    if (data["region"] === region_selected) {
      if (data["cuisine"] in cuisine_hist) {
        cuisine_hist[data["cuisine"]]++;
      } else {
        cuisine_hist[data["cuisine"]] = 1;
      }
    }
  }
  let cuisine_to_region_count = [];
  for (key of Object.keys(cuisine_hist)) {
    cuisine_to_region_count.push({cuisine: key, count: cuisine_hist[key]});
  }

  chart.data = cuisine_to_region_count;

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
  series.dataFields.valueY = "count";
  series.dataFields.categoryX = "cuisine";
  series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
  series.columns.template.fillOpacity = 0.8;

  var columnTemplate = series.columns.template;
  columnTemplate.strokeWidth = 2;
  columnTemplate.strokeOpacity = 1;
}
