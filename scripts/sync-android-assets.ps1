# Woobi - Synchronize Web Assets to Android App Assets
$src = (Resolve-Path "$PSScriptRoot\..").Path
$dest = Join-Path $src "android-app\app\src\main\assets"

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
}

$coreFiles = @(
    "index.html",
    "app.js",
    "styles.css",
    "three.min.js",
    "studio3d.js",
    "wardrobe3d.js",
    "wardrobe-astra-material.js",
    "studio-assets.html",
    "seren_vanity.glb",
    "woobi_vanity.glb",
    "wardrobe.glb",
    "seren_stage.glb",
    "seren_avatar.glb",
    "woobi_female_mannequin.glb",
    "Woobi_Female_Mannequin_Fixed.glb",
    "woobi_male_mannequin.glb"
)

foreach ($f in $coreFiles) {
    $filePath = Join-Path $src $f
    if (Test-Path $filePath) {
        Copy-Item $filePath (Join-Path $dest $f) -Force
    }
}

# Copy assets folder
Copy-Item (Join-Path $src "assets") $dest -Recurse -Force

# Copy libs folder (Offline Three.js, OrbitControls, GLTFLoader, Meshopt)
Copy-Item (Join-Path $src "libs") $dest -Recurse -Force

# Copy modules folder
Copy-Item (Join-Path $src "modules") $dest -Recurse -Force

# Copy 3D model subfolders (GLB files only to keep APK size optimal)
$mirrorDest = Join-Path $dest "3D - Mirror and stuffs"
New-Item -ItemType Directory -Force -Path $mirrorDest | Out-Null
Copy-Item (Join-Path $src "3D - Mirror and stuffs\woobi_vanity.glb") (Join-Path $mirrorDest "woobi_vanity.glb") -Force

$wardrobeDest = Join-Path $dest "3D- Wardrobe by Astra"
New-Item -ItemType Directory -Force -Path $wardrobeDest | Out-Null
Copy-Item (Join-Path $src "3D- Wardrobe by Astra\wardrobe.glb") (Join-Path $wardrobeDest "wardrobe.glb") -Force

$stageDest = Join-Path $dest "3D - Stage by Astra"
New-Item -ItemType Directory -Force -Path $stageDest | Out-Null
Copy-Item (Join-Path $src "3D - Stage by Astra\seren_stage.glb") (Join-Path $stageDest "seren_stage.glb") -Force

$mannequinDest = Join-Path $dest "3D - Mannequin By Astra"
New-Item -ItemType Directory -Force -Path $mannequinDest | Out-Null
Copy-Item (Join-Path $src "3D - Mannequin By Astra\Woobi_Female_Mannequin.glb") (Join-Path $mannequinDest "Woobi_Female_Mannequin.glb") -Force
Copy-Item (Join-Path $src "Woobi_Female_Mannequin_Fixed.glb") (Join-Path $mannequinDest "Woobi_Female_Mannequin_Fixed.glb") -Force
Copy-Item (Join-Path $src "3D - Mannequin By Astra\Woobi_Male_Mannequin.glb") (Join-Path $mannequinDest "Woobi_Male_Mannequin.glb") -Force

Write-Host "[SUCCESS] Assets synchronized to Android app assets successfully."
