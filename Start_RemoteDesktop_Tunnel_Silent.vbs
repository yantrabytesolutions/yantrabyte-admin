' Start_RemoteDesktop_Tunnel_Silent.vbs — Launches RDP Cloud Tunnel silently in background
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptPath = "D:\Antigravity\Start_RemoteDesktop_Tunnel.bat"
If Not fso.FileExists(scriptPath) Then
    scriptPath = "C:\Antigravity\Start_RemoteDesktop_Tunnel.bat"
End If

If fso.FileExists(scriptPath) Then
    WshShell.Run "cmd.exe /c """ & scriptPath & """", 0, False
End If
