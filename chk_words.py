import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
with open(r"C:\Users\Ata\Desktop\aguilangevotr\src\data\words-tr-a1.json", encoding="utf-8") as f:
    d = json.load(f)
print(f"Toplam: {len(d)} kelime\n")
# İlk 3 ve son 3
for w in d[:3] + [None] + d[-3:]:
    if w is None: print("  ..."); continue
    print(f"  #{w['id']:>3} [{w['category']:<10}] {w['tr']:<20} EN:{w['en']:<15} ES:{w['es']:<15} PT:{w['pt']:<15} {w['emoji']}")
# PT/ES eksik kontrolü
missing_pt = [w for w in d if not w["pt"]]
missing_es = [w for w in d if not w["es"]]
print(f"\nPT eksik: {len(missing_pt)}")
print(f"ES eksik: {len(missing_es)}")
