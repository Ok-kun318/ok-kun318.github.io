var qrcode = null;

    function generateQRCode() {
      var textInput = document.getElementById("text-input").value;
      var useShortenAPI = document.getElementById("useShortenAPI").checked;
      var qrcodeElement = document.getElementById("qrcode");
      var generatedUrlElement = document.getElementById("generated-url");
      var copyButton = document.getElementById("copy-button");

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

          generatedUrlElement.innerHTML = "<a href='" + shortURL + "' target='_blank'>" + shortURL + "</a>";
          copyButton.style.display = "inline-block";
        }, function () {
          qrcode = new QRCode(qrcodeElement, {
            text: textInput,
            width: 256,
            height: 256,
            colorDark : StyleValue1,
            colorLight : StyleValue2
          });
          generatedUrlElement.innerHTML = "<a href='" + textInput + "' target='_blank'>" + textInput + "</a>";
          copyButton.style.display = "inline-block";
        });
      } else {
        qrcode = new QRCode(qrcodeElement, {
          text: textInput,
          width: 256,
          height: 256,
          colorDark : StyleValue1,
          colorLight : StyleValue2
        });

        generatedUrlElement.innerHTML = "<a href='" + textInput + "' target='_blank'>" + textInput + "</a>";
        copyButton.style.display = "inline-block";
      }
    }

    var copyButton = document.getElementById("copy-button");
    new ClipboardJS(copyButton);

    copyButton.addEventListener('click', function () {
      alert('クリップボードにコピーしました！');
    });

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