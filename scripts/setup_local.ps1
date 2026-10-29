# CloudGuard AI - Local Environment Setup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CloudGuard AI - Local Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Frontend setup
Write-Host "`n[1/3] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
npm install
npm run build
Write-Host "✓ Frontend compiled successfully." -ForegroundColor Green

# 2. Backend setup
Write-Host "`n[2/3] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests -v --cov=. --cov-fail-under=80
Write-Host "✓ Backend tests passed with >=80% coverage." -ForegroundColor Green

# 3. Infrastructure validation (optional if infra directory exists)
if (Test-Path "$PSScriptRoot\..\infra") {
    Write-Host "`n[3/3] Validating Terraform configuration..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\..\infra"
    $env:PATH = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + $env:PATH
    terraform init -backend=false
    terraform validate
    Write-Host "✓ Terraform validation passed." -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "  Run frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\.."
