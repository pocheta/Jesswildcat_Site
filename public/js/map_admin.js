let click = false;
let clickCoordinateLatitude;
let clickCoordinateLongitude;
var fileobj;

function adminMap() {

  startMap();
  
  // Onclick de la map
  map.on("click", function (event) {
    if (!hoverMarker && !clusterHoverMarker && !click) {
      click = true;
      document.getElementById("addPoint").style.display = "grid";
      clickCoordinateLongitude = ol.proj.transform(
        event.coordinate,
        "EPSG:3857",
        "EPSG:4326"
      )[0];
      clickCoordinateLatitude = ol.proj.transform(
        event.coordinate,
        "EPSG:3857",
        "EPSG:4326"
      )[1];
    }
  });
}

// Ajout d'un point
function addLieu() {
  var nom = document.getElementById("nom").value;
  var lieu = document.getElementById("lieu").value;
  var description = document.getElementById("description").value;
  var image = document.getElementsByClassName("file");
  var imageName = [];

  for (let index = 0; index < image.length; index++) {
    imageName[index] = encodeURI(image[index].innerText);
  }

  if (nom != "" && lieu != "" && description != "" && imageName.length != 0) {
    var features = [];

    var iconFeature = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.fromLonLat([clickCoordinateLongitude, clickCoordinateLatitude])
      ),
    });

    var iconStyle = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        scale: 0.1,
        src: "../assets/images/marker/single_marker.png",
      }),
    });

    iconFeature.setStyle(iconStyle);
    iconFeature.setProperties({
      name: nom,
      lieu: lieu,
      description: description,
      image: imageName[0],
    });
    features.push(iconFeature);

    var vectorSource = new ol.source.Vector({
      features: features,
    });

    var clusterSource = new ol.source.Cluster({
      distance: 40,
      source: vectorSource,
    });

    var styleCache = {};
    var clusters = new ol.layer.Vector({
      source: clusterSource,
      style: function (feature, resolution) {
        var size = feature.get("features").length;
        var style = styleCache[size];
        if (size == 1) {
          style = [
            new ol.style.Style({
              image: new ol.style.Icon({
                anchor: [0.5, 1],
                scale: 0.05,
                src: "../assets/images/marker/multiple_marker.png",
              }),
            }),
          ];
          styleCache[size] = style;
        } else {
          if (!style) {
            console.log(feature.get("features"));
            style = [
              new ol.style.Style({
                image: new ol.style.Icon({
                  anchor: [0.5, 1],
                  scale: 0.1,
                  src: "../assets/images/marker/single_marker.png",
                }),
                text: new ol.style.Text({
                  text: size.toString(),
                  scale: 1.3,
                  fill: new ol.style.Fill({
                    color: "#FFFF",
                  }),
                  stroke: new ol.style.Stroke({
                    color: "#00000",
                    width: 3.5,
                  }),
                }),
              }),
            ];
            styleCache[size] = style;
          }
        }
        return style;
      },
    });

    map.addLayer(clusters);

    click = false;
    document.getElementById("addPoint").style.display = "none";

    var params = {
      name: nom,
      description: description,
      lieu: lieu,
      image: imageName[0],
      longitude: clickCoordinateLongitude,
      latitude: clickCoordinateLatitude,
    };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/writeJSON", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(params));

    document.getElementById("nom").value = "";
    document.getElementById("lieu").value = "";
    document.getElementById("description").value = "";
    const images = document.querySelectorAll(".file");

    images.forEach((box) => {
      box.remove();
    });
  } else {
    if (nom == "")
      document.getElementById((id = "textNom")).style.color = "red";
    if (lieu == "")
      document.getElementById((id = "textLieu")).style.color = "red";
    if (description == "")
      document.getElementById((id = "textDescription")).style.color = "red";
    if (imageName.length == 0)
      document.getElementById((id = "textImage")).style.color = "red";
  }
}

// Annulation d'un point
function cancelLieu() {
  click = false;
  document.getElementById("addPoint").style.display = "none";
  document.getElementById("nom").value = "";
  document.getElementById("lieu").value = "";
  document.getElementById("description").value = "";
  const images = document.querySelectorAll(".file");

  images.forEach((box) => {
    box.remove();
  });
}