var oXHR = new XMLHttpRequest();


oXHR.onreadystatechange = reportStatus;
oXHR.open("GET", "./public/api.json", true);
oXHR.send();


function reportStatus() {
  if (oXHR.readyState == 4) {
    document.getElementById('uptime').innerHTML = this.responseText
  }
}