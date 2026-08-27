$mount = Mount-DiskImage -ImagePath "D:\iso file\Windows11.iso" -PassThru
Start-Sleep -Seconds 2
$driveLetter = (Get-DiskImage -ImagePath "D:\iso file\Windows11.iso" | Get-Volume).DriveLetter

$wimPath = "${driveLetter}:\sources\install.wim"
& dism.exe /Get-WimInfo /WimFile:"$wimPath"

Dismount-DiskImage -ImagePath "D:\iso file\Windows11.iso"
