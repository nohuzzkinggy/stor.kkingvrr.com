// Replace with your OAuth Client ID
const CLIENT_ID = "319595032979-7ss0k66t63eap95qfjqaluucjq2lpb37.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let GoogleAuth;

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

function initClient() {
  gapi.load("client:auth2", async () => {
    await gapi.client.init({ clientId: CLIENT_ID, scope: SCOPES });
    GoogleAuth = gapi.auth2.getAuthInstance();

    const loginBtn = document.getElementById("loginBtn");
    loginBtn.innerText = GoogleAuth.isSignedIn.get() ? "Signed in" : "Sign in with Google";

    loginBtn.onclick = () => {
      if (!GoogleAuth.isSignedIn.get()) {
        GoogleAuth.signIn().then(() => updateStatus("Signed in!"));
      } else {
        GoogleAuth.signOut().then(() => updateStatus("Signed out"));
      }
    };
  });
}

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const accessToken = GoogleAuth.currentUser.get().getAuthResponse().access_token;

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

    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(xhr.responseText);
    };
    xhr.onerror = () => reject(xhr.responseText);

    xhr.send(form);
  });
}

document.getElementById("uploadBtn").addEventListener("click", async () => {
  if (!GoogleAuth || !GoogleAuth.isSignedIn.get()) {
    updateStatus("Please sign in first!");
    return;
  }

  const files = document.getElementById("fileInput").files;
  if (files.length === 0) {
    updateStatus("Select a file to upload.");
    return;
  }

  updateStatus("Uploading...");
  for (let i = 0; i < files.length; i++) {
    try {
      await uploadFile(files[i]);
      updateStatus(`Uploaded ${files[i].name}`);
    } catch (err) {
      updateStatus(`Error uploading ${files[i].name}: ${err}`);
    }
  }
  updateProgress(100);
  updateStatus("All uploads complete!");
});

initClient();
