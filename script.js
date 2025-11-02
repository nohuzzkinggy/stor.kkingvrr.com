const CLIENT_ID = "319595032979-7ss0k66t63eap95qfjqaluucjq2lpb37.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient;
let accessToken = null;

function updateStatus(msg) {
    document.getElementById("status").innerText = msg;
}

function updateProgress(percent) {
    const container = document.getElementById("progressContainer");
    const bar = document.getElementById("progressBar");
    container.style.display = "block";
    bar.style.width = percent + "%";
    bar.innerText = percent + "%";
}

// Load the Google API client library
function gapiLoaded() {
    gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: "", // optional for Drive uploads
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    });
    updateStatus("Google API client loaded.");
}

// Initialize the token client for OAuth
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                updateStatus("Error: " + response.error);
                return;
            }
            accessToken = response.access_token;
            updateStatus("Signed in with Google Drive!");
        },
    });

    document.getElementById("loginBtn").onclick = () => {
        tokenClient.requestAccessToken();
    };
}

async function uploadFile(file) {
    const metadata = { name: file.name, mimeType: file.type };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart");
    xhr.setRequestHeader("Authorization", "Bearer " + accessToken);

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            updateProgress(percentComplete);
        }
    };

    return new Promise((resolve, reject) => {
        xhr.onload = () => (xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(xhr.responseText));
        xhr.onerror = () => reject(xhr.responseText);
        xhr.send(form);
    });
}

document.getElementById("uploadBtn").addEventListener("click", async () => {
    if (!accessToken) {
        updateStatus("Please sign in first!");
        return;
    }

    const files = document.getElementById("fileInput").files;
    if (!files.length) {
        updateStatus("Select a file to upload.");
        return;
    }

    for (let file of files) {
        try {
            await uploadFile(file);
            updateStatus(`Uploaded ${file.name}`);
        } catch (err) {
            updateStatus(`Error uploading ${file.name}: ${err}`);
        }
    }
    updateProgress(100);
    updateStatus("All uploads complete!");
});
