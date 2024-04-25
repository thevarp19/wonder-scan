const localKey = "scannedResults";

function getQueryParameterByKey(key) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
}

function setupLiveReader(resultElement) {
    localStorage.removeItem(localKey);
    var container = document.createElement("div");

    container.style.position = "absolute";
    container.style.zIndex = "999";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.left = "0";
    container.style.top = "0";

    var canvas = document.createElement("canvas");
    var video = document.createElement("video");
    var context = canvas.getContext("2d");

    canvas.style.position = "absolute";

    container.appendChild(canvas);

    document.body.insertBefore(container, resultElement);

    const constraints = {
        audio: false,
        video: {
            facingMode: "environment",
        },
    };

    var result_value = document.getElementById("result_value");

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            video.width = 320;

            BarcodeScanner.init();
            BarcodeScanner.streamCallback = function (result) {
                // console.log("barcode detected, stream will stop");
                // console.log(result);
                result_value.innerHTML = result[0].Value;
                // resultElement.innerHTML = result[0].Value;
                // BarcodeScanner.StopStreamDecode();
                // video.pause();
                // stream.getTracks()[0].stop();
                // container.style.display = "none";
            };

            video.setAttribute("autoplay", "");
            video.setAttribute("playsinline", "");
            video.setAttribute("style", "width: 100%");
            video.srcObject = stream;
            container.appendChild(video);
            video.onloadedmetadata = function (e) {
                var canvasSetting = {
                    x: 50,
                    y: 20,
                    width: 200,
                    height: 30,
                };
                var rect = video.getBoundingClientRect();
                canvas.style.height = rect.height + "px";
                canvas.style.width = rect.width + "px";
                canvas.style.top = rect.top + "px";
                canvas.style.left = rect.left + "px";
                const overlayColor = "rgba(0,0,0,0.9)";
                context.fillStyle = overlayColor;
                context.fillRect(0, 0, rect.width, rect.height);
                context.clearRect(
                    canvasSetting.x,
                    canvasSetting.y,
                    canvasSetting.width,
                    canvasSetting.height
                );
                context.strokeStyle = "#ff671f";
                context.strokeRect(
                    canvasSetting.x,
                    canvasSetting.y,
                    canvasSetting.width,
                    canvasSetting.height
                );
                video.play();
                BarcodeScanner.DecodeStream(video);
            };
        })
        .catch(function (err) {
            console.log(err);
        });
}

function saveResult() {
    var result_value = document.getElementById("result_value");
    let scannedResults = [];
    try {
        scannedResults = JSON.parse(localStorage.getItem(localKey)) || [];
    } catch {}
    if (scannedResults.includes(result_value.innerText)) {
        return;
    }
    scannedResults.push(result_value.innerText);
    try {
        localStorage.setItem(localKey, JSON.stringify(scannedResults));
    } catch {}
}

function submitResult() {
    let scannedResults = [];
    try {
        scannedResults = JSON.parse(localStorage.getItem(localKey)) || [];
    } catch {}
    let isOk = confirm(
        `Total: ${scannedResults.length}\n${scannedResults.join("\n")}`
    );
    if (isOk) {
        let resultKey = getQueryParameterByKey("resultKey");
        window.location.href = `http://localhost:5173/employee/scan?resultKey=${resultKey}&results=${scannedResults.join(
            ","
        )}`;
    }
}
