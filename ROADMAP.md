# AguiLangEvo — Geliştirme Planı
**Son Güncelleme:** Mayıs 2026
**Versiyon:** MVP → v1.0 ✅ → v1.1 🔄 → v2.0

---

## ✅ TAMAMLANANLAR

### Temel Altyapı
- [x] aguilang2 → aguilangevo fork
- [x] 210 MB temizlik
- [x] Tüm TR izleri temizlendi
- [x] SQLite şema (15 tablo)
- [x] Migration sistemi (006 migration)
- [x] better-sqlite3 bağlantısı

### Kelime Sistemi
- [x] 130 kelime A1/A2 (EN/ES/PT tam)
- [x] ES çevirileri → 130/130
- [x] PT çevirileri → 130/130
- [x] Örnek cümleler (EN/ES/PT)
- [x] Alt çeviriler (alt_translations)
- [x] **B1 kelime seti → 56 kelime (EN/ES/PT)** ← YENİ
- [x] **B2 kelime seti → 57 kelime (EN/ES/PT)** ← YENİ
- [x] **Toplam kelime: 243 (A1+A2+B1+B2)** ← YENİ

### Ses Sistemi
- [x] edge-tts entegrasyonu
- [x] 1412 MP3 kelime sesleri A1/A2 (EN/ES/PT)
- [x] **167 MP3 B1 kelime sesleri (EN/ES/PT)** ← YENİ
- [x] **167 MP3 B2 kelime sesleri (EN/ES/PT)** ← YENİ
- [x] **Toplam kelime sesi: ~1746 dosya** ← YENİ
- [x] 1321 ES bot MP3
- [x] 279 PT bot MP3
- [x] Toplam bot ses: 1601 dosya
- [x] Audio player (Study.jsx)
- [x] Practice.jsx otomatik ses
- [x] 🔊 Listen again butonu
- [x] safeFilename() + MD5 hash uyumu

### Öğrenme Sistemi
- [x] PlacementTest (15 soru, A1/A2)
- [x] SM-2 SRS Engine
- [x] Flashcard UI (front/back)
- [x] Study session (10 kelime)
- [x] Oturum özeti

### Conversation (Practice)
- [x] 497 conversation pack
- [x] 1611+ exchange
- [x] easy/medium/hard seviyeleri
- [x] ES conversation packs (451)
- [x] PT conversation packs (101)
- [x] Practice UI (Intro→Exchange→Özet)
- [x] Bot otomatik ses çalma
- [x] 🔊 Listen again butonu

### ChatBot Sistemi
- [x] ChatBot UI (baloncuk/mesajlaşma arayüzü)
- [x] Her turda mod seçimi: Sesli / Yazı / Seçmeli
- [x] 8 ES senaryo paketi
- [x] 8 PT senaryo paketi
- [x] /scenarios senaryo seçim ekranı (8 kart)
- [x] Study → Scenarios → ChatBot tam akışı
- [x] Bot sesi otomatik çalar

### Dil Sistemi
- [x] 4 dil çifti: EN↔ES, EN↔PT, ES→EN, PT→EN
- [x] i18n sistemi (257+ anahtar)
- [x] Otomatik arayüz dili
- [x] ProfileSetup mantık düzeltmesi

### Satış & Yayın
- [x] **APK v1.0 build (55.6 MB)** ← YENİ
- [x] **Gumroad satış sayfası kuruldu** ← YENİ
- [x] **PDF broşür (EN/ES/PT)** ← YENİ
- [x] **Gumroad YAYINDA → $8.99** ← YENİ
- [x] **ataeyvaz.gumroad.com/l/tsogik** ← YENİ

---

## ~~HAFTA 1-6~~ ✅ TAMAMLANDI
*(Bot sesleri, Yazma modu, Konuşma modu, İstatistikler, Polish, ChatBot)*

---

## 🔄 ŞİMDİ — v1.1 İçerik & UI Güncellemesi

### Adım 1 — Uygulama B1/B2 Görsün
- [ ] Study ekranına seviye filtresi (A1/A2/B1/B2)
- [ ] Flashcard B1/B2 kelimelerini göstersin
- [ ] ProfileSetup'a hedef seviye seçimi ekle
- [ ] **Araç: Cline**

### Adım 2 — PlacementTest Genişlet
- [ ] B1/B2 soruları ekle (15 → 25 soru)
- [ ] Sonuç mantığı: A1/A2/B1/B2 seviye tespiti
- [ ] placement_questions tablosuna yeni sorular
- [ ] **Araç: MiniMax (script) + Cline (UI)**

### Adım 3 — APK v1.1 Build
- [ ] `npm run build`
- [ ] `npx cap sync`
- [ ] Android Studio → Build APK
- [ ] Test (fiziksel cihaz)
- [ ] **Araç: Manuel**

### Adım 4 — Gumroad Güncelle
- [ ] Açıklama: "Now with B1/B2 content!" ekle
- [ ] Yeni APK dosyasını yükle
- [ ] Versiyon notları ekle
- [ ] **Araç: Manuel**

---

## ⬜ SONRAKI — v1.2 Senaryo & İçerik

### Senaryo Genişletme
- [ ] ES senaryo paketi artırımı (8 → 16)
- [ ] PT senaryo paketi artırımı (8 → 16)
- [ ] B1/B2 seviyesi senaryo paketleri
- [ ] **Araç: Tencent (içerik) + MiniMax (script)**

### Grammar Modülü
- [ ] /grammar sayfası aktif
- [ ] A1/A2/B1/B2 grammar konuları
- [ ] **Araç: Cline + Tencent**

---

## ⬜ v1.3 — Pazar Genişletme

### Hotmart (Latam Pazarı)
- [ ] Hotmart hesabı aç
- [ ] Ürün sayfası (ES/PT)
- [ ] APK yükle → Fiyat: $8.99

### Google Play Store
- [ ] Developer hesabı ($25 tek seferlik)
- [ ] App ikonu (tüm boyutlar)
- [ ] Screenshot (EN/ES/PT)
- [ ] Açıklama metni (EN/ES/PT)
- [ ] Privacy Policy sayfası
- [ ] Store listing yayınla

### Kendi Domain
- [ ] aguilangevo.com
- [ ] Landing page (EN/ES/PT)

---

## 🌱 v2.0 — AguiLangEvoTR
**Hedef:** Türkiye pazarı
**Dil çiftleri:** TR→EN, TR→ES
- [ ] AguiLangEvo v1.1 tamamlandıktan sonra fork
- [ ] TR kelime seti (Tencent ile üret)
- [ ] TR ses dosyaları (edge-tts)
- [ ] TR senaryo paketleri
- [ ] i18n TR anahtarları
- [ ] Türkiye Google Play TR lansmanı

---

## 🤖 AI ARAÇ STRATEJİSİ

| Araç | Görev | Maliyet |
|------|-------|---------|
| Claude (bu sohbet) | Strateji + mimari + prompt yazma | Pro plan |
| Claude Code | Kritik geliştirme | Pro plan |
| **MiniMax M2.7** | **Script yazma + DB işlemleri** | Ücretsiz |
| Cline | Rutin dosya ekleme/güncelleme | Ücretsiz |
| Tencent | İçerik + çeviri + JSON üretimi | Ücretsiz |
| edge-tts | TTS/ses üretimi | Ücretsiz |
| Web Speech API | STT | Ücretsiz |
| Fuse.js | Fuzzy match | Ücretsiz |

### Kural
- **Claude (sohbet)** → Strateji, mimari karar, prompt hazırlama
- **MiniMax** → Script yazma, DB işlemleri, ses üretimi
- **Tencent** → JSON/metin/çeviri üretimi (içerik)
- **Cline** → Rutin dosya ekleme/güncelleme (UI)
- **Git push** → Her zaman manuel terminal

---

## 📊 PROJE METRİKLERİ (Mayıs 2026)

```
Kelimeler           : 243 (A1:66 + A2:64 + B1:56 + B2:57)
Conversation Pack   : 505 (451 ES + 101 PT)
Exchange            : 1611+
Kelime Sesi MP3     : ~1746
Bot Sesi MP3        : 1601
i18n Anahtar        : 257+
Migration           : 006
Dil Çifti           : 4 aktif
ChatBot Senaryo     : 16 (8 ES + 8 PT)
APK Sürüm           : v1.0 (55.6 MB) — YAYINDA
Satış Kanalı        : Gumroad ($8.99)
```

---

## 🔧 TEKNİK STACK
```
Frontend  : React + Vite + Tailwind
Mobile    : Capacitor
Backend   : Python (scripts)
DB        : SQLite (better-sqlite3) + localStorage
TTS       : edge-tts (offline)
STT       : Web Speech API
Fuzzy     : Fuse.js
i18n      : Custom hook (translations.js)
Audio     : HTML5 Audio API
```

---

*Sorumluluk: Ata + Claude (Anthropic)*
*Repo: https://github.com/ataeyvaz/aguilangevo*
*Satış: https://ataeyvaz.gumroad.com/l/tsogik*