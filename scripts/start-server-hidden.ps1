$ProcessName = "node"
$ServerScript = "D:\Antigravity\yantrabyte-bolt\server\invoice-email-server.js"

# Check if node is running invoice-email-server.js
$isRunning = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*invoice-email-server.js*" }

if (-not $isRunning) {
    Start-Process -FilePath "node.exe" -ArgumentList "`"$ServerScript`"" -WorkingDirectory "D:\Antigravity\yantrabyte-bolt" -WindowStyle Hidden
}
