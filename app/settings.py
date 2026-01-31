from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path

APP_NAME = "Escobar 2.0"
DEFAULT_PORT = 8787

def _downloads_dir() -> Path:
    # Works on Windows; uses the user's home Downloads
    home = Path.home()
    dl = home / "Downloads"
    return dl if dl.exists() else home

@dataclass(frozen=True)
class AppPaths:
    root: Path
    inbox: Path
    share: Path

def get_paths() -> AppPaths:
    root = _downloads_dir() / "Escobar_Transfers"
    inbox = root / "Inbox"
    share = root / "Share"
    inbox.mkdir(parents=True, exist_ok=True)
    share.mkdir(parents=True, exist_ok=True)
    return AppPaths(root=root, inbox=inbox, share=share)
