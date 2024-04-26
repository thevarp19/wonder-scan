const localKey = "scannedResults";
let redirectUrl = "https://wonder-front/employee/scan";

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
                result_value.innerHTML = result[0].Value;
                // BarcodeScanner.StopStreamDecode();
                // video.pause();
                // stream.getTracks()[0].stop();
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
    setupButtons();
}

function setupButtons() {
    const scanType = getQueryParameterByKey("type");
    if (scanType === "multiple") {
        const confirmButton = document.getElementById("confirm_button");
        confirmButton.style.display = "none";
    } else {
        const submitButton = document.getElementById("submit_button");
        submitButton.style.display = "none";
        const saveButton = document.getElementById("save_button");
        saveButton.style.display = "none";
    }
    const mode = getQueryParameterByKey("mode");
    if (mode === "dev") {
        redirectUrl = "http://localhost:5173//employee/scan";
    }
}

function confirmResult() {
    const result_value = document.getElementById("result_value").innerText;
    if (!result_value || result_value === "Value") {
        return;
    }
    const isOk = confirm(`Confirm: ${result_value}`);
    if (isOk) {
        window.location.href = `${redirectUrl}?type=single&result=${result_value}`;
    }
}

function saveResult() {
    const result_value = document.getElementById("result_value");
    let scannedResults = [];
    try {
        scannedResults = JSON.parse(localStorage.getItem(localKey)) || [];
    } catch {}

    if (
        !result_value.innerText ||
        scannedResults.includes(result_value.innerText) ||
        result_value.innerText === "Value"
    ) {
        return;
    }
    scannedResults.push(result_value.innerText);
    try {
        localStorage.setItem(localKey, JSON.stringify(scannedResults));
        showNotification("Saved!");
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
        let baseLink = `${redirectUrl}?type=multiple`;
        scannedResults.forEach((result) => {
            baseLink += `&result=${result}`;
        });
        window.location.href = baseLink;
    }
}

const NOTIFICATION_DURING = 1000;

function showNotification(message) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.classList.remove("hidden");
    notification.style.opacity = 1;

    setTimeout(function () {
        notification.style.opacity = 0;
        notification.addEventListener(
            "transitionend",
            function () {
                notification.classList.add("hidden");
            },
            { once: true }
        );
    }, NOTIFICATION_DURING);
}
