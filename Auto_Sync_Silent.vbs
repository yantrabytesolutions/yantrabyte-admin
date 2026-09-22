' Auto_Sync_Silent.vbs — Runs Antigravity Auto Sync completely silent in background
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Dim possibleScripts
possibleScripts = Array( _
    "I:\My Drive\Antigravity\Auto_Sync_Antigravity.ps1", _
    "D:\Antigravity\Auto_Sync_Antigravity.ps1", _
    "C:\Antigravity\Auto_Sync_Antigravity.ps1" _
)

targetScript = ""
For Each p In possibleScripts
    If fso.FileExists(p) Then
        targetScript = p
        Exit For
    End If
Next

If targetScript <> "" Then
    WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & targetScript & """", 0, False
End If

' Ensure RDP Cloud Tunnel is always running silently in the background
rdpTunnelVbs = "D:\Antigravity\Start_RemoteDesktop_Tunnel_Silent.vbs"
If fso.FileExists(rdpTunnelVbs) Then
    WshShell.Run "wscript.exe """ & rdpTunnelVbs & """", 0, False
End If

