function setmarker(name) {
  document.getElementById("Marker1").style.color = "white";
  document.getElementById("Marker2").style.color = "white";
  document.getElementById("Marker3").style.color = "white";
  document.getElementById(name).style.color = "rgb(163 230 53)";
  document.getElementById("defaultMarker").src =
    "assets/images/marker/" + name.toLowerCase() + ".png";
}
