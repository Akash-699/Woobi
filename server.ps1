$nodePath = "C:\Program Files\nodejs\node.exe"
if (Get-Command node -ErrorAction SilentlyContinue) {
    node "$PSScriptRoot\server.js"
} elseif (Test-Path $nodePath) {
    & $nodePath "$PSScriptRoot\server.js"
} else {
    & "$PSScriptRoot\server.exe"
}
