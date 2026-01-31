function fmtBytes(bytes){
  if(bytes < 1024) return bytes + " B";
  const units = ["KB","MB","GB","TB"];
  let i = -1;
  do { bytes = bytes/1024; i++; } while(bytes >= 1024 && i < units.length-1);
  return bytes.toFixed(1) + " " + units[i];
}

async function loadStatus(){
  const res = await fetch("/api/status");
  const st = await res.json();

  document.getElementById("qr").src = "/qr.png";

  const status = document.getElementById("status");
  status.innerHTML = `
    <div class="kv"><div class="k">PC Address</div><div class="v">http://${st.ip}:${st.port}/</div></div>
    <div class="kv"><div class="k">Port</div><div class="v">${st.port}</div></div>
    <div class="kv"><div class="k">Inbox (uploads)</div><div class="v">${st.inbox}</div></div>
    <div class="kv"><div class="k">Share (downloads)</div><div class="v">${st.share}</div></div>
  `;
  document.getElementById("sharePath").textContent = "Share folder: " + st.share;
}

function setProgress(pct){
  document.getElementById("bar").style.width = `${pct}%`;
  document.getElementById("progText").textContent = pct > 0 ? `Uploading… ${pct}%` : "";
}

function uploadFiles(fileList){
  const files = Array.from(fileList || []);
  if(!files.length) return;

  const fd = new FormData();
  for(const f of files) fd.append("files", f);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/upload", true);

  xhr.upload.onprogress = (e) => {
    if(e.lengthComputable){
      const pct = Math.round((e.loaded / e.total) * 100);
      setProgress(pct);
    }
  };

  xhr.onload = async () => {
    setProgress(0);
    const out = document.getElementById("uploadResult");
    try{
      const data = JSON.parse(xhr.responseText);
      if(data.ok){
        const lines = data.saved.map(s => `✅ ${s.name} (${fmtBytes(s.bytes)})`).join("<br/>");
        out.innerHTML = `<div class="muted small">${lines}</div>`;
      }else{
        out.textContent = "Upload failed.";
      }
    }catch{
      out.textContent = "Upload failed.";
    }
  };

  xhr.onerror = () => {
    setProgress(0);
    document.getElementById("uploadResult").textContent = "Upload error (network).";
  };

  xhr.send(fd);
}

async function refreshFiles(){
  const res = await fetch("/api/files");
  const data = await res.json();
  const files = document.getElementById("files");

  if(!data.ok){
    files.textContent = "Failed to load files.";
    return;
  }

  if(!data.files.length){
    files.innerHTML = `<div class="muted small">No files in Share folder yet.</div>`;
    return;
  }

  files.innerHTML = data.files.map(f => {
    const dl = `/api/download/${encodeURIComponent(f.name)}`;
    return `
      <div class="file">
        <div class="meta">
          <div><b>${f.name}</b></div>
          <div class="muted small">${fmtBytes(f.bytes)}</div>
        </div>
        <div class="row">
          <a class="btn solid" href="${dl}">Download</a>
          <button class="btn" data-del="${encodeURIComponent(f.name)}">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  files.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const name = btn.getAttribute("data-del");
      await fetch(`/api/files/${name}`, { method: "DELETE" });
      refreshFiles();
    });
  });
}

function wireDrop(){
  const drop = document.getElementById("drop");
  const pick = document.getElementById("filePick");

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
}

document.getElementById("refresh").addEventListener("click", refreshFiles);

loadStatus();
wireDrop();
refreshFiles();
