import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r"C:\Users\Ata\Desktop\aguilangevotr"
with open(base + r"\ui_translations.json", encoding="utf-8") as f:
    d = json.load(f)
with open(base + r"\ui_translations_profile.json", encoding="utf-8") as f:
    d2 = json.load(f)
combined = {**d, **d2}
with_tr = sum(1 for v in combined.values() if "tr" in v)
print(f"Toplam: {with_tr}/{len(combined)} TR anahtari")
check = ["lets get started","lets go","i speak","i want to learn","choose your mode","adult mode","child mode"]
for k in check:
    src = combined.get(k)
    if src:
        print(f"  {k}: tr={src.get('tr','EKSIK')}")
    else:
        print(f"  {k}: YOK")
