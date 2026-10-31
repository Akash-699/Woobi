<#
.SYNOPSIS
  Woobi Corporate Monorepo - Module Boundary & Architecture Enforcement
.DESCRIPTION
  Automated CI and local pre-commit validator that ensures:
  1. Only the 5 approved primary modules exist under modules/
  2. No browser module imports backend server implementation directly (enforces REST API boundary)
  3. All submodules have defined boundaries and documentation
#>

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$modulesDir = Join-Path $repoRoot "modules"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  WOOBI - MODULE BOUNDARY & ARCHITECTURE VALIDATION   " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$allowedModules = @(
  "3d-studio",
  "3d-studio-features",
  "settings",
  "backend",
  "core"
)

$violations = @()

# 1. Enforce Primary Modules
Write-Host "`n[Check 1] Validating primary module structure under modules/..." -ForegroundColor Yellow
$currentModules = Get-ChildItem -Path $modulesDir -Directory | Select-Object -ExpandProperty Name
foreach ($mod in $currentModules) {
  if ($allowedModules -notcontains $mod) {
    $violations += "UNAPPROVED MODULE: 'modules/$mod' is not one of the 5 authorized primary modules."
  } else {
    Write-Host "  [OK] modules/$mod" -ForegroundColor Green
  }
}

# 2. Enforce Module Documentation & Public Contracts
Write-Host "`n[Check 2] Validating public interfaces (index.js & README.md)..." -ForegroundColor Yellow
foreach ($mod in $allowedModules) {
  $readme = Join-Path $modulesDir "$mod/README.md"
  $index = Join-Path $modulesDir "$mod/index.js"
  
  if (-not (Test-Path $readme)) {
    $violations += "MISSING README: 'modules/$mod/README.md' is missing."
  }
  if (-not (Test-Path $index)) {
    $violations += "MISSING INTERFACE: 'modules/$mod/index.js' is missing."
  }
}

# 3. Enforce Browser-to-Backend Architecture Boundary (No Server-side Imports in Client)
Write-Host "`n[Check 3] Enforcing Browser-to-Backend REST API Boundary..." -ForegroundColor Yellow
$clientFiles = Get-ChildItem -Path (Join-Path $repoRoot "modules") -Include *.js, *.html, *.css -Recurse |
               Where-Object { $_.FullName -notmatch '\\modules\\backend\\' }

foreach ($file in $clientFiles) {
  $content = Get-Content $file.FullName -Raw
  if ($content -match 'import\s+.*from\s+[\''\""].*modules/backend/(api|auth|database|storage|security)') {
    $violations += "ILLEGAL IMPORT in '$($file.FullName)': Browser code cannot directly import backend server implementation. Communicate via HTTP APIs."
  }
}

# Summary
Write-Host "`n------------------------------------------------------" -ForegroundColor Cyan
if ($violations.Count -eq 0) {
  Write-Host "SUCCESS: All module boundaries and architectural contracts verified." -ForegroundColor Green
  exit 0
} else {
  Write-Host "FAIL: $($violations.Count) architectural boundary violation(s) detected:" -ForegroundColor Red
  foreach ($v in $violations) {
    Write-Host "  - $v" -ForegroundColor Red
  }
  exit 1
}
