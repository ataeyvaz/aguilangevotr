# AguiLang — Yol Haritası

## FAZ 1 — Temel Altyapı
- [x] Proje kurulumu (React + Vite + Tailwind)
- [x] Tailwind yapılandırması (özel renkler + fontlar)
- [x] ProfileSelect sayfası
- [x] LanguageSelect sayfası
- [x] FlashCards sayfası (kart çevirme animasyonu)
- [x] İlk JSON veritabanı: hayvanlar A1 (15 kelime × 3 dil)
- [x] App.jsx router temizliği (useState tabanlı ekran geçişi)
- [x] localStorage ile profil verisi kaydetme (useProfile.js)

## FAZ 2 — Quiz Sistemi
- [x] QuizScreen sayfası (4 şıklı çoktan seçmeli)
- [x] Hata listesi tutma (repeat queue)
- [x] Puan sistemi (doğru = +10, yanlış = -3)
- [x] Bölüm sonu özet ekranı (QuizSummary)

## FAZ 2B — Ses Sistemi
- [x] useSpeech hook'u oluştur (TTS + STT tek dosyada)
- [x] Flash kartta: kart açılınca kelimeyi otomatik seslendir
- [x] Flash kartta: 🔊 butonu ile tekrar dinle
- [x] Quiz'de: soruyu sesli sor (soru yüklenince TR kelime okunur)
- [x] Quiz'de: çocuk mikrofona cevap söyleyebilsin (STT)
- [x] Quiz'de: yazarak da cevap verilebilsin (text input fallback)
- [x] STT sonucu doğru/yanlış kontrolü (küçük harf + trim normalize)
- [ ] Ebeveyn panelinde ses ayarları (TTS hızı, ses açma/kapama)

## FAZ 3 — Oyunlar
- [x] Dinleme alıştırması (TTS ile kelimeyi dinle, doğrusunu seç)
- [x] Hafıza kartı oyunu (emoji + yabancı kelime çifti eşleştirme)
- [x] Kelime Eşleştirme oyunu (sol-sağ tıkla eşleştir)
- [x] Cümle Tamamlama oyunu (boşluk doldur)
- [x] Kelime Bulmaca (word search grid, 10×10)

## FAZ 4 — Rozet & Motivasyon
- [x] Rozet sistemi (10 rozet: kart, quiz, seri, puan, oyun, dil)
- [x] Dashboard sayfası (streak, puan, rozet ızgarası)
- [x] Seviye atlama ekranı (A1 → A2, quiz sonrası tetiklenir)
- [x] Kartal maskotu bileşeni (dile göre kostüm: 🎩⚙️🌺)
- [x] Doğru cevapta konfeti animasyonu 🎉
- [x] Yanlış cevapta sallama (shake) animasyonu
- [x] Günlük seri (streak) takibi localStorage'da

## FAZ 5 — Ebeveyn Paneli
- [x] Ebeveyn giriş ekranı (PIN ile, varsayılan: 1234)
- [x] İstatistik görünümü (quiz geçmişi, zor kelimeler, rozetler)
- [x] Günlük hedef ayarı (kart + quiz hedefi, Dashboard'da ilerleme çubuğu)
- [x] Ses ayarları (TTS aç/kapat, hız: yavaş/normal/hızlı, test butonu)
- [x] PIN değiştirme özelliği
- [x] Kartal ve Emir için ayrı istatistik sekmesi

## FAZ 6 — Deploy
- [x] Vercel deploy (vercel.json + SPA rewrite kuralı)
- [x] PWA desteği (vite-plugin-pwa, Workbox, offline cache, manifest)
- [x] TV/büyük ekran uyumu (640px+ ortalanmış kart layout, 1400px+ ölçekleme)
- [x] Google Fonts offline cache (Fredoka One + Nunito)
- [x] Build testi: ✓ 257KB JS · 28KB CSS · 3.5s

## Kelime veritabanı planı
| Dosya | Durum |
|-------|-------|
| animals-a1.json | ✅ hazır |
| colors-a1.json | ✅ hazır |
| numbers-a1.json | ✅ hazır |
| fruits-a1.json | ✅ hazır |
| body-a1.json | ✅ hazır |
| family-a1.json | ✅ hazır |
| school-a1.json | ✅ hazır |
| food-a1.json | ✅ hazır |
| greetings-a1.json | ✅ hazır |
| questions-a1.json | ✅ hazır |

---

## Uygulama Akış Mimarisi (Güncel)

### Ana Navigasyon (Bottom Nav - 4 sekme)
1. 🏠 Ana Ekran (Dashboard) — streak, puan, maskot, günlük hedef
2. 📚 Öğren — Kategori seç → Flash kart → Otomatik quiz
3. 🎮 Oyna — Öğrenilen kelimelerle oyunlar
4. 👤 Profil — İstatistik, rozetler, ebeveyn paneli

### Öğren Akışı
Kategori Seç → Flash Kartlar (tüm kelimeler) →
Quiz (otomatik, %70 eşik) →
  Geçti: ✅ Rozet + Sonraki kategori önerisi
  Kalmadı: 🔄 "Tekrar deneyelim mi?" → Flash kart (sadece yanlışlar)

### Oyna Akışı
Oyun Seç → Sistem öğrenilen kelimeleri çeker →
  Hiç kelime yoksa: "Önce öğren!" yönlendirmesi
  Kelime varsa: Oyun başlar (zor kelimeler %60, normal %40)

### Bot/Diyalog Akışı
Diyalog listesi → Senaryo seç → Sıralı konuşma

---

## Akıllı Mola Sistemi (FAZ 7 - Yeni)

### Nasıl çalışır
- Her 5 flash kartta sistem değerlendirir
- İzlenen metrikler: geçen süre, yanlış sayısı, cevap hızı
- Eşik aşılınca: "Harika iş! Şimdi oyun zamanı 🎮"
- Maskot Kartal konuşur ve oyuna yönlendirir

### Ebeveyn Limitleri (Ebeveyn Paneli'ne eklenecek)
- Oturum süresi: 10 / 15 / 20 / 30 dakika
- Kart limiti: 10 / 15 / 20 / 30 kart
- Mola modu: Otomatik / Saatle / Kartla
- Mola sonrası: Oyuna yönlendir / Ana ekrana dön

### Zorlanılan Kelime Tespiti
localStorage'da wordStats tutulur:
- 2+ kez yanlış → zor kelime
- Cevap süresi 2x ortalamanın üstünde → zor kelime
- 7 gün görülmedi → tekrar göster (unutma eğrisi)

### FAZ 7 Görevleri
- [ ] wordStats localStorage sistemi
- [ ] Oturum süresi + kart sayısı takibi
- [ ] Mola ekranı (Kartal maskotu + motivasyon mesajı)
- [ ] Ebeveyn paneline limit ayarları
- [ ] Oyun kelime seçimini wordStats'a göre yap
