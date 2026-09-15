import os
import json

drives = [f"{chr(d)}:\\" for d in range(65, 91) if os.path.exists(f"{chr(d)}:\\")]
print("Mounted drives:", drives)

ventoy_found = False
for d in drives:
    ventoy_dir = os.path.join(d, "ventoy")
    iso_file = os.path.join(d, "WinPE11_10_Sergei_Strelec_2025.iso")
    win11_iso = os.path.join(d, "Win11_Pro_Custom_AutoInstall_Debloated.iso")
    
    if os.path.exists(ventoy_dir) or os.path.exists(iso_file) or os.path.exists(win11_iso):
        ventoy_found = True
        print(f"[+] Found Ventoy USB drive at {d}")
        if not os.path.exists(ventoy_dir):
            os.makedirs(ventoy_dir)
        
        config = {
            "theme": {
                "display_mode": "GUI",
                "ventoy_color": "cyan"
            },
            "menu_title": "YantraByte Solutions - Master IT Technician Suite",
            "control": [
                {
                    "VTOY_DEFAULT_SEARCH_ROOT": "/",
                    "VTOY_WIN11_BYPASS_CHECK": "1",
                    "VTOY_WIN11_BYPASS_NRO": "1",
                    "VTOY_SECONDARY_BOOT_MENU": "1"
                }
            ]
        }
        
        json_path = os.path.join(ventoy_dir, "ventoy.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4)
        
        print(f"[SUCCESS] Updated Ventoy configuration at {json_path}")

if not ventoy_found:
    print("[!] No Ventoy USB drive detected yet. Please ensure the USB drive is connected.")
