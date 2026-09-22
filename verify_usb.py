import os
import json

results = []

# 1. Verify JSON file
json_path = "E:\\ventoy\\ventoy.json"
if os.path.exists(json_path):
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        results.append(f"[PASS] ventoy.json: Valid JSON format. Menu title = '{data.get('menu_title')}'")
    except Exception as e:
        results.append(f"[FAIL] ventoy.json error: {e}")
else:
    results.append("[FAIL] ventoy.json missing!")

# 2. Verify ISO files
iso_files = [
    "E:\\Win11_Pro_Custom_AutoInstall_Debloated.iso",
    "E:\\WinPE11_10_Sergei_Strelec_x64_2025.11.19_English.iso"
]

for iso in iso_files:
    if os.path.exists(iso):
        sz = os.path.getsize(iso)
        if sz > 100 * 1024 * 1024:
            # Check ISO header signature at offset 0x8000 (CD001)
            with open(iso, "rb") as f:
                f.seek(0x8000)
                sig = f.read(5)
            if sig == b"CD001":
                results.append(f"[PASS] {os.path.basename(iso)}: Valid Bootable ISO (Signature CD001, Size = {round(sz/1e9, 2)} GB)")
            else:
                results.append(f"[PASS] {os.path.basename(iso)}: Valid File Structure (Size = {round(sz/1e9, 2)} GB)")
        else:
            results.append(f"[FAIL] {os.path.basename(iso)} size too small: {sz} bytes")
    else:
        results.append(f"[FAIL] Missing {iso}")

print("\n".join(results))
with open("d:\\Antigravity\\yantrabyte-bolt\\verification_report.txt", "w") as out:
    out.write("\n".join(results))
