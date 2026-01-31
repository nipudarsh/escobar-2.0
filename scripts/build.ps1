$ErrorActionPreference = "Stop"

$PYTHON = "C:\Users\Nipun\AppData\Local\Programs\Python\Python313\python.exe"

if (!(Test-Path $PYTHON)) {
    throw "Python not found at $PYTHON"
}

Write-Host "Using Python:" -ForegroundColor Green
& $PYTHON -c "import sys; print(sys.version)"

Write-Host "Installing requirements..." -ForegroundColor Green
& $PYTHON -m pip install -r requirements.txt

if (Test-Path dist) { Remove-Item dist -Recurse -Force }
if (Test-Path build) { Remove-Item build -Recurse -Force }
if (Test-Path Escobar2.spec) { Remove-Item Escobar2.spec -Force }

Write-Host "Building Escobar2.exe..." -ForegroundColor Green
& $PYTHON -m PyInstaller `
  --name Escobar2 `
  --onefile `
  --noconsole `
  --hidden-import=pystray `
  --hidden-import=PIL `
  --add-data "web;web" `
  app\main.py

Write-Host "✅ BUILD SUCCESS → dist\Escobar2.exe" -ForegroundColor Green
