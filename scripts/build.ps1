$ErrorActionPreference = "Stop"

# Force Python 3.13 (change to 3.12 if needed)
$PY = "py -3.13"

Write-Host "Using Python:" -ForegroundColor Green
& $PY -c "import sys; print(sys.version)"

Write-Host "Upgrading pip..." -ForegroundColor Green
& $PY -m pip install --upgrade pip

Write-Host "Installing requirements..." -ForegroundColor Green
& $PY -m pip install -r requirements.txt

# Clean old builds
if (Test-Path dist) { Remove-Item dist -Recurse -Force }
if (Test-Path build) { Remove-Item build -Recurse -Force }
if (Test-Path Escobar2.spec) { Remove-Item Escobar2.spec -Force }

Write-Host "Building Escobar2.exe..." -ForegroundColor Green
& $PY -m PyInstaller `
  --name Escobar2 `
  --onefile `
  --noconsole `
  --add-data "web;web" `
  app\main.py

Write-Host "✅ Build done: dist\Escobar2.exe" -ForegroundColor Green
