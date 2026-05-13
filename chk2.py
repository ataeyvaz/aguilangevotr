import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
base = r"C:\Users\Ata\Desktop\aguilangevotr"
with open(base + r"\ui_translations.json", encoding="utf-8") as f:
    d = json.load(f)
with open(base + r"\ui_translations_profile.json", encoding="utf-8") as f:
    d2 = json.load(f)
combined = {**d, **d2}
check = ["lets get started","lets go","i speak","i want to learn","choose your mode","adult mode","child mode","change language","profile","dashboard"]
print("=== TR ceviri kontrol ===")
for k in check:
    src = combined.get(k)
    if src:
        print(f"  {k:<28} | en: {src.get('en','?'):<30} | tr: {src.get('tr','EKSIK')}")
    else:
        print(f"  {k:<28} | YOK")
