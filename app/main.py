from __future__ import annotations

import io
import sys
import time
import zipfile
import webbrowser
from pathlib import Path
from typing import List

import qrcode
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.settings import APP_NAME, DEFAULT_PORT, get_paths
from app.net import get_lan_ip
from app.tray import start_tray
from datetime import datetime, timedelta

# =========================
# PyInstaller-safe paths
# =========================
if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent.parent

WEB_DIR = BASE_DIR / "web"
paths = get_paths()

app = FastAPI(title=APP_NAME)
app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

SESSION_ID = str(int(time.time()))  # QR refresh per launch


# =========================
# Auto-clean (older than 2 days)
# =========================
def auto_clean(days=2):
    cutoff = datetime.now() - timedelta(days=days)
    for folder in [paths.inbox, paths.share]:
        for f in folder.glob("*"):
            if f.is_file() and datetime.fromtimestamp(f.stat().st_mtime) < cutoff:
                try:
                    f.unlink()
                except Exception:
                    pass


# =========================
# Helpers
# =========================
def safe_name(name: str) -> str:
    name = name.replace("\\", "/").split("/")[-1]
    name = name.replace("..", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return name


# =========================
# Routes
# =========================
@app.get("/", response_class=HTMLResponse)
def index():
    return (WEB_DIR / "index.html").read_text(encoding="utf-8")


@app.get("/api/status")
def status():
    return {
        "app": APP_NAME,
        "ip": get_lan_ip(),
        "port": DEFAULT_PORT,
        "session": SESSION_ID,
    }


@app.get("/qr.png")
def qr_png():
    url = f"http://{get_lan_ip()}:{DEFAULT_PORT}/?s={SESSION_ID}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.post("/api/upload")
async def upload(files: List[UploadFile] = File(...)):
    saved = []
    for f in files:
        name = safe_name(f.filename or "file")
        dst = paths.inbox / name
        if dst.exists():
            dst = paths.inbox / f"{dst.stem}_{int(time.time())}{dst.suffix}"

        with dst.open("wb") as out:
            while chunk := await f.read(1024 * 1024):
                out.write(chunk)

        saved.append(dst.name)

    return {"ok": True, "files": saved}


@app.get("/api/files")
def list_files():
    return {
        "ok": True,
        "files": [
            {"name": f.name, "bytes": f.stat().st_size}
            for f in paths.share.glob("*") if f.is_file()
        ]
    }


@app.get("/api/download/{filename}")
def download(filename: str):
    p = paths.share / safe_name(filename)
    if not p.exists():
        raise HTTPException(404)
    return FileResponse(p, filename=p.name)


@app.get("/api/download-zip")
def download_zip():
    def zip_stream():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for f in paths.share.glob("*"):
                if f.is_file():
                    z.write(f, arcname=f.name)
        buf.seek(0)
        yield from buf

    return StreamingResponse(
        zip_stream(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=escobar_share.zip"}
    )


# =========================
# App start
# =========================
def main():
    auto_clean()
    start_tray(f"http://{get_lan_ip()}:{DEFAULT_PORT}/")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=DEFAULT_PORT,
        log_config=None,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
