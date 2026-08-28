# Inspect ISO Contents
$isoList = @("D:\win11office.iso", "D:\NTLite with office 2024.iso")

foreach ($iso in $isoList) {
    if (Test-Path $iso) {
        Write-Host "=================================================="
        Write-Host " INSPECTING ISO: $iso"
        Write-Host "=================================================="
        Mount-DiskImage -ImagePath $iso | Out-Null
        $vol = Get-DiskImage -ImagePath $iso | Get-Volume
        $drive = $vol.DriveLetter
        Write-Host "Mounted at Drive ${drive}:\"
        Get-ChildItem -Path "${drive}:\" | Select-Object Name, Length | Format-Table -AutoSize
        Dismount-DiskImage -ImagePath $iso | Out-Null
    }
}
