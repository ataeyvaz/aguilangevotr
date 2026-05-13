# AguiLang2 — Proje İlerleme Durumu

_Son güncelleme: 2026-04-18_

---

## Genel Durum

Proje aktif geliştirme aşamasında. Temel iskelet, tüm öğrenme akışı, ebeveyn kontrol sistemi, sesli özellikler, oyun sistemi (6 oyun) ve gramer modülü tamamlandı. Build temiz çıkıyor, bilinen hata yok.

**Stack:** React 19 · Vite 8 · React Router v7 · TailwindCSS 3 · localStorage (backend yok)

---

## Tamamlanan Sayfalar

### Öğrenci Akışı
| Sayfa | Route | Durum | Notlar |
|---|---|---|---|
| Profil Seçimi | `/` | ✅ Tamamlandı | Çocuk / yetişkin profil tipi |
| Dil Seçimi | `/language` | ✅ Tamamlandı | Ebeveyn kısıtlaması aktif |
| Kategori Seçimi | `/categories` | ✅ Tamamlandı | Ebeveyn izin filtresi, Diyaloglar kartı |
| Flash Kartlar | `/learn` | ✅ Tamamlandı | Günlük stat, gramer notu, STT, ← Önceki, 📋 gezilen kelimeler |
| Quiz Ekranı | `/quiz` | ✅ Tamamlandı | Yanlış-retry, çapraz kategori, sesli telaffuz sorusu (her 5'te 1) |
| Diyaloglar | `/dialogue` | ✅ Tamamlandı | 6 senaryo, TTS otomatik, Türkçe hint her iki rol için |
| Dashboard | `/dashboard` | ✅ Tamamlandı | Gerçek veriler, 7 günlük chart, zorlanılan kelimeler |
| Öğrendiklerim | `/learned` | ✅ Tamamlandı | Tüm 20 kategori, seviye grupları, arama |
| İstatistikler | `/stats` | ✅ Tamamlandı | Bar chart, kategori ilerleme, en uzun seri |
| Profil | `/profile` | ✅ Tamamlandı | Rozet sistemi, TTS ayarları, sıfırlama (profil korunuyor) |
| Oyna | `/play` | ✅ Tamamlandı | Mod tespiti (reinforcement/growth), 6 aktif oyun, 1 yakında |
| Gramer | `/grammar` | ✅ Tamamlandı | 6 ders kartı, tamamlandı/devam rozeti, dil bazlı içerik |
| Gramer Dersi | `/grammar/:lessonId` | ✅ Tamamlandı | 4 adım: Input → Formül → Output → Diyalog |

### Ebeveyn Sistemi
| Sayfa | Route | Durum | Notlar |
|---|---|---|---|
| Ebeveyn Kapısı | `/parent` | ✅ Tamamlandı | PIN ekranı, shake animasyonu, default "1234" |
| Ebeveyn Paneli | `/parent/panel` | ✅ Tamamlandı | 6 sekme (aşağıya bak) |

**ParentPanel sekmeleri:**
- **İstatistik (1)** — Çocuğun genel quiz ve kelime istatistikleri
- **Kontrol (2)** — Kategori açma/kapama, dil kısıtlaması
- **Plan (3)** — Günlük hedef, oturum süresi planlaması
- **Oturum (4)** — Sesli quiz toggle (`aguilang_speech_quiz`)
- **Sıfırla (5)** — word_stats, daily_stats, kategori bazlı veya tam sıfırlama (profil korunuyor)

### Layout / Navigasyon
| Bileşen | Durum | Notlar |
|---|---|---|
| AppLayout | ✅ Tamamlandı | Sidebar (web) + BottomNav (mobil) |
| Sidebar | ✅ Tamamlandı | 6 nav linki, aktif vurgu `/dialogue` dahil |
| BottomNav | ✅ Tamamlandı | 4 tab, aktif vurgu `/dialogue` dahil |
| AppRouter | ✅ Tamamlandı | Standalone + AppLayout rotaları, `/dialogue` + `/profile` + 7 oyun + `/grammar` + `/grammar/:lessonId` |

---

## Gramer Modülü

### Veri Dosyaları
18 JSON dosyası: `src/data/grammar/{lang}/lesson-{1-6}.json`

| Ders | EN | DE | ES |
|---|---|---|---|
| 1 | Simple Present | Präsens | Presente |
| 2 | am/is/are | sein | ser/estar |
| 3 | Do/Does soru | W-Fragen | Preguntas |
| 4 | Don't/Doesn't | Negation (nicht/kein) | No+fiil |
| 5 | Where/When | Wo/Wann | Dónde/Cuándo |
| 6 | Did/Was/Were | Perfekt | Pretérito Indefinido |

Her ders: `formulaVisual`, `inputSentences` (5), `outputExercises` (4: fill+build karışık), `contextDialogue` (4 satır)

### Sayfa Akışı
```
GrammarPage /grammar        → 6 ders kartı, tamamlandı/devam/başla butonları
GrammarLessonPage /grammar/:lessonId → 4 adım:
  Adım 0 (Input)    — 5 örnek cümle, TTS, Türkçe toggle
  Adım 1 (Formül)   — Büyük formül kutusu, correct/wrong örnekler, TTS
  Adım 2 (Output)   — fill + build egzersizler, shake animasyonu, ipucu
  Adım 3 (Diyalog)  — contextDialogue, TTS, Türkçe hint, Dersi Tamamla
```

### localStorage
`aguilang_grammar_progress`: `{ "en-lesson-1": { completed, currentStep, completedAt } }`
Yarıda çıkılınca kaldığı adımdan devam eder.

### Rozetler (useProgress.js)
- `grammar_starter` 📐 — İlk gramer dersi tamamlandı (`grammarCompleted >= 1`)
- `grammar_master` 🏛️ — 6 ders tamamlandı (`grammarCompleted >= 6`)

---

## Tamamlanan Hook'lar

| Hook | Dosya | Açıklama |
|---|---|---|
| `useSession` | `hooks/useSession.js` | Quiz oturumu, `aguilang_word_stats` yazımı |
| `useDailyStats` | `hooks/useDailyStats.js` | `recordDaily`, `getTodayStats`, `getDailyStats(n)` |
| `useParentControls` | `hooks/useParentControls.js` | Ebeveyn ayarları + `readSpeechQuiz()` export |
| `useDailyPlan` | `hooks/useDailyPlan.js` | Günlük plan |
| `useProfile` | `hooks/useProfile.js` | Profil yönetimi |
| `useProgress` | `hooks/useProgress.js` | İlerleme takibi + `BADGE_DEFS` (10 rozet) |
| `useSettings` | `hooks/useSettings.js` | `ttsEnabled`, `ttsRate`, `dailyCardGoal` |
| `useSpeech` | `hooks/useSpeech.js` | TTS (`speak`, `isSpeaking`) + STT (`startListening`, `checkAnswer`, `transcript`); gevşek eşleşme: `t===e \|\| t.includes(e) \|\| e.includes(t)` |
| `useGrammar` | `hooks/useGrammar.js` | `loadLesson(lang, n)`, `saveProgress(lessonId, step, completed)`, `getProgress(lessonId)`, `getAllProgress(lang)` |

---

## localStorage Şeması

| Anahtar | Tip | İçerik |
|---|---|---|
| `aguilang_active_profile` | object | `{name, type, points, level, streak, initial}` |
| `aguilang_active_lang` | object | `{id, name}` |
| `aguilang_active_category` | object | `{id, name, emoji}` |
| `aguilang_active_categories` | string[] | Ebeveyn kategori izin listesi (null = hepsi açık) |
| `aguilang_word_stats` | object | `{wordId: {correct, wrong, seen}}` |
| `aguilang_daily_stats` | object | `{"2026-04-15": {seen, correct, wrong}}` |
| `aguilang_parent_pin` | string | PIN kodu (default: "1234") |
| `aguilang_parent_controls` | object | Dil ayarları, oturum limiti vb. |
| `aguilang_speech_quiz` | boolean | Sesli telaffuz sorusu aktif/pasif (default: true) |
| `aguilang_last_reset` | string | Son sıfırlama kaydı |

---

## Veri Dosyaları

- **20 kelime kategorisi:** `src/data/{cat}-a1.json` (animals, colors, numbers, fruits, vegetables, body, family, school, food, greetings, questions, clothing, home, transport, time, jobs, sports, places, adjectives, verbs)
- **Gramer notları:** `src/data/categories.js` içinde her kategoride `grammarNote: { sentences[], tip }` — A1 seviyesi
- **6 diyalog seti:** `src/data/dialogues/{scene}-a1.json` (home, market, park, restaurant, school, travel)

---

## Alınan Mimari Kararlar

| Karar | Gerekçe |
|---|---|
| Backend yok, sadece localStorage | Çocuk hedef kitlesi için kurulum kolaylığı, offline kullanım |
| Modal yerine ayrı sayfalar (`/learned`, `/stats`, `/profile`) | URL paylaşılabilirliği, back button davranışı |
| `window` custom event (`wordStatsUpdated`) | Bileşenler arası reaktivite, context/global state olmadan |
| `useRef` ile veri yükleme kilidi | Strict Mode çift mount'unda çift yüklemeyi önlemek için |
| Quiz: `startSession` useEffect deps'ten çıkarıldı | `startSession` her render'da yeniden oluşturulduğundan sonsuz döngüyü önler |
| STT alias: `checkAnswer: sttCheck` in QuizScreen | Local `checkAnswer` fonksiyonuyla isim çakışmasını önlemek için |
| "Her şeyi sıfırla" sadece 3 anahtarı siler | Profil, dil, PIN, ebeveyn kontrolleri korunmalı — kullanıcı oturumu bozulmasın |
| `isSpeechQ` computed at render | `speechQuizEnabled && sttSupported && current % 5 === 4 && q?.word != null` |
| `didSpeakRef` pattern (DialogueScreen) | `isSpeaking` false→true→false geçişini yakalamak için; initial false'tan korunmak |
| STT `checkAnswer` → `current.word` | JSON yapısı `{ word: "cat", tr: "kedi" }` — `lang.id` ile eşleşen alan yok; `current.word` kullanılmalı |
| Oyun havuzu: tüm 20 kategori | Tek kategori havuzu çok küçük (10–65 kelime); tüm kategoriler `Promise.allSettled` ile paralel yüklenir, `seen>=1` filtresi |
| SpeedGame: bir tur → oyun biter | `genQuestions` pool.length kadar soru üretir; `qIndex >= questions.length` → `allDone=true` özel ekran |
| STT toast: correct/wrong ayrımı | Doğruysa yeşil "Harika! 🌟", yanlışsa amber "Tekrar dene! 🎤" + TTS doğru kelimeyi seslendirir |

---

## Tamamlanan Oyunlar

| Oyun | Dosya | Mod | Durum | Notlar |
|---|---|---|---|---|
| Dinle & Seç | `games/ListenGame.jsx` | reinforcement | ✅ | TTS autoplay, 10 soru, tüm kategoriler |
| Hafıza Eşleştir | `games/MemoryGame.jsx` | reinforcement | ✅ | 4 kelime × 2 kart, timer + hamle sayacı, tüm kategoriler |
| Doğru / Yanlış | `games/TrueFalseGame.jsx` | reinforcement | ✅ | Emoji eşleşme, distractor mantığı, tüm kategoriler |
| Hız Turu | `games/SpeedGame.jsx` | growth | ✅ | 60s sayaç, +3s bonus, bir tur = tüm kelimeler, allDone ekranı |
| Cümle Kur | `games/SentenceGame.jsx` | growth | ✅ | Token sürükle, shake animasyonu, TTS doğruda |
| Hazineyi Aç | `games/VoiceGame.jsx` | growth | 🔲 | STT iskelet var, tam implementasyon bekliyor |
| Senaryo Puzzle | `games/PuzzleGame.jsx` | growth | 🔲 | Placeholder |

---

## Android (Capacitor)

| Bileşen | Durum | Notlar |
|---|---|---|
| `@capacitor/core` + `@capacitor/android` | ✅ Kuruldu | v8.3.1 |
| `capacitor.config.json` | ✅ Yapılandırıldı | appId: `com.aguilang.app`, webDir: `dist`, androidScheme: `https` |
| Android platform | ✅ Eklendi | `android/` klasörü oluşturuldu |
| AndroidManifest.xml izinleri | ✅ Eklendi | `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` |
| `npm run android` script | ✅ Eklendi | `vite build && npx cap sync && npx cap open android` |

**Geliştirme akışı:**
```
npm run android        # build → sync → Android Studio'yu aç
npx cap sync           # sadece web assets güncelle
npx cap open android   # Android Studio'yu aç (build olmadan)
```

**Gereksinimler (elle kurulması gerekenler):**
- Android Studio (Hedgehog veya üstü)
- Android SDK 34+
- JDK 17+

---

## Bekleyen Görevler

### Yüksek Öncelik
- [ ] **VoiceGame tam implementasyon** — STT ile kelime/cümle telaffuz oyunu
- [ ] **Senaryo Puzzle (PuzzleGame)** — diyalog boşluk doldurma oyunu
- [ ] **APK üretimi** — Android Studio'da Gradle build → `app-debug.apk` oluştur, cihaza yükle
- [ ] **Deploy (web)** — Vercel/Netlify yayın + çocuk test kullanıcısıyla canlı test
- [ ] **Gramer → Oyna bağlantısı** — Gramer dersini tamamlayan kullanıcı ilgili oyunlara yönlendirilsin

### Orta Öncelik
- [ ] **Bahrom Hoca metodolojisi** — formül kartı güçlendirme (pattern drilling), hata dostu mesajlar
- [ ] **Quiz sonuç ekranı** — oturum özeti, doğru/yanlış dökümü
- [ ] **Profil puanlama / level-up** — şu an statik değerler, gerçek mantık bağlanacak
- [ ] **Streak sıfırlama mantığı** — gerçek tarihe göre otomatik sıfırlama

### Düşük Öncelik
- [ ] ParentPanel İstatistik sekmesi verilerinin gerçek `aguilang_word_stats`'a bağlanması
- [ ] BottomNav'a `/learned` veya `/stats` tab'ı eklenecek mi? (şu an 4 tab)
- [ ] Zorlanılan kelimeler için "Tekrar Et" butonu doğrudan quiz'e filtreli yönlendirme

---

## Git Geçmişi

```
ea7405d  Günlük istatistik + öğrenilen kelimeler + quiz iyileştirmeleri
2c9eb75  Ebeveyn kategori kontrolu + ParentPanel tamamlandi
fc29696  Sidebar ve BottomNav aktif rota vurgusu eklendi
9ce4188  Quiz wordStats kaydı + Dashboard zorlanılan kelimeler
7976567  Cümle verileri eklendi - EN/DE/ES
76e167b  QuizScreen + profil ekleme tamamlandi
9083478  Büyük veri dosyaları gitignore eklendi
67cac4c  AguiLang v2 - temel sayfalar tamamlandi
```

> **Not:** `ea7405d` sonrası tüm değişiklikler henüz commit edilmedi.
> Commit edilecekler: gramer notu, STT (FlashCards + QuizScreen), DialogueScreen, ProfilePage,
> ParentPanel (ses quiz + sıfırla sekmesi), CategorySelect (Diyaloglar kartı), AppRouter güncellemesi,
> PlayPage + 6 oyun (ListenGame, MemoryGame, TrueFalseGame, SpeedGame, SentenceGame, VoiceGame),
> STT bug fix (checkAnswer → current.word, gevşek eşleşme, correct/wrong toast).
