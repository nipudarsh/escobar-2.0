python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Clean old builds
if (Test-Path dist) { Remove-Item dist -Recurse -Force }
if (Test-Path build) { Remove-Item build -Recurse -Force }

# Build single-file exe
pyinstaller `
  --name Escobar2 `
  --onefile `
  --noconsole `
  --add-data "web;web" `
  app\main.py

Write-Host "✅ Build done: dist\Escobar2.exe"
