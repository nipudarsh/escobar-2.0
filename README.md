
# Escobar 2.0 — Local PC ↔ Mobile File Transfer (Windows)

Escobar 2.0 turns a Windows PC into a fast local file-transfer hub using Wi-Fi / hotspot.  
Any device with a browser can upload/download with drag & drop and a QR pairing flow.

## Features
- Works on: mobile hotspot ↔ PC Wi-Fi, PC hotspot ↔ mobile Wi-Fi, same Wi-Fi
- Drag & drop upload + progress bar
- Download files from PC Share folder
- QR code pairing
- Streaming transfer (handles large files efficiently)
- Portable build: single `.exe` (no environment needed for end users)

## Folders
- **Inbox (uploads land here):** `~/Downloads/Escobar_Transfers/Inbox`
- **Share (downloads served from here):** `~/Downloads/Escobar_Transfers/Share`

## Run (dev)
```powershell
.\scripts\run_dev.ps1

Build (portable exe)
.\scripts\build.ps1

```
###Output:

dist\Escobar2.exe

##Firewall note (Windows)

Allow Escobar2.exe on Private networks when Windows prompts.
If not prompted: Windows Security → Firewall → Allow an app → add Escobar2.exe.


---

## `LICENSE` (MIT)
```txt
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
