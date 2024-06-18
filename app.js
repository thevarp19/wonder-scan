const localKey = "scannedResults";
let redirectUrl = "https://wonder-front.vercel.app/employee/scan";

function getQueryParameterByKey(key) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
}

function setupLiveReader(resultElement) {
    localStorage.removeItem(localKey);
    const container = createContainer();
    const { video, canvas, context } = setupVideoAndCanvas(container);

    document.body.insertBefore(container, resultElement);

    const constraints = {
        audio: false,
        video: {
            facingMode: "environment",
        },
    };

    const resultValue = document.getElementById("result_value");

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) =>
            initializeStream(stream, video, canvas, context, resultValue)
        )
        .catch(console.log);

    setupButtons();
}

function createContainer() {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.zIndex = "999";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.left = "0";
    container.style.top = "0";
    return container;
}

function setupVideoAndCanvas(container) {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");
    const context = canvas.getContext("2d");

    canvas.style.position = "absolute";
    container.appendChild(canvas);

    return { video, canvas, context };
}

function initializeStream(stream, video, canvas, context, resultValue) {
    video.width = 320;

    BarcodeScanner.init();
    BarcodeScanner.streamCallback = (result) => {
        resultValue.innerHTML = result[0].Value;
    };

    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("style", "width: 100%");
    video.srcObject = stream;
    video.onloadedmetadata = () => configureCanvas(video, canvas, context);
    document.body.appendChild(video);
}

function configureCanvas(video, canvas, context) {
    const canvasSetting = {
        x: 50,
        y: 20,
        width: 200,
        height: 30,
    };
    const rect = video.getBoundingClientRect();

    canvas.style.height = `${rect.height}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.style.left = `${rect.left}px`;

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
}

function setupButtons() {
    const scanType = getQueryParameterByKey("type");
    if (scanType === "multiple") {
        hideElementById("confirm_button");
    } else {
        hideElementById("submit_button");
        hideElementById("save_button");
    }

    updateRedirectUrl();
}

function hideElementById(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = "none";
}

function updateRedirectUrl() {
    const mode = getQueryParameterByKey("mode");
    const useFor = getQueryParameterByKey("useFor");
    const orderId = getQueryParameterByKey("orderId");
    const baseUrl =
        mode === "dev"
            ? "http://localhost:5173"
            : "https://wonder-front.vercel.app";

    if (useFor === "employeeSearch") {
        redirectUrl = `${baseUrl}/employee/search`;
    } else if (useFor === "employeeSize") {
        redirectUrl = `${baseUrl}/employee/sizes`;
    } else if (useFor === "employeeOrder") {
        redirectUrl = `${baseUrl}/employee/orders/${orderId}`;
    } else if (useFor === "employeePackage") {
        redirectUrl = `${baseUrl}/employee/orders/${orderId}`;
    } else {
        redirectUrl = `${baseUrl}/employee/scan`;
    }
}

function confirmResult() {
    const resultValue = document.getElementById("result_value").innerText;
    if (!resultValue || resultValue === "Value") return;

    const isOk = confirm(`Подтвердить: ${resultValue}`);
    if (isOk) {
        const step = getQueryParameterByKey("step") || 1;
        window.location.href = `${redirectUrl}?type=single&result=${resultValue}&step=${step}`;
    }
}

function saveResult() {
    const resultValueElement = document.getElementById("result_value");
    let scannedResults = getLocalScannedResults();

    if (
        !resultValueElement.innerText ||
        scannedResults.includes(resultValueElement.innerText) ||
        resultValueElement.innerText === "Значение"
    )
        return;

    scannedResults.push(resultValueElement.innerText);
    saveToLocalStorage(localKey, scannedResults);
    showNotification("Сохранено!");
}

function submitResult() {
    let scannedResults = getLocalScannedResults();
    if (
        !confirm(
            `Всего: ${scannedResults.length}\n${scannedResults.join("\n")}`
        )
    )
        return;

    const step = getQueryParameterByKey("step") || 1;
    let baseLink = `${redirectUrl}?type=multiple&step=${step}`;
    scannedResults.forEach((result) => {
        baseLink += `&result=${result}`;
    });
    window.location.href = baseLink;
}

function getLocalScannedResults() {
    try {
        return JSON.parse(localStorage.getItem(localKey)) || [];
    } catch {
        return [];
    }
}

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.error("Failed to save to local storage", err);
    }
}

const NOTIFICATION_DURATION = 1000;

function showNotification(message) {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.innerText = message;
    notification.classList.remove("hidden");
    notification.style.opacity = 1;

    setTimeout(() => {
        notification.style.opacity = 0;
        notification.addEventListener(
            "transitionend",
            () => {
                notification.classList.add("hidden");
            },
            { once: true }
        );
    }, NOTIFICATION_DURATION);
}
