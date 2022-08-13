let map;
let click = false;
let hoverMarker = false;
let clusterHoverMarker = false;
let clickCoordinateLatitude;
let clickCoordinateLongitude;
var fileobj;

function initMap() {
  // Initialisation de la map
  map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    view: new ol.View({
      center: [0, 0],
      zoom: 2,
    }),
  });

  var geocoder = new Geocoder("nominatim", {
    provider: "osm",
    autoComplete: true,
    lang: "fr-FR",
    placeholder: "Search for ...",
    limit: 5,
    keepOpen: false,
  });

  map.addControl(geocoder);

  geocoder.on("addresschosen", function (evt) {
    map.getLayers().forEach((layer) => {
      if (layer && layer.get("name") != undefined) {
        if (layer.get("name").includes("geocoder-layer")) {
          map.removeLayer(layer);
        }
      }
    });
  });

  // Ajout des points
  initPoint();

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

  //  Afichage d'un pop up avec quelque info
  var feature_onHover;
  map.on("pointermove", function (evt) {
    feature_onHover = map.forEachFeatureAtPixel(
      evt.pixel,
      function (feature, layer) {
        return feature;
      }
    );

    if (feature_onHover != undefined) {
      if (feature_onHover.get("features").length == 1) {
        hoverMarker = true;
        var content = document.getElementById("popup-content");
        overlay.setPosition(evt.coordinate);
        content.innerHTML =
          '<img src="assets/images/uploads/' +
          feature_onHover.get("features")[0].getProperties().image +
          '"> <h3 class="text-lg mx-1 my-4 ">' +
          feature_onHover.get("features")[0].getProperties().name +
          '</h3><p class="text-sm">' +
          feature_onHover.get("features")[0].getProperties().description +
          "</p>";
        container.style.display = "block";
      } else {
        clusterHoverMarker = true;
        var content = document.getElementById("popup-content");
        overlay.setPosition(evt.coordinate);
        content.innerHTML = "<ul>";
        feature_onHover.get("features").forEach((element) => {
          content.innerHTML += "<li>" + element.getProperties().name + "</li>";
        });
        content.innerHTML += "</ul>";
        container.style.display = "block";
      }
    } else {
      hoverMarker = false;
      clusterHoverMarker = false;
      container.style.display = "none";
    }

    map.on("click", function (event) {
      if (hoverMarker) {
        document.getElementById("info").style.display = "flex";
        document.getElementById("parent").classList.add("w-10/12");
        document.getElementById("titreInfo").innerText = feature_onHover
          .get("features")[0]
          .getProperties().name;
        document.getElementById("descriptionInfo").innerText = feature_onHover
          .get("features")[0]
          .getProperties().description;
        document.getElementById("lieuInfo").innerText = feature_onHover
          .get("features")[0]
          .getProperties().lieu;
        document.getElementById("imageInfo").src =
          "assets/images/uploads/" +
          feature_onHover.get("features")[0].getProperties().image;

        var ext = feature_onHover.get("features")[0].getGeometry().getExtent();
        var center = ol.extent.getCenter(ext);
        map.setView(
          new ol.View({
            center: [center[0], center[1]],
            zoom: 18,
          })
        );

        var modal = document.getElementById("imageModal");

        var img = document.getElementById("imageInfo");
        var modalImg = document.getElementById("img01");
        var captionText = document.getElementById("caption");
        img.onclick = function () {
          modal.style.display = "block";
          modalImg.src = this.src;
          captionText.innerHTML =
            document.getElementById("titreInfo").innerText;
        };

        var span = document.getElementsByClassName("close")[0];

        span.onclick = function () {
          modal.style.display = "none";
        };
      }

      if (clusterHoverMarker) {
        // var center = ol.extent.getCenter(
        //   feature_onHover.getGeometry().getExtent()
        // );
        // map.setView(
        //   new ol.View({
        //     center: [center[0], center[1]],
        //     zoom: 12,
        //   })
        // );
        map.getView().fit(feature_onHover.getExtent)
      }
    });
  });

  var container = document.getElementById("popup");
  var closer = document.getElementById("popup-closer");

  var overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
  });
  map.addOverlay(overlay);

  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };
}

function closeInfo() {
  document.getElementById("info").style.display = "none";
  document.getElementById("parent").classList.remove("w-10/12");
}

// Initialisation des points deja créer
function initPoint() {
  let xhr = new XMLHttpRequest();

  // 2. Configure it: GET-request for the URL /article/.../load
  xhr.open("GET", "/readJSON");

  // 3. Send the request over the network
  xhr.send();

  // 4. This will be called after the response is received
  xhr.onload = function () {
    if (xhr.status != 200) {
      alert(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
    } else {
      var features = [];
      var responseJSON = JSON.parse(xhr.response);

      for (let index = 0; index < responseJSON.marker.length; index++) {
        const element = responseJSON.marker[index];

        var iconFeature = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.fromLonLat([element.longitude, element.latitude])
          ),
        });

        iconFeature.setProperties({
          name: element.name,
          lieu: element.lieu,
          description: element.description,
          image: element.image,
        });
        features.push(iconFeature);
      }

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
    }
  };
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

function showLegende(){
  if(document.getElementById("legende").style.display == 'none' || document.getElementById("legende").style.display == '' ) {
    document.getElementById("legende").style.display = "block";
  } else if(document.getElementById("legende").style.display == 'block' ) document.getElementById("legende").style.display = "none";
}