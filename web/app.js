const el = (id) => document.getElementById(id);

const drop = el("drop");
const pick = el("filePick");
const bar = el("bar");
const progText = el("progText");
const uploadResult = el("uploadResult");
const filesBox = el("files");
const refreshBtn = el("refresh");
const zipBtn = el("zip");
const qrImg = el("qr");
const pcUrl = el("pcUrl");
const copyUrlBtn = el("copyUrl");
const inboxPill = el("inboxPill");
const sharePill = el("sharePill");
const toast = el("toast");

function toastMsg(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1300);
}

function fmtBytes(bytes){
  if (bytes < 1024) return bytes + " B";
  const units = ["KB","MB","GB","TB"];
  let i = -1;
  do { bytes = bytes/1024; i++; } while(bytes >= 1024 && i < units.length-1);
  return bytes.toFixed(1) + " " + units[i];
}

async function loadStatus(){
  try{
    const r = await fetch("/api/status");
    const s = await r.json();

    // Force QR refresh visually (cache bust)
    qrImg.src = "/qr.png?ts=" + Date.now();

    const url = `http://${s.ip}:${s.port}/`;
    pcUrl.textContent = url;

    // Optional: if backend returns these later, show them, otherwise keep generic
    inboxPill.textContent = "Inbox: Downloads/Escobar_Transfers/Inbox";
    sharePill.textContent = "Share: Downloads/Escobar_Transfers/Share";

    copyUrlBtn.onclick = async () => {
      try{
        await navigator.clipboard.writeText(url);
        toastMsg("Link copied");
      }catch{
        toastMsg("Copy not supported");
      }
    };
  }catch{
    pcUrl.textContent = "Status unavailable";
  }
}

function setProgress(pct, label){
  bar.style.width = `${pct}%`;
  progText.textContent = label || "";
}

function uploadFiles(fileList){
  const files = Array.from(fileList || []);
  if(!files.length) return;

  uploadResult.innerHTML = `<span class="muted">Preparing upload…</span>`;
  setProgress(0, "Starting…");

  const fd = new FormData();
  for(const f of files) fd.append("files", f);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/upload", true);
  xhr.timeout = 0;

  xhr.upload.onprogress = (e) => {
    if(e.lengthComputable){
      const pct = Math.max(1, Math.min(99, Math.round((e.loaded / e.total) * 100)));
      setProgress(pct, `Uploading… ${pct}%`);
    } else {
      setProgress(40, "Uploading…");
    }
  };

  xhr.onload = () => {
    setProgress(100, "Finalizing…");
    let ok = false;
    let items = [];

    try{
      const data = JSON.parse(xhr.responseText);
      ok = !!data.ok;
      items = data.files || data.saved || [];
    }catch{}

    if(ok){
      uploadResult.innerHTML = `<b>Saved to PC Inbox</b><br>${items.map(n => `• ${n}`).join("<br>")}`;
      toastMsg("Upload complete");
      refreshFiles();
    }else{
      uploadResult.innerHTML = `<b>Upload failed</b><br><span class="muted">Check connection / firewall.</span>`;
      toastMsg("Upload failed");
    }

    setTimeout(() => setProgress(0, ""), 900);
  };

  xhr.onerror = () => {
    uploadResult.innerHTML = `<b>Upload error</b><br><span class="muted">Network issue.</span>`;
    setProgress(0, "");
    toastMsg("Upload error");
  };

  xhr.send(fd);
}

// Dropzone UX (same-device drag only)
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("drag");
});
drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("drag");
  uploadFiles(e.dataTransfer.files);
});

pick.addEventListener("change", () => uploadFiles(pick.files));

async function refreshFiles(){
  filesBox.innerHTML = `<div class="muted small">Loading…</div>`;
  try{
    const r = await fetch("/api/files");
    const d = await r.json();

    if(!d.ok || !d.files || d.files.length === 0){
      filesBox.innerHTML = `<div class="muted small">No files in Share folder.</div>`;
      return;
    }

    filesBox.innerHTML = d.files.map(f => {
      const href = `/api/download/${encodeURIComponent(f.name)}`;
      return `
        <div class="file-row">
          <div class="file-meta">
            <div class="file-name">${f.name}</div>
            <div class="file-size">${fmtBytes(f.bytes)}</div>
          </div>
          <div class="file-actions">
            <a class="btn btn-solid" href="${href}" download>Download</a>
          </div>
        </div>
      `;
    }).join("");
  }catch{
    filesBox.innerHTML = `<div class="muted small">Failed to load files.</div>`;
  }
}

refreshBtn.addEventListener("click", refreshFiles);

zipBtn.addEventListener("click", () => {
  // This endpoint exists in your backend when ZIP feature is enabled
  window.location.href = "/api/download-zip";
  toastMsg("Preparing ZIP…");
});

loadStatus();
refreshFiles();
