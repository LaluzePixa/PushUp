# Load Testing Runner Script for Windows PowerShell
# This script helps run various load tests with common configurations

# Default configuration
$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3000" }
$TEST_EMAIL = if ($env:TEST_EMAIL) { $env:TEST_EMAIL } else { "admin@example.com" }
$TEST_PASSWORD = if ($env:TEST_PASSWORD) { $env:TEST_PASSWORD } else { "adminpassword" }

# Colors
$BLUE = "Cyan"
$GREEN = "Green"
$YELLOW = "Yellow"
$RED = "Red"

function Show-Header {
    Write-Host "============================================" -ForegroundColor $BLUE
    Write-Host "   PushSaaS Load Testing Runner            " -ForegroundColor $BLUE
    Write-Host "============================================" -ForegroundColor $BLUE
    Write-Host ""
}

function Test-Server {
    Write-Host "Checking if server is running..." -ForegroundColor $YELLOW
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/healthz" -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[OK] Server is running at $API_URL" -ForegroundColor $GREEN
        return $true
    }
    catch {
        Write-Host "[ERROR] Server is not running at $API_URL" -ForegroundColor $RED
        Write-Host "Please start the server first: npm run dev" -ForegroundColor $YELLOW
        return $false
    }
}

function Test-Artillery {
    if (Get-Command artillery -ErrorAction SilentlyContinue) {
        Write-Host "[OK] Artillery is installed" -ForegroundColor $GREEN
        return $true
    }
    else {
        Write-Host "[ERROR] Artillery is not installed" -ForegroundColor $RED
        Write-Host "Install with: npm install -g artillery" -ForegroundColor $YELLOW
        return $false
    }
}

function Test-K6 {
    if (Get-Command k6 -ErrorAction SilentlyContinue) {
        Write-Host "[OK] k6 is installed" -ForegroundColor $GREEN
        return $true
    }
    else {
        Write-Host "[ERROR] k6 is not installed" -ForegroundColor $RED
        Write-Host "Install from: https://k6.io/docs/get-started/installation/" -ForegroundColor $YELLOW
        return $false
    }
}

function Show-Menu {
    Write-Host ""
    Write-Host "Select test type:" -ForegroundColor $BLUE
    Write-Host "  1) Jest Integration Tests (10K users)"
    Write-Host "  2) Jest Integration Tests (All scales)"
    Write-Host "  3) Artillery Load Test (Quick ~2 min)"
    Write-Host "  4) Artillery Load Test (Full ~10 min)"
    Write-Host "  5) k6 Stress Test (Sustained Load Only ~9 min)"
    Write-Host "  6) k6 Stress Test (Full Suite ~65 min)"
    Write-Host "  7) Run All Tests (Sequential)"
    Write-Host "  8) Generate Artillery Report from JSON"
    Write-Host "  9) View k6 HTML Report"
    Write-Host "  0) Exit"
    Write-Host ""
}

function Run-JestQuick {
    Write-Host "Running Jest Integration Tests (10K users)..." -ForegroundColor $BLUE
    Set-Location ..
    npm test -- campaign-million-users.test.js --testNamePattern="10000" --testTimeout=600000
    Set-Location load-tests
}

function Run-JestFull {
    Write-Host "Running Jest Integration Tests (All scales)..." -ForegroundColor $BLUE
    Write-Host "Warning: This will take a long time (1-2 hours)" -ForegroundColor $YELLOW
    $response = Read-Host "Continue? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Set-Location ..
        npm test -- campaign-million-users.test.js --testTimeout=3600000
        Set-Location load-tests
    }
}

function Run-ArtilleryQuick {
    if (-not (Test-Artillery) -or -not (Test-Server)) {
        return
    }
    
    Write-Host "Running Artillery Quick Load Test..." -ForegroundColor $BLUE
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    artillery run artillery-campaign-load-test.yml `
        --target $API_URL `
        --config "config.phases[0].duration=30" `
        --config "config.phases[1].duration=60" `
        --config "config.phases[2].duration=60" `
        --output "results/artillery-quick-$timestamp.json"
}

function Run-ArtilleryFull {
    if (-not (Test-Artillery) -or -not (Test-Server)) {
        return
    }
    
    Write-Host "Running Artillery Full Load Test..." -ForegroundColor $BLUE
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    artillery run artillery-campaign-load-test.yml `
        --target $API_URL `
        --output "results/artillery-full-$timestamp.json"
}

function Run-K6Sustained {
    if (-not (Test-K6) -or -not (Test-Server)) {
        return
    }
    
    Write-Host "Running k6 Sustained Load Test..." -ForegroundColor $BLUE
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $env:API_URL = $API_URL
    $env:TEST_EMAIL = $TEST_EMAIL
    $env:TEST_PASSWORD = $TEST_PASSWORD
    k6 run k6-campaign-stress.js --out "json=results/k6-sustained-$timestamp.json"
}

function Run-K6Full {
    if (-not (Test-K6) -or -not (Test-Server)) {
        return
    }
    
    Write-Host "Running k6 Full Stress Test Suite..." -ForegroundColor $BLUE
    Write-Host "This will take approximately 65 minutes" -ForegroundColor $YELLOW
    $response = Read-Host "Continue? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $env:API_URL = $API_URL
        $env:TEST_EMAIL = $TEST_EMAIL
        $env:TEST_PASSWORD = $TEST_PASSWORD
        k6 run k6-campaign-stress.js
    }
}

function Run-AllTests {
    Write-Host "Running All Tests Sequentially..." -ForegroundColor $BLUE
    Write-Host "This will take several hours!" -ForegroundColor $YELLOW
    $response = Read-Host "Continue? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Run-JestQuick
        Write-Host "[OK] Jest tests completed" -ForegroundColor $GREEN
        
        Run-ArtilleryQuick
        Write-Host "[OK] Artillery tests completed" -ForegroundColor $GREEN
        
        Run-K6Sustained
        Write-Host "[OK] k6 tests completed" -ForegroundColor $GREEN
        
        Write-Host "[OK] All tests completed!" -ForegroundColor $GREEN
    }
}

function New-ArtilleryReport {
    if (-not (Test-Artillery)) {
        return
    }
    
    Write-Host "Available Artillery JSON reports:" -ForegroundColor $BLUE
    $reports = Get-ChildItem -Path "results" -Filter "artillery-*.json" -ErrorAction SilentlyContinue
    if ($reports) {
        $reports | ForEach-Object { Write-Host $_.Name }
    }
    else {
        Write-Host "No reports found"
    }
    Write-Host ""
    
    $jsonFile = Read-Host "Enter JSON filename (or press Enter for latest)"
    
    if ([string]::IsNullOrWhiteSpace($jsonFile)) {
        $jsonFile = (Get-ChildItem -Path "results" -Filter "artillery-*.json" -ErrorAction SilentlyContinue | 
                     Sort-Object LastWriteTime -Descending | 
                     Select-Object -First 1).FullName
    }
    else {
        $jsonFile = "results\$jsonFile"
    }
    
    if (Test-Path $jsonFile) {
        $outputFile = $jsonFile -replace '\.json$', '.html'
        artillery report $jsonFile --output $outputFile
        Write-Host "[OK] Report generated: $outputFile" -ForegroundColor $GREEN
        
        # Try to open in browser
        Start-Process $outputFile
    }
    else {
        Write-Host "[ERROR] File not found: $jsonFile" -ForegroundColor $RED
    }
}

function Show-K6Report {
    if (Test-Path "load-test-summary.html") {
        Write-Host "Opening k6 report..." -ForegroundColor $GREEN
        Start-Process "load-test-summary.html"
    }
    else {
        Write-Host "[ERROR] No k6 report found. Run k6 tests first." -ForegroundColor $RED
    }
}

# Create results directory if it doesn't exist
if (-not (Test-Path "results")) {
    New-Item -ItemType Directory -Path "results" | Out-Null
}

# Main
Show-Header

while ($true) {
    Show-Menu
    $choice = Read-Host "Enter choice [0-9]"
    
    switch ($choice) {
        "1" { Run-JestQuick }
        "2" { Run-JestFull }
        "3" { Run-ArtilleryQuick }
        "4" { Run-ArtilleryFull }
        "5" { Run-K6Sustained }
        "6" { Run-K6Full }
        "7" { Run-AllTests }
        "8" { New-ArtilleryReport }
        "9" { Show-K6Report }
        "0" { 
            Write-Host "Goodbye!" -ForegroundColor $GREEN
            exit 
        }
        default {
            Write-Host "Invalid option" -ForegroundColor $RED
        }
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}
