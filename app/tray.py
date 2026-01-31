import threading
import webbrowser
import pystray
from pystray import MenuItem as Item
from PIL import Image, ImageDraw


def create_icon():
    img = Image.new("RGB", (64, 64), "black")
    d = ImageDraw.Draw(img)
    d.rectangle((8, 8, 56, 56), outline="green", width=4)
    d.text((18, 20), "E2", fill="green")
    return img


def start_tray(url):
    def run():
        icon = pystray.Icon(
            "Escobar2",
            create_icon(),
            menu=pystray.Menu(
                Item("Open Web UI", lambda: webbrowser.open(url)),
                Item("Quit", lambda: icon.stop()),
            ),
        )
        icon.run()

    threading.Thread(target=run, daemon=True).start()
