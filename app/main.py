from __future__ import annotations

import io
import os
import sys
import time
import webbrowser
from pathlib import Path
from typing import List

import qrcode
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.settings import APP_NAME, DEFAULT_PORT, get_paths
from app.net import get_lan_ip

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"

paths = get_paths()
app = FastAPI(title=APP_NAME)

# Serve static assets
app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")


def safe_name(name: str) -> str:
    # Prevent directory traversal
    name = name.replace("\\", "/").split("/")[-1]
    name = name.strip().replace("..", "")
    if not name:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    return name


@app.get("/", response_class=HTMLResponse)
def index():
    html = (WEB_DIR / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(html)


@app.get("/api/status")
def status():
    ip = get_lan_ip()
    return {
        "app": APP_NAME,
        "ip": ip,
        "port": DEFAULT_PORT,
        "inbox": str(paths.inbox),
        "share": str(paths.share),
    }


@app.get("/qr.png")
def qr_png():
    ip = get_lan_ip()
    url = f"http://{ip}:{DEFAULT_PORT}/"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.post("/api/upload")
async def upload(files: List[UploadFile] = File(...)):
    saved = []
    for f in files:
        filename = safe_name(f.filename or "file")
        dst = paths.inbox / filename

        # Avoid overwrite collisions
        if dst.exists():
            stem = dst.stem
            suffix = dst.suffix
            dst = paths.inbox / f"{stem}_{int(time.time())}{suffix}"

        with dst.open("wb") as out:
            while True:
                chunk = await f.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                out.write(chunk)

        saved.append({"name": dst.name, "bytes": dst.stat().st_size})
    return {"ok": True, "saved": saved}


@app.get("/api/files")
def list_share_files():
    items = []
    for p in sorted(paths.share.glob("*")):
        if p.is_file():
            st = p.stat()
            items.append({
                "name": p.name,
                "bytes": st.st_size,
                "mtime": int(st.st_mtime),
            })
    return {"ok": True, "files": items}


@app.get("/api/download/{filename}")
def download(filename: str):
    filename = safe_name(filename)
    p = paths.share / filename
    if not p.exists() or not p.is_file():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path=str(p), filename=p.name, media_type="application/octet-stream")


@app.delete("/api/files/{filename}")
def delete_file(filename: str):
    filename = safe_name(filename)
    p = paths.share / filename
    if not p.exists() or not p.is_file():
        raise HTTPException(status_code=404, detail="File not found.")
    p.unlink()
    return {"ok": True}


def open_browser():
    ip = get_lan_ip()
    url = f"http://{ip}:{DEFAULT_PORT}/"
    try:
        webbrowser.open(url)
    except Exception:
        pass


def main():
    # Allow: Escobar2.exe --no-browser --port 8787
    no_browser = "--no-browser" in sys.argv
    port = DEFAULT_PORT
    if "--port" in sys.argv:
        i = sys.argv.index("--port")
        if i + 1 < len(sys.argv):
            try:
                port = int(sys.argv[i + 1])
            except ValueError:
                port = DEFAULT_PORT

    # Update global default_port usage for endpoints
    global DEFAULT_PORT
    DEFAULT_PORT = port

    if not no_browser:
        open_browser()

    # Important: host 0.0.0.0 so mobile can access
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


if __name__ == "__main__":
    main()
