from __future__ import annotations
import socket

def get_lan_ip() -> str:
    """
    Best-effort LAN IP detection without external calls.
    Works well on Wi-Fi/hotspot scenarios.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # We don't need the remote host to be reachable; this triggers interface selection.
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        return ip
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()
