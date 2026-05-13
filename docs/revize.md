# AguiLang — Revizyon & Öncelik Analizi

*Hazırlayan: Claude Sonnet 4.6 | Tarih: Nisan 2026*

---

## 📋 İki Mesajın Özeti

### Mesaj A — Ebeveyn Kontrollü Oturum Sistemi
> "Ebeveyn panelden kategori ve süre belirler, çocuk kendi başına çalışır, quiz yapar, oyun oynar, oturum sonlanır."

### Mesaj B — Sesli Öğrenme ve Konuşma Botu
> "Dil konuşarak öğrenilir. Sesli altyapıyı güçlendirmeli, her kategori sonrası sesli pekiştirme olmalı, sesli bot mümkün mü?"

---

## ⚖️ Öncelik Kararı

**Önce: Mesaj A (Ebeveyn Kontrollü Oturum)**
**Sonra: Mesaj B (Sesli Öğrenme)**

### Gerekçeler

**Mesaj A neden önce gelir:**

1. **Temel sorunu çözüyor** — Kartal ve Emir uygulamayı kullandı ve sıkıldı. Bunun sebebi içerik değil, yapı. Çocuk "ne yapacağını" bilmeden uygulamayı açıyor. Oturum sistemi bu boşluğu kapatır.

2. **Diğer her şeyin temeli** — Sesli bot, oyun, quiz... hepsi bir oturum yapısı içinde çalışmalı. Önce evi inşa et, sonra mobilyaları koy.

3. **Ebeveyn güveni = Uygulama kullanımı** — Ebeveyn "çocuğum ne kadar, ne öğreniyor?" sorusuna cevap alamıyorsa uygulamayı bıraktırır. Bu sistemin olması uygulamanın hayatta kalmasını sağlar.

4. **Teknik olarak daha hızlı yapılabilir** — Sıfır maliyet, mevcut altyapıya eklenti.

**Mesaj B neden sonra gelir:**

1. **Pedagojik olarak doğru** — Harika bir fikir, ama önce çocuğun uygulamayı KULLANMASI lazım. Sesli bot mükemmel bir pekiştirme aracı, ama pekiştirilecek bir temel yoksa anlamsız.

2. **Web Speech API kırılgan** — Ses sorunu hâlâ tam çözülmedi. Oturum sistemi kurulunca ses sorununu da daha sağlıklı test edebiliriz.

3. **Sıfır maliyet kısıtı** — Gerçek AI sesli bot olmadan, kural tabanlı sesli bot ancak Mesaj A'nın oturum akışına entegre edilince anlamlı olur.

---

## 🔄 Revize Edilmiş Plan

### FAZ A — Oturum Sistemi (Öncelikli)

#### Ebeveyn Paneli Yeni Özellikleri

```
Haftalık Plan Kurucusu:
┌─────────────────────────────────────┐
│ Pazartesi  → 🐾 Hayvanlar  · 15 dk │
│ Salı       → 🎨 Renkler    · 15 dk │
│ Çarşamba   → 🔢 Sayılar    · 15 dk │
│ Perşembe   → 🔄 Tekrar günü · 10 dk │
│ Cuma       → 🎮 Oyun günü  · 20 dk │
│ Hafta sonu → ⭐ Serbest              │
└─────────────────────────────────────┘

Oturum Yapısı (ebeveyn ayarlar):
- Öğrenme süresi: 5 / 10 / 15 / 20 dk
- Kart limiti: 5 / 10 / 15 / 20 kart
- Quiz: Açık / Kapalı
- Oyun: Açık / Kapalı · Süre: 5 / 10 dk
- Mola modu: Otomatik / Manuel
```

#### Çocuk Akışı (hiç seçim yapmaz)

```
Uygulama açılır
      ↓
"Bugünkü Görev" ekranı (otomatik)
[🐾 Hayvanlar · 10 kart · ~15 dakika]
[Başla! 🚀]
      ↓
Flash kartlar (sistem otomatik seçer)
      ↓
Mini quiz (otomatik, %70 eşik)
      ↓
"Harika! Oyun zamanı! 🎮" (otomatik)
      ↓
"Bugünkü görev tamamlandı! ⭐"
[Uygulama kapanır veya bekleme ekranı]
```

#### Zorlanılan Kelime Sistemi

```javascript
// localStorage'da tutulacak
wordStats: {
  "dog": {
    seen: 5,
    correct: 3,
    wrong: 2,
    avgResponseTime: 4200, // ms
    lastSeen: "2026-04-09"
  }
}

// Zor kelime kriterleri:
// - 2+ kez yanlış yapıldıysa
// - Cevap süresi ortalamanın 2 katıysa
// - 7 gün görülmemişse (unutma eğrisi)
```

#### Yeni Dosyalar

```
src/hooks/useDailyPlan.js    → günlük plan yönetimi
src/hooks/useSession.js      → oturum takibi + wordStats
src/pages/DailyMission.jsx   → "Bugünkü görev" ekranı
src/pages/SessionComplete.jsx → oturum sonu + istatistik
```

---

### FAZ B — Sesli Öğrenme (Sonraki Adım)

#### Neden Değerli?

Dil öğreniminde "comprehensible input + output" teorisi:
- Sadece okumak → %10 kalıcılık
- Okumak + duymak → %30 kalıcılık
- Okumak + duymak + konuşmak → %70 kalıcılık

Kartal "dog" kelimesini görüp ezberleyebilir ama "I have a dog" cümlesini doğal söyleyemeyebilir. Sesli pratik bunu çözer.

#### Üç Katman (Sıfır Maliyetten Başla)

**Katman 1 — Telaffuz Kontrolü (Şimdi)**
```
Web Speech API STT → transcript → beklenen kelimeyle karşılaştır
"Dog söyle" → Çocuk söyler → Doğru/Yanlış → Motivasyon mesajı
Maliyet: SIFIR
```

**Katman 2 — Şablon Tabanlı Bot (Şimdi)**
```
Önceden yazılmış senaryolar — kural tabanlı
"Bu hayvanın adı ne?" → Ses çalar → Çocuk söyler → Karşılaştır
Maliyet: SIFIR
```

**Katman 3 — AI Sesli Bot (İleride, düşük maliyet)**
```
Claude Haiku API → doğal konuşma + gramer düzeltme
"I have dog" → "Neredeyse! 'A' harfini unutma — I have a dog!"
Maliyet: Günde yüzlerce konuşma için birkaç sent
```

#### Sesli Pekiştirme Akışı (Kategori Sonrası)

```
Kategori bitti (örn. Hayvanlar)
      ↓
"Sesli Pratik Zamanı! 🎤" ekranı
      ↓
Bot sorar: "Bu hayvanın adı ne?" + ses çalar 🔊
      ↓
Çocuk mikrofona söyler 🎤
      ↓
✅ Doğruysa: ⭐ puan + "Harika telaffuz!"
❌ Yanlışsa: Bot doğrusunu söyler + tekrar dene
      ↓
5 kelime bitti → "Harika konuştun! 🎤"
```

#### Sesli Bot Senaryoları (Kural Tabanlı)

```javascript
const BOT_SCENARIOS = {
  wordRepeat: {
    prompt: "Bu kelimeyi söyle bakalım: {word}",
    correct: ["Harika!", "Süper telaffuz!", "Kartal gibi keskin!"],
    wrong: ["Neredeyse! Tekrar dene.", "Dikkat: {word}", "Şöyle söyle: {pron}"]
  },
  fillBlank: {
    prompt: "I have a ___. Boşluğu doldur!",
    correct: ["Mükemmel! I have a {word}!"],
    wrong: ["Hayır, doğrusu: I have a {word}"]
  },
  freeSpeak: {
    prompt: "Favori {category}ın hangisi?",
    correct: ["Harika seçim! {word} = {tr}"],
  }
}
```

---

## 🗓️ Önerilen Uygulama Takvimi

```
HAFTA 1 (Şu an):
✅ Ses sorunu düzelt (useSpeech.js)
✅ DailyMission ekranı ("Bugünkü Görev")
✅ useSession hook (oturum takibi)
✅ SessionComplete ekranı

HAFTA 2:
□ Ebeveyn paneli — haftalık plan kurucusu
□ wordStats sistemi (zorlanılan kelimeler)
□ Oturum sonu istatistik

HAFTA 3:
□ Sesli pekiştirme modülü (Katman 1+2)
□ Telaffuz kontrolü
□ Bot senaryoları

HAFTA 4:
□ Tüm akışı test et (Kartal + Emir)
□ Hata düzelt
□ Vercel'e push

İLERİDE:
□ Firebase backend
□ Claude Haiku sesli bot (Katman 3)
□ Mobil uygulama (Capacitor.js)
```

---

## 💡 Ek Öneriler

### 1. Maskot Kartal'ı Konuşturalım
Her oturum başında, bitişinde ve motivasyon anlarında Kartal konuşmalı:
```
Başlarken: "Bugün uçmaya hazır mısın? 🦅"
Quiz doğru: "Kartal gibi keskin!"
Oturum bitti: "Bugün {n} kelime öğrendin, süpersin!"
```

### 2. Ebeveyne Bildirim (PWA ile)
```
Oturum tamamlandı → Push notification:
"Kartal bugün 10 kelime öğrendi! 🦅⭐"
```

### 3. Haftalık İlerleme Raporu
Ebeveyn panelinde görsel grafik:
- Hangi kategoriler tamamlandı
- Zorlanılan kelimeler
- Toplam öğrenme süresi
- Streak takibi

### 4. Gamification Güçlendirme
```
Oturum sistemi + rozet = güçlü motivasyon:
- "7 günlük seri" rozeti
- "10 kategori tamamladı" rozeti
- "Telaffuz ustası" rozeti (sesli pratikten)
- "Mükemmel hafta" rozeti (tüm görevler tamamlandı)
```

---

## ✅ Sonuç

| Konu | Öncelik | Neden | Maliyet |
|------|---------|-------|---------|
| Oturum Sistemi (A) | 🥇 Önce | Temel yapı, diğerlerinin temeli | Sıfır |
| Sesli Öğrenme (B) | 🥈 Sonra | Güçlü ama A olmadan anlamsız | Sıfır (Katman 1-2) |
| AI Sesli Bot | 🥉 İleride | Maliyet var, önce temel sağlam olsun | Düşük |

**Önerim:** Bu dokümanı Claude Code'a `@docs/revize.md` olarak ekle.
Her yeni oturumda `@docs/revize.md` ile başla — plan hep güncel kalsın.

---

*AguiLang — Kartal için, kartal gibi 🦅*
