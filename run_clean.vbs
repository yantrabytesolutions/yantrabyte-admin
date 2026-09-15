Set UAC = CreateObject("Shell.Application")
UAC.ShellExecute "diskpart.exe", "/s ""d:\Antigravity\yantrabyte-bolt\clean_cmd.txt""", "", "runas", 1
