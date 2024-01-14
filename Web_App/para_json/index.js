var queryString = window.location.search;
queryString = queryString.substring(1);
var queryParams = queryString.split("&");
var para = {};

for (var i = 0; i < queryParams.length; i++) {
    var pair = queryParams[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1] || "");
    para[key] = value;
}

var resultContainer = document.getElementById('resultContainer');

var resultJSON = JSON.stringify(para, null, 2);
resultContainer.textContent = resultJSON;