import subprocess

script = """select disk 4
clean
"""
with open(r"C:\Users\sys1\AppData\Local\Temp\clean4.txt", "w") as f:
    f.write(script)

res = subprocess.run(["diskpart", "/s", r"C:\Users\sys1\AppData\Local\Temp\clean4.txt"], capture_output=True, text=True)
print("STDOUT:\n", res.stdout)
print("STDERR:\n", res.stderr)
