var qrcode = null;

document.addEventListener('DOMContentLoaded', function () {
  var clipboard = new ClipboardJS('#copyButton');
});

function copyToClipboard() {
  var generatedUrlElement = document.getElementById("generated-url");
  var generatedUrl = generatedUrlElement.querySelector('a').getAttribute('href');

  var textArea = document.createElement("textarea");
  textArea.value = generatedUrl;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'コピーが成功しました' : 'コピーに失敗しました';
    console.log(msg);
  } catch (err) {
    console.error('コピーに失敗しました', err);
  }

  document.body.removeChild(textArea);
}



    function generateQRCode() {
      var textInput = document.getElementById("text-input").value;
      var useShortenAPI = document.getElementById("useShortenAPI").checked;
      var qrcodeElement = document.getElementById("qrcode");
      var generatedUrlElement = document.getElementById("generated-url");
      var copyButton = document.getElementById("copy-button");
      const SelectElement1 = document.querySelector('body');
      const SelectStyle1 = getComputedStyle(SelectElement1);
      const StyleValue1 = String(SelectStyle1.getPropertyValue('--textcolor')).trim();
      const SelectElement2 = document.querySelector('body');
      const SelectStyle2 = getComputedStyle(SelectElement2);
      const StyleValue2 = String(SelectStyle2.getPropertyValue('--bgcolor')).trim();

      if (qrcode !== null) {
        qrcodeElement.innerHTML = "";
      }

      if (useShortenAPI) {
        shortenURL(textInput, function (shortURL) {
          qrcode = new QRCode(qrcodeElement, {
            text: shortURL,
            width: 256,
            height: 256,
            colorDark : StyleValue1,
            colorLight : StyleValue2
          });

          generatedUrlElement.innerHTML = "<a href='" + shortURL + "' target='_blank' id='kekka'>" + shortURL + "</a>";
        }, function () {
          qrcode = new QRCode(qrcodeElement, {
            text: textInput,
            width: 256,
            height: 256,
            colorDark : StyleValue1,
            colorLight : StyleValue2
          });
          generatedUrlElement.innerHTML = "<a href='" + textInput + "' target='_blank' id='kekka'>" + textInput + "</a>";
        });
      } else {
        qrcode = new QRCode(qrcodeElement, {
          text: textInput,
          width: 256,
          height: 256,
          colorDark : StyleValue1,
          colorLight : StyleValue2
        });

        generatedUrlElement.innerHTML = "<a href='" + textInput + "' target='_blank' id='kekka'>" + textInput + "</a>";
      }
    }
    function shortenURL(url, successCallback, errorCallback) {

      var apiEndpoint = "https://api.activetk.jp/urlmin/set?url=" + encodeURIComponent(url);

      fetch(apiEndpoint)
        .then(response => {
          if (!response.ok) {
            throw new Error("APIリクエストに失敗しました。");
          }
          return response.json();
        })
        .then(data => {
          if (data.status === "OK" && data.ResultURL) {
            successCallback(data.ResultURL);
          } else {
            throw new Error("短縮URLの取得に失敗しました。");
          }
        })
        .catch(error => {
          console.error(error);
          errorCallback();
        });
    }