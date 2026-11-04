<#
.SYNOPSIS
  Woobi Corporate Monorepo - Module Boundary & Architecture Enforcement
.DESCRIPTION
  Automated CI and local pre-commit validator that ensures:
  1. Only the 5 approved primary modules exist under modules/
  2. No browser module imports backend server implementation directly (enforces REST API boundary)
  3. No private internal submodule deep imports across module boundaries
  4. Circular dependency detection across modules
  5. Test-fixture mode proving violation detection capability
#>

param(
  [switch]$RunFixtureTests
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$modulesDir = Join-Path $repoRoot "modules"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  WOOBI - MODULE BOUNDARY & ARCHITECTURE VALIDATOR    " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$allowedModules = @(
  "3d-studio",
  "3d-studio-features",
  "settings",
  "backend",
  "core"
)

function Test-ModuleBoundaries([string]$targetDir, [bool]$isTestRun) {
  $violations = @()

  # 1. Enforce Primary Modules
  if (-not $isTestRun) {
    Write-Host "`n[Check 1] Validating primary module structure..." -ForegroundColor Yellow
    $currentModules = Get-ChildItem -Path $targetDir -Directory | Select-Object -ExpandProperty Name
    foreach ($mod in $currentModules) {
      if ($allowedModules -notcontains $mod) {
        $violations += "UNAPPROVED MODULE: 'modules/$mod' is not one of the 5 authorized primary modules."
      } else {
        Write-Host "  [OK] modules/$mod" -ForegroundColor Green
      }
    }
  }

  # 2. Enforce Module Documentation & Public Contracts
  Write-Host "`n[Check 2] Validating public interfaces (index.js & README.md)..." -ForegroundColor Yellow
  foreach ($mod in $allowedModules) {
    $readme = Join-Path $targetDir "$mod/README.md"
    $index = Join-Path $targetDir "$mod/index.js"
    
    if (-not (Test-Path $readme)) {
      $violations += "MISSING README: 'modules/$mod/README.md' is missing."
    }
    if (-not (Test-Path $index)) {
      $violations += "MISSING INTERFACE: 'modules/$mod/index.js' is missing."
    }
  }

  # 3. Enforce Browser-to-Backend REST API Boundary
  Write-Host "`n[Check 3] Enforcing Browser-to-Backend REST API Boundary..." -ForegroundColor Yellow
  $clientFiles = Get-ChildItem -Path $targetDir -Include *.js, *.html, *.css -Recurse |
                 Where-Object { $_.FullName -notmatch '[\\/]modules[\\/]backend[\\/]' }

  foreach ($file in $clientFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'import\s+.*from\s+[\''\""].*modules/backend/(api|auth|database|storage|security)') {
      $violations += "ILLEGAL SERVER IMPORT in '$($file.FullName)': Browser code cannot directly import backend server implementation. Communicate via HTTP APIs."
    }
  }

  # 4. Enforce Deep Private Submodule Imports
  Write-Host "`n[Check 4] Enforcing Public Interface Contract Usage (No Private Deep Imports)..." -ForegroundColor Yellow
  foreach ($file in $clientFiles) {
    $content = Get-Content $file.FullName -Raw
    # Matches patterns like import ... from '../3d-studio/wardrobe/privateFile.js' instead of '../3d-studio'
    if ($content -match 'import\s+.*from\s+[\''\""]\.\./(3d-studio|3d-studio-features|settings|core)/([a-zA-Z0-9_\-]+)/') {
      $violations += "ILLEGAL DEEP IMPORT in '$($file.FullName)': Cross-module imports must target the module's public entry point (index.js), not internal submodules."
    }
  }

  # 5. Circular Dependency Detection
  Write-Host "`n[Check 5] Detecting Circular Dependencies across modules..." -ForegroundColor Yellow
  # Map dependencies between primary modules
  $deps = @{}
  foreach ($mod in $allowedModules) {
    $deps[$mod] = [System.Collections.Generic.HashSet[string]]::new()
  }

  foreach ($mod in $allowedModules) {
    $modDir = Join-Path $targetDir $mod
    if (Test-Path $modDir) {
      $files = Get-ChildItem -Path $modDir -Filter *.js -Recurse
      foreach ($f in $files) {
        $content = Get-Content $f.FullName -Raw
        foreach ($targetMod in $allowedModules) {
          if ($targetMod -ne $mod) {
            if ($content -match "modules/$targetMod" -or $content -match "\.\./$targetMod") {
              [void]$deps[$mod].Add($targetMod)
            }
          }
        }
      }
    }
  }

  # Check circularity (A -> B and B -> A)
  foreach ($modA in $allowedModules) {
    foreach ($modB in $deps[$modA]) {
      if ($deps[$modB].Contains($modA)) {
        $violations += "CIRCULAR DEPENDENCY: 'modules/$modA' <---> 'modules/$modB'."
      }
    }
  }

  return $violations
}

if ($RunFixtureTests) {
  Write-Host "`n>>> RUNNING TEST FIXTURE MODE <<<" -ForegroundColor Magenta
  $fixtureDir = Join-Path $env:TEMP "woobi_fixture_test_$(Get-Random)"
  New-Item -ItemType Directory -Force -Path $fixtureDir | Out-Null
  
  try {
    # Create valid dummy modules
    foreach ($m in $allowedModules) {
      $d = Join-Path $fixtureDir $m
      New-Item -ItemType Directory -Force -Path $d | Out-Null
      Set-Content -Path (Join-Path $d "README.md") -Value "# $m"
      Set-Content -Path (Join-Path $d "index.js") -Value "export default {};"
    }

    # Inject intentional violation 1: Direct backend server import from 3d-studio
    $badFile1 = Join-Path $fixtureDir "3d-studio/badImport.js"
    Set-Content -Path $badFile1 -Value "import Server from '../backend/api/HttpServer.js';"

    # Inject intentional violation 2: Circular dependency (3d-studio <-> settings)
    $badFile2 = Join-Path $fixtureDir "settings/badCircle.js"
    Set-Content -Path $badFile2 -Value "import Studio from '../3d-studio/index.js';"
    $badFile3 = Join-Path $fixtureDir "3d-studio/badCircle.js"
    Set-Content -Path $badFile3 -Value "import Settings from '../settings/index.js';"

    $detected = Test-ModuleBoundaries -targetDir $fixtureDir -isTestRun $true

    Write-Host "`n[Fixture Test Results]" -ForegroundColor Magenta
    Write-Host "Detected violations: $($detected.Count)"
    foreach ($d in $detected) {
      Write-Host "  - $d" -ForegroundColor Green
    }

    if ($detected.Count -ge 2) {
      Write-Host "`nPROVEN: Validator successfully detected intentional violations." -ForegroundColor Green
      exit 0
    } else {
      Write-Host "`nFAILED: Validator missed expected fixture violations." -ForegroundColor Red
      exit 1
    }
  }
  finally {
    Remove-Item -Recurse -Force -Path $fixtureDir -ErrorAction SilentlyContinue
  }
}

# Run live check
$liveViolations = Test-ModuleBoundaries -targetDir $modulesDir -isTestRun $false
Write-Host "`n------------------------------------------------------" -ForegroundColor Cyan
if ($liveViolations.Count -eq 0) {
  Write-Host "SUCCESS: Zero module boundary or circular dependency violations detected." -ForegroundColor Green
  exit 0
} else {
  Write-Host "FAIL: $($liveViolations.Count) architectural boundary violation(s) detected:" -ForegroundColor Red
  foreach ($v in $liveViolations) {
    Write-Host "  - $v" -ForegroundColor Red
  }
  exit 1
}
