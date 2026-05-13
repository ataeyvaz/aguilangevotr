# 🦅 AguiLangEvoTR — Claude Bağlam Dosyası
> Bu dosyayı her yeni sohbette Claude'a ver: "CLAUDE.md'yi oku, devam et."

---

## ⚡ ALTIN KURALLAR (Her Zaman Geçerli)

### 1. Script-First Prensibi
> **AI modele gitmeden önce: "Bu .cjs veya .py ile yapılabilir mi?" diye sor.**

| Görev | Yöntem |
|---|---|
| DB insert/update/query | ✅ .cjs script (better-sqlite3) |
| JSON dönüştürme/birleştirme | ✅ .cjs script |
| Dosya patch (metin değiştirme) | ✅ .py script |
| MP3/ses üretimi | ✅ .py script (edge-tts) |
| UI bileşeni ekleme/güncelleme | Cline (küçük) / Claude Code (büyük) |
| Mimari karar / strateji | Claude (bu sohbet) |
| JSON/içerik üretimi | Tencent |

### 2. PowerShell Kuralları
- `node -e "..."` → tırnak sorunu çıkar, KULLANMA
- Bunun yerine: `@"..."@ | Out-File x.cjs` → `node x.cjs`
- .js uzantısı ÇALIŞMAZ (package.json "type":"module") → `.cjs` kullan
- Python scriptleri her zaman güvenli

### 3. Dosya Patch Kuralları
- Cline str_replace → encoding sorunlarına takılır, dikkatli kullan
- Büyük JSX değişikliklerinde → .py satır satır patch tercih et
- Patch sonrası mutlaka `npm run dev` ile test et
- Hata alınırsa → `git checkout src/pages/DosyaAdi.jsx` ile geri al

### 4. Token Tasarrufu
- Rutin işler için Claude'a (bu sohbet) kod yazdırma
- Claude → sadece strateji, mimari, prompt hazırlama
- MiniMax bağlantı sorunu → direkt .cjs/.py yaz

---

## 🧭 PROJE ÖZETİ

### AguiLangEvoTR (Bu Proje)
- **Kaynak:** AguiLangEvo fork
- **Konum:** `C:\Users\Ata\Desktop\aguilangevotr`
- **GitHub:** https://github.com/ataeyvaz/aguilangevotr
- **Hedef Kitle:** Türkçe konuşanlar (Türkiye + yurt dışı)
- **Dil Çiftleri:** TR→EN, TR→ES, TR→PT
- **Arayüz Dili:** Türkçe
- **Stack:** React + Vite + Tailwind + Capacitor + Python + SQLite

### AguiLangEvo (Ana Proje — Kaynak)
- **Konum:** `C:\Users\Ata\Desktop\aguilangevo`
- **GitHub:** https://github.com/ataeyvaz/aguilangevo
- **Satış:** https://ataeyvaz.gumroad.com/l/tsogik ($8.99)
- **Hedef Kitle:** ABD'deki ES/PT konuşanlar → İngilizce öğrenmek isteyenler

---

## 🔄 AguiLangEvo'dan Farklar

| Bileşen | AguiLangEvo | AguiLangEvoTR |
|---|---|---|
| Kaynak dil | EN | TR |
| Hedef diller | ES, PT | EN, ES, PT |
| Arayüz | EN/ES/PT | TR |
| Kelimeler | EN kelimeler | TR kelimeler |
| Audio | EN/ES/PT MP3 | TR/EN/ES/PT MP3 |
| Conv. packs | ES+PT | TR konuşmalar |
| Branding | AguiLangEvo 🦅 | AguiLangEvoTR 🦅 |
| Pazar | ABD Hispanic | Türkiye + diaspora |

---

## ✅ Kalıbı Devralınan (Değişmez)
- React + Vite + Tailwind yapısı
- Capacitor Android build
- SM-2 SRS Engine
- SQLite şema (15 tablo)
- ChatBot UI
- PlacementTest mantığı
- Flashcard UI
- Practice UI
- TicTacToe, Dictionary

---

## 🔄 Değiştirilecek (Öncelik Sırasıyla)

### Aşama 1 — Branding & Dil
- [ ] App adı → AguiLangEvoTR
- [ ] i18n → TR arayüz anahtarları
- [ ] ProfileSetup → TR dil seçeneği
- [ ] Dil çifti mantığı → TR→EN/ES/PT

### Aşama 2 — İçerik
- [ ] TR kelime listesi A1/A2 (Tencent ile üret)
- [ ] TR→EN çeviriler
- [ ] TR→ES çeviriler
- [ ] TR→PT çeviriler
- [ ] TR audio (edge-tts: tr-TR-EmelNeural)

### Aşama 3 — Ses
- [ ] TR kelime MP3 (tr-TR-EmelNeural)
- [ ] EN hedef MP3 (zaten var → AguiLangEvo'dan kopyala)
- [ ] ES hedef MP3 (zaten var)
- [ ] PT hedef MP3 (zaten var)

### Aşama 4 — Test & Build
- [ ] PlacementTest TR soruları
- [ ] TR conversation packs
- [ ] APK build
- [ ] Satış (Google Play TR + Gumroad)

---

## 📁 DOSYA YAPISI

```
aguilangevotr/
├── src/
│   ├── pages/
│   │   ├── Study.jsx         ← TR kelimeler gösterecek
│   │   ├── Practice.jsx
│   │   ├── ChatBot.jsx
│   │   ├── ProfileSetup.jsx  ← TR dil seçimi
│   │   └── ...
│   ├── data/
│   │   ├── words-tr-a1.json  ← TR A1 kelimeler (yapılacak)
│   │   └── words-tr-a2.json  ← TR A2 kelimeler (yapılacak)
│   └── i18n/
│       └── translations.js   ← TR anahtarlar eklenecek
├── data/
│   └── aguilangevotr.db      ← Yeni DB (TR şema)
└── public/
    └── audio/
        ├── tr/               ← TR kelime MP3 (yapılacak)
        ├── en/               ← AguiLangEvo'dan kopyala
        ├── es/               ← AguiLangEvo'dan kopyala
        └── pt/               ← AguiLangEvo'dan kopyala
```

---

## 🗄️ VERİTABANI

AguiLangEvo ile aynı şema — sadece:
- `language_id: 'tr'` eklenecek
- `languages` tablosuna TR eklenecek
- `language_pairs` tablosuna TR→EN/ES/PT eklenecek

---

## 🔊 TTS Sesleri

| Dil | Voice | Durum |
|---|---|---|
| TR | tr-TR-EmelNeural | 🔄 Yapılacak |
| EN | en-US-JennyNeural | ✅ Mevcut |
| ES | es-MX-DaliaNeural | ✅ Mevcut |
| PT | pt-BR-FranciscaNeural | ✅ Mevcut |

---

## 🤖 AI ARAÇ STRATEJİSİ

| Araç | Görev |
|---|---|
| **Claude (sohbet)** | Strateji, mimari, script yazma, CLAUDE.md güncelleme |
| **MiniMax M2.7** | Karmaşık script (bağlantı sorunlu olabilir) |
| **Cline** | Küçük UI güncellemeleri |
| **Tencent** | TR kelime listesi + çeviri üretimi |
| **edge-tts** | TR/EN/ES/PT MP3 üretimi |
| **Git push** | Her zaman manuel terminal |

---

## 🔄 DEVAM EDEN GÖREVLER

| # | Görev | Araç | Durum |
|---|---|---|---|
| 1 | Branding güncelle | Cline | 🔄 |
| 2 | TR kelime listesi A1 | Tencent | ⬜ |
| 3 | DB'ye TR dil ekle | .cjs | ⬜ |
| 4 | TR audio üret | .py | ⬜ |
| 5 | i18n TR anahtarları | Cline | ⬜ |
| 6 | PlacementTest TR | .cjs | ⬜ |
| 7 | APK build | Manuel | ⬜ |

---

## 🚀 KOMUTLAR
```powershell
cd C:\Users\Ata\Desktop\aguilangevotr
npm run dev
npm run build
npx cap sync
git add -A && git commit -m "mesaj" && git push

# Script oluştur (.cjs)
@"...kod..."@ | Out-File -FilePath script.cjs -Encoding utf8
node script.cjs
```

---

*Güncelleme: Mayıs 2026*
*Ana repo: github.com/ataeyvaz/aguilangevo*
*TR repo: github.com/ataeyvaz/aguilangevotr*