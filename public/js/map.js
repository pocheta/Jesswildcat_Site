let map;
let click = false;
let hoverMarker = false;
let clusterHoverMarker = false;
let clickCoordinateLatitude;
let clickCoordinateLongitude;
var fileobj;


function startMap() {
  // Initialisation de la map
  initMap();

  // Initialisation des points
  initPoint();

  //  Afichage pop up avec quelque info "HOVER"
  var feature_onHover;
  map.on("pointermove", function (evt) {
    // Cherche le feature que on hover
    feature_onHover = map.forEachFeatureAtPixel(
      evt.pixel,
      function (feature, layer) {
        return feature;
      }
    );

    // Si le feature est diff de undefined
    if (feature_onHover != undefined) {
      // Et que le feature est un seul point
      if (feature_onHover.get("features").length == 1) {
        // On affiche  les infos du point
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
        // Sinon on affiche une liste avec le nom des points
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
      // Si le feature est undefined alors on met les flag a false
      hoverMarker = false;
      clusterHoverMarker = false;
      container.style.display = "none";
    }
  });

  // Affichage d'un modal avec les infos "ON CLICK"
  map.on("click", function (event) {
    // Si on clique et que on a hover un marqueur
    if (hoverMarker) {
      // On va afficher les infos 
      document.getElementById("info").style.display = "block";
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

      map.getView().fit(feature_onHover.get("features")[0].getGeometry(), { size: map.getSize(),maxZoom: 21, duration: 1000, padding: [50, 50, 50, 50] });

      container.style.display = "none";

      var modal = document.getElementById("imageModal");
      var img = document.getElementById("imageInfo");
      var modalImg = document.getElementById("img01");
      var captionText = document.getElementById("caption");
      // Si il y a un click sur l'image on l'affiche en gros plan
      img.onclick = function () {
        modal.style.display = "block";
        modalImg.src = this.src;
        captionText.innerHTML =
          document.getElementById("titreInfo").innerText;
      };

      // Si on clique sur la crois on close le modal
      var cross = document.getElementsByClassName("close")[0];
      cross.onclick = function () {
        modal.style.display = "none";
      };
    }

    // Si on clique sur un cluster de plusieurs point on zoom dessus
    if (clusterHoverMarker) {
      var originalFeatures = feature_onHover.get('features');

      var extent = new ol.extent.createEmpty();
      originalFeatures.forEach(function (f, index, array) {
        ol.extent.extend(extent, f.getGeometry().getExtent());
      });
      console.log(extent);
      map.getView().fit(extent, { size: map.getSize(), duration: 1000, padding: [200, 200, 200, 200] });

      clusterHoverMarker = false;
    }
  });

  // Ajout de l'overlay du popup
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

// Initialisation de la map
function initMap() {
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

// Fermeture du modal
function closeInfo() {
  document.getElementById("info").style.display = "none";
}

// Affichage de la légende
function showLegende() {
  if (document.getElementById("legende").style.display == 'none' || document.getElementById("legende").style.display == '') {
    document.getElementById("legende").style.display = "block";
  } else if (document.getElementById("legende").style.display == 'block') document.getElementById("legende").style.display = "none";
}