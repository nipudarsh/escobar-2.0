const drop = document.getElementById("drop");
const pick = document.getElementById("filePick");
const bar = document.getElementById("bar");
const result = document.getElementById("result");
const filesBox = document.getElementById("files");

function upload(files) {
  const fd = new FormData();
  [...files].forEach(f => fd.append("files", f));

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/upload");

  xhr.upload.onprogress = e => {
    if (e.lengthComputable)
      bar.style.width = (e.loaded / e.total * 100) + "%";
  };

  xhr.onload = () => {
    bar.style.width = "0%";
    result.innerText = "Upload complete ✔";
    loadFiles();
  };

  xhr.send(fd);
}

drop.ondragover = e => e.preventDefault();
drop.ondrop = e => {
  e.preventDefault();
  upload(e.dataTransfer.files);
};

pick.onchange = () => upload(pick.files);

async function loadFiles() {
  const r = await fetch("/api/files");
  const d = await r.json();
  filesBox.innerHTML = d.files.map(f =>
    `<div>${f.name} — <a href="/api/download/${encodeURIComponent(f.name)}">Download</a></div>`
  ).join("");
}

document.getElementById("zip").onclick = () => {
  window.location = "/api/download-zip";
};

loadFiles();
