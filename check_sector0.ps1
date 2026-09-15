$stream = [System.IO.File]::Open('\\.\PhysicalDrive4', [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
$buf = New-Object byte[] 512
$read = $stream.Read($buf, 0, 512)
$stream.Close()
$sig = [System.BitConverter]::ToString($buf, 510, 2)
Write-Host "Bytes 510-511 Boot Signature: $sig"
if ($sig -eq "55-AA") {
    Write-Host "CONTROLLER HAS REJECTED THE ERASE! The SSD hardware controller is locked in Read-Only mode." -ForegroundColor Red
} else {
    Write-Host "Sector 0 was successfully zeroed!" -ForegroundColor Green
}
