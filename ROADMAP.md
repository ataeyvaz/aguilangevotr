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

---

## 🔄 AŞAMA 1 — Branding & Altyapı

### Branding
- [ ] App adı → "AguiLangEvoTR" güncelle
- [ ] package.json → name, description güncelle
- [ ] capacitor.config.json → appId, appName güncelle
- [ ] README.md güncelle
- [ ] **Araç: .cjs script**

### Veritabanı
- [ ] DB dosyasını yeniden adlandır → aguilangevotr.db
- [ ] languages tablosuna TR ekle
- [ ] language_pairs tablosuna TR→EN, TR→ES, TR→PT ekle
- [ ] Eski EN/ES/PT çiftlerini temizle
- [ ] **Araç: .cjs script**

### Dil Sistemi
- [ ] i18n → TR arayüz anahtarları ekle
- [ ] ProfileSetup → varsayılan dil TR
- [ ] PAIR_LANG mantığı → TR kaynak dil
- [ ] **Araç: Cline**

---

## 🔄 AŞAMA 2 — TR İçerik Üretimi

### TR Kelime Listesi
- [ ] A1 seviye 66 kelime (TR + EN/ES/PT çevirileri)
- [ ] A2 seviye 64 kelime
- [ ] B1 seviye 56 kelime
- [ ] B2 seviye 57 kelime
- [ ] **Araç: Tencent (JSON üretimi)**

### TR Kelime DB
- [ ] words_tr_a1.json → DB insert
- [ ] words_tr_a2.json → DB insert
- [ ] words_tr_b1.json → DB insert
- [ ] words_tr_b2.json → DB insert
- [ ] **Araç: .cjs script**

---

## 🔄 AŞAMA 3 — Ses Üretimi

### TR Audio
- [ ] TR kelimeler → tr-TR-EmelNeural → public/audio/tr/
- [ ] EN hedef → AguiLangEvo'dan kopyala (/audio/en/)
- [ ] ES hedef → AguiLangEvo'dan kopyala (/audio/es/)
- [ ] PT hedef → AguiLangEvo'dan kopyala (/audio/pt/)
- [ ] **Araç: .py script (edge-tts)**

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