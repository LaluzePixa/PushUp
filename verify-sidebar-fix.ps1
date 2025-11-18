# Quick Verification Script for Sidebar User Fix

Write-Host "Verificando correccion del sidebar de usuario..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar archivos creados
Write-Host "Verificando archivos nuevos..." -ForegroundColor Yellow
$newFiles = @(
    "frontend\src\app\api\auth\login\route.ts",
    "frontend\src\app\api\auth\register\route.ts"
)

foreach ($file in $newFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  FALTA: $file" -ForegroundColor Red
    }
}

Write-Host ""

# 2. Verificar archivos modificados
Write-Host "Verificando archivos modificados..." -ForegroundColor Yellow
$modifiedFiles = @(
    "frontend\src\contexts\AuthContext.tsx"
)

foreach ($file in $modifiedFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  FALTA: $file" -ForegroundColor Red
    }
}

Write-Host ""

# 3. Verificar que el AuthContext no importe authService
Write-Host "Verificando que AuthContext no use authService..." -ForegroundColor Yellow
$authContextContent = Get-Content "frontend\src\contexts\AuthContext.tsx" -Raw

if ($authContextContent -notmatch "authService\.login|authService\.register") {
    Write-Host "  OK: AuthContext NO usa authService" -ForegroundColor Green
} else {
    Write-Host "  ADVERTENCIA: AuthContext todavia usa authService" -ForegroundColor Yellow
}

if ($authContextContent -match "fetch\('/api/auth/login") {
    Write-Host "  OK: AuthContext usa /api/auth/login" -ForegroundColor Green
} else {
    Write-Host "  ERROR: AuthContext NO usa /api/auth/login" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verificacion completa!" -ForegroundColor Green
Write-Host ""
Write-Host "Pasos siguientes:" -ForegroundColor Cyan
Write-Host "1. Iniciar el servidor backend: cd server && npm start"
Write-Host "2. Iniciar el frontend: cd frontend && npm run dev"
Write-Host "3. Probar el login en http://localhost:3001/login"
Write-Host "4. Verificar que el sidebar muestra el email del usuario"

