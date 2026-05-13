# 🦅 AguiLangEvoTR — Geliştirme Planı
**Oluşturulma:** Mayıs 2026
**Kaynak:** AguiLangEvo fork
**Versiyon:** v0.1 → v1.0

---

## 🎯 PROJE TANIMI

| | Değer |
|---|---|
| **Kaynak dil** | Türkçe (TR) |
| **Hedef diller** | İngilizce + İspanyolca + Portekizce |
| **Dil çiftleri** | TR→EN, TR→ES, TR→PT |
| **Hedef kitle** | Türkçe konuşanlar (Türkiye + diaspora) |
| **Arayüz** | Türkçe |
| **Platform** | Android APK |
| **Model** | $8.99 tek ödeme |

---

## ✅ TAMAMLANANLAR

- [x] AguiLangEvo'dan fork alındı
- [x] GitHub repo oluşturuldu (aguilangevotr)
- [x] CLAUDE.md oluşturuldu
- [x] ROADMAP.md oluşturuldu
- [x] Aşama 1A — Branding (package.json, capacitor.config, README)
- [x] Aşama 1B — Veritabanı (TR dil + TR→EN/ES/PT pair eklendi)
- [x] Aşama 1C — Dil sistemi (ProfileSetup TR, i18n 126 anahtar)
- [x] Aşama 2 — TR kelime listesi (99 kelime, 10 kategori, TR/EN/ES/PT)
- [x] Aşama 3 — TR/EN/ES/PT audio dosyaları eklendi

---

## ✅ AŞAMA 1 — Branding & Altyapı

### Branding
- [x] App adı → "AguiLangEvoTR" güncelle
- [x] package.json → name, description güncelle
- [x] capacitor.config.json → appId, appName güncelle
- [x] README.md güncelle
- [x] **Araç: .cjs script**

### Veritabanı
- [x] DB dosyasını yeniden adlandır → aguilangevotr.db
- [x] languages tablosuna TR ekle
- [x] language_pairs tablosuna TR→EN, TR→ES, TR→PT ekle
- [x] Eski EN/ES/PT çiftlerini temizle
- [x] **Araç: .cjs script**

### Dil Sistemi
- [x] i18n → TR arayüz anahtarları ekle
- [x] ProfileSetup → varsayılan dil TR
- [x] PAIR_LANG mantığı → TR kaynak dil
- [x] **Araç: Cline**

---

## ✅ AŞAMA 2 — TR İçerik Üretimi

### TR Kelime Listesi
- [x] A1 seviye TR kelime listesi (99 kelime, 10 kategori)
- [x] TR→EN çeviriler
- [x] TR→ES çeviriler
- [x] TR→PT çeviriler
- [x] A2 seviye 64 kelime
- [x] B1 seviye 56 kelime
- [x] B2 seviye 57 kelime
- [x] **Araç: Tencent (JSON üretimi)**

### TR Kelime DB
- [x] words_tr_a1.json → DB insert
- [x] words_tr_a2.json → DB insert
- [x] words_tr_b1.json → DB insert
- [x] words_tr_b2.json → DB insert
- [x] **Araç: .cjs script**

---

## ✅ AŞAMA 3 — Ses Üretimi

### TR Audio
- [x] TR kelimeler → tr-TR-EmelNeural → public/audio/tr/
- [x] EN hedef → AguiLangEvo'dan kopyala (/audio/en/)
- [x] ES hedef → AguiLangEvo'dan kopyala (/audio/es/)
- [x] PT hedef → AguiLangEvo'dan kopyala (/audio/pt/)
- [x] **Araç: .py script (edge-tts)**

---

## 🔄 AŞAMA 4 — UI Güncellemeleri

### Study.jsx
- [ ] TR kelime verilerini yükle
- [ ] TR ses dosyalarını çal
- [ ] Level seçici (A1/A2/B1/B2)
- [ ] **Araç: .py patch**

### PlacementTest
- [ ] TR sorular ekle (15 soru)
- [ ] TR → EN/ES/PT çoktan seçmeli
- [ ] **Araç: .cjs script**

### Conversation Packs
- [ ] TR konuşma senaryoları (8 ES + 8 PT hedefli)
- [ ] TR bot sesleri
- [ ] **Araç: Tencent + .py**

---

## 🔄 AŞAMA 5 — Test & Build

- [ ] npm run dev → tam test
- [ ] Tüm dil çiftleri test
- [ ] Android build
- [ ] APK imzala
- [ ] **Araç: Android Studio**

---

## 🔄 AŞAMA 6 — Satış & Lansman

- [ ] Gumroad → AguiLangEvoTR ürün sayfası
- [ ] Google Play TR (Türkiye pazarı)
- [ ] Açıklama metni (TR/EN)
- [ ] Twitter/sosyal medya TR lansmanı

---

## 📊 HEDEF METRİKLER (v1.0)

```
TR Kelimeler  : 243 (A1+A2+B1+B2)
TR Audio MP3  : 243+ dosya
EN/ES/PT MP3  : AguiLangEvo'dan devralındı
Conv. Pack    : 16+ TR senaryosu
Dil Çifti     : 3 (TR→EN, TR→ES, TR→PT)
APK Boyutu    : ~60MB hedef
Fiyat         : $8.99 (veya ₺299)
```

---

## 🤖 AI ARAÇ STRATEJİSİ

| Araç | Görev |
|---|---|
| **Claude (sohbet)** | Strateji, mimari, script, CLAUDE.md |
| **MiniMax** | Karmaşık scriptler |
| **Cline** | UI güncellemeleri |
| **Tencent** | TR kelime + çeviri JSON üretimi |
| **edge-tts** | TR/EN/ES/PT MP3 |
| **Git push** | Manuel terminal |

---

## 🔧 TEKNİK STACK
```
Frontend  : React + Vite + Tailwind (AguiLangEvo'dan)
Mobile    : Capacitor
DB        : SQLite (better-sqlite3)
TTS       : edge-tts (tr-TR-EmelNeural)
STT       : Web Speech API
i18n      : Custom hook
```

---

*Kaynak: github.com/ataeyvaz/aguilangevo*
*TR Repo: github.com/ataeyvaz/aguilangevotr*
*Sorumluluk: Ata + Claude (Anthropic)*