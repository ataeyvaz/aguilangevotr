# AguiLangEvo Türkçe Kod Raporu

**Tarih:** 29 Nisan 2026, 16:17  
**Çalışma Dizini:** C:\Users\Ata\Desktop\aguilangevo  
**Amaç:** `src/` içindeki Türkçe referanslarını tespit etmek (henüz değiştirme yapmadan).

---

## src/schema/dataSchema.js

- **Satır 17-22:**  
  ```js
  export const LANGUAGES = {
    TR: { code: 'tr', label: 'Türkçe', flag: '🇹🇷', myMemoryCode: 'tr-TR' },
    ...
  }
  ```  
  **Ne yapılması gerekiyor:** 'tr' kodlu Türkçe dil referansı kaldırılmalı veya desteklenen diller arasına alınmalı. 'Türkçe' etiketi İngilizce'ye çevrilmeli.

- **Satır 8-13:**  
  ```js
  export const LEVELS = {
    A1: { label: 'A1 Başlangıç', ... },
    A2: { label: 'A2 Temel', ... },
    ...
  }
  ```  
  **Ne yapılması gerekiyor:** Seviye etiketleri Türkçe yerine İngilizce olmalı (ör. 'A1 Beginner').

- **Satır 29:** Yorum `@property {string} translation - Türkçe karşılık`  
  **Ne yapılması gerekiyor:** Yorum İngilizce'ye çevrilmeli.

- **Satır 44-82:** `CATEGORIES` nesnesindeki `label` alanlarının tamamı Türkçe (ör. `'Selamlaşma'`, `'Sayılar'`).  
  **Ne yapılması gerekiyor:** Kategori etiketleri İngilizce'ye çevrilmeli (ör. `'Greetings'`, `'Numbers'`).

- **Satır 50:** Yorum `AguiLang2 mevcut 20 kategori + yeni eklenenler`  
  **Ne yapılması gerekiyor:** Yorum İngilizce'ye çevrilmeli.

---

## src/services/dictionaryService.js

- **Satır 6:** API URL `https://api.mymemory.translated.net/get?q=WORD&langpair=en|tr`  
  **Ne yapılması gerekiyor:** `tr` hedef dil referansı kaldırılmalı veya dinamik hale getirilmeli.

- **Satır 52-54:**  
  ```js
  async function fetchFromMyMemory(word, sourceLang = 'en', targetLang = 'tr') { ... }
  ```  
  **Ne yapılması gerekiyor:** Varsayılan `targetLang = 'tr'` kaldırılmalı, çağrılarda açıkça belirtilmeli.

- **Satır 108:**  
  ```js
  export async function lookupWord(word, sourceLang = 'en', targetLang = 'tr') { ... }
  ```  
  **Ne yapılması gerekiyor:** Aynı şekilde varsayılan 'tr' kaldırılmalı.

- **Satır 100:**  
  ```js
  if (!word?.trim()) throw new Error('Kelime boş olamaz');
  ```  
  **Ne yapılması gerekiyor:** Hata mesajı İngilizce olmalı.

- **Satır 156:**  
  ```js
  throw new Error(`"${word}" için çeviri bulunamadı. İnternet bağlantınızı kontrol edin.`);
  ```  
  **Ne yapılması gerekiyor:** Hata mesajı İngilizce'ye çevrilmeli.

- **Çok sayıda yorum satırı Türkçe:** 3, 5, 13, 49, 100, 101, 169 vb.  
  **Ne yapılması gerekiyor:** Tüm yorumlar İngilizce'ye çevrilmeli.

---

## src/migration/migrationHelper.js

- **Satır 14:** Örnek format `Format C: [{en: "...", tr: "...", ...}]`  
  **Ne yapılması gerekiyor:** Referanslar İngilizce'ye çevrilmeli.

- **Satır 18:** Yorum `Örnek dosya adları: "en-tr-a1.json", ...`  
  **Ne yapılması gerekiyor:** Yorum İngilizce'ye çevrilmeli, 'tr' referansları kaldırılmalı.

- **Satır 46:** `if (targetLanguage && targetLanguage !== 'tr' && ...)`  
  **Ne yapılması gerekiyor:** 'tr' kontrolü kaldırılmalı veya genelleştirilmeli.

- **Satır 53:** Yorum `en-tr-a1.json or default: source word + Turkish translation`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

- **Satır 90:** `object map formatı: { "hello": { tr: "merhaba", ... } }`  
  **Ne yapılması gerekiyor:** 'tr' anahtarı kaldırılmalı veya İngilizce çeviriye çevrilmeli.

- **Satır 105:**  
  ```js
  return item.translation || item.tr || item.meaning || item.turkish || ...
  ```  
  **Ne yapılması gerekiyor:** `item.tr` ve `item.turkish` gibi Türkçe özel alanlar kaldırılmalı.

- **Satır 119-139:** `CATEGORY_KEYWORDS` içinde Türkçe anahtar kelimeler (ör. 'merhaba', 'güle güle').  
  **Ne yapılması gerekiyor:** Kategori tahmin algoritması Türkçe kelimeleri kullanmamalı, ya kaldırılmalı ya da çok dilli hale getirilmeli.

- **Çok sayıda yorum Türkçe.**  
  **Ne yapılması gerekiyor:** Tüm yorumlar İngilizce'ye çevrilmeli.

---

## src/pages/LanguageSelect.jsx

- **Satır 7, 16, 25, 34:** `name: 'İngilizce'`, `name: 'Almanca'`, `name: 'İspanyolca'`, `name: 'İtalyanca'`  
  **Ne yapılması gerekiyor:** Dil adları İngilizce olmalı (ör. `'English'`, `'German'`, vb.).

- **Satır 92:** `Merhaba, {profile.name || 'Kahraman'}!`  
  **Ne yapılması gerekiyor:** Karşılama metni İngilizce'ye çevrilmeli.

- **Satır 95:** `Hangi dili öğrenmek istiyorsun?`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

- **Satır 110:** `Ana Dilin`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

- **Satır 143:** `Türkçe`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli (`'Turkish'`).

- **Satır 144:** `Turkce` (tr: lowercase)  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

- **Satır 159:** `Öğrenmek İstediğin Dil`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

- **Satır 252:** `← Geri dön`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

---

## src/pages/FlashCards.jsx

- **Satır 22:** `tr: w.translation,` (özellik adı `tr`)  
  **Ne yapılması gerekiyor:** `tr` alan adı `translation` veya dile özgü bir anahtara çevrilmeli.

- **Satır 447:**  
  ```jsx
  <div>...Türkçe...</div>
  ```  
  **Ne yapılması gerekiyor:** Etiket İngilizce'ye çevrilmeli (`'Translation'`).

- **Satır 453:** `{current?.tr}`  
  **Ne yapılması gerekiyor:** `tr` alanı yerine doğru dilin çevirisi kullanılmalı.

- **Satır 527:** `{w.tr}`  
  **Ne yapılması gerekiyor:** Aynı şekilde.

- **Tüm kullanıcı arayüzü metinleri Türkçe:** "Harika! 🌟", "Tekrar dene! 🎤", "Kelimeler yükleniyor...", "Geri Dön", "İlerleme", "Bitti! 🎉", "Tebrikler!", "Anlamı görmek için dokun", "Sen de söyle", "Söyledim ✓", "Kontrol Et ✓", "Quiz'e Geç →", "← Önceki", "Anladım ✓".  
  **Ne yapılması gerekiyor:** Tüm metinler İngilizce'ye çevrilmeli veya çok dilli destek eklenmeli.

---

## src/pages/DialogueScreen.jsx

- **Satır 6-11:** Diyalog başlıkları Türkçe: `'Evde Günlük Konuşma'`, `'Markette Alışveriş'`, vb.  
  **Ne yapılması gerekiyor:** Başlıklar İngilizce'ye çevrilmeli.

- **Satır 367, 384:** `{line.tr}` (Türkçe çeviri)  
  **Ne yapılması gerekiyor:** `tr` alanı yerine seçilen dile göre çeviri gösterilmeli.

- **Tüm UI metinleri Türkçe:** "Harika iş çıkardın!", "Tamamlandı", "Tebrikler", "Konuşuyor...", "Dinle", "Söyledim ✓", vb.  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

---

## src/pages/QuizScreen.jsx

- **Satır 67:** `tr: s.tr,`  
  **Ne yapılması gerekiyor:** `tr` alanı kaldırılmalı.

- **Satır 71-73:** Hardcoded Türkçe cümleler:  
  ```js
  { tr: 'Bir köpeğim var.', words: ['I', 'have', 'a', 'dog'], ... },
  { tr: 'Kedi küçük.', ... },
  { tr: 'Elma kırmızı.', ... },
  ```  
  **Ne yapılması gerekiyor:** Bu fallback verileri kaldırılmalı veya İngilizce'ye çevrilmeli.

- **Tüm UI metinleri Türkçe:** "Mükemmel!", "Harika!", "İyi gidiyorsun!", "puan kazandın", "Kategoriler", "Dashboard", "Türkçe karşılığı hangisi?", "Kontrol Et", "Devam Et →", "Anladım ✓".  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

---

## src/pages/games/SentenceGame.jsx

- **Satır 95:**  
  ```js
  setHint(`İlk kelime: "${s.words[0]}"`)
  ```  
  **Ne yapılması gerekiyor:** İpucu metni İngilizce'ye çevrilmeli.

- **Satır 179:** `{s.tr && <div>💡 {s.tr}</div>}`  
  **Ne yapılması gerekiyor:** `tr` alanı yerine doğru dil çevirisi kullanılmalı.

- **Tüm UI metinleri Türkçe:** "Yükleniyor...", "Bu kategoride cümle bulunamadı", "Önce flash kartlarla kelime çalış.", "Kategori Seç", "Cümle Kur", "puan", "Tekrar", "Oyunlar".  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

---

## src/pages/games/SpeedGame.jsx

- **Satır 236:** `Türkçe karşılığını seç`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli (`'Select the translation'`).

- **Satır 261:** `{opt.tr}`  
  **Ne yapılması gerekiyor:** `tr` alanı kaldırılmalı.

- **Tüm UI metinleri Türkçe:** "Yükleniyor...", "Yeterli kelime yok", "Önce flash kartlarla kelime çalış.", "Kategori Seç", "Tebrikler!", "Tüm kelimeleri tamamladın! 🎉", "Doğru", "En uzun seri", "Toplam soru", "Tekrar", "Oyunlar", "⚡ Hız Turu", "Süre · ...".  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

---

## src/pages/GrammarLessonPage.jsx

- **Satır 11:**  
  ```js
  const STEP_LABELS = ['Örnekler', 'Formül', 'Egzersiz', 'Diyalog']
  ```  
  **Ne yapılması gerekiyor:** Adım etiketleri İngilizce'ye çevrilmeli.

- **Satır 215:** `Önce şu cümleleri dinle ve incele:`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

- **Satır 235:** `Türkçeyi gör →`  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli (`'Show Turkish'`).

- **Satır 279, 382, 474:** `{item.tr}`, `{ex.tr}`, `{line.tr}`  
  **Ne yapılması gerekiyor:** `tr` alanı kaldırılmalı veya çok dilli hale getirilmeli.

- **Tüm UI metinleri Türkçe:** "Harika!", "İpucu", "Tekrar dene! Doğru cevap:", "Boşluk Doldur", "Cümle Kur", "Sonraki →", "Son Adım →", "Dersi Tamamla!".  
  **Ne yapılması gerekiyor:** İngilizce'ye çevrilmeli.

---

## src/data/verbs-a1.json

- **Dosya yapısı:** Her kelime nesnesinde `"tr"` alanı mevcut (ör. `"tr": "olmak"`). Ayrıca `translations` altındaki `en`, `de`, `es` dizilerindeki kelimelerin hepsi `"tr"` içeriyor.  
  **Ne yapılması gerekiyor:** Türkçe çeviriler veri setinden tamamen kaldırılmalı. Eğer Türkçe dil desteği gerekiyorsa, ayrı bir dil koduna taşınmalı.

- **Satır 2:** `"category": "verbs"` (İngilizce) fakat `"translations"` içindeki kelimelerin `tr` alanları Türkçe.  
  **Ne yapılması gerekiyor:** Veri yapısı Türkçe referanslardan arındırılmalı.

---

## Özet

- Toplam 11 dosya tarandı.
- Hedef dil referansı olarak `'tr'` (string) ve `tr:` obje anahtarı çok sayıda yerde kullanılmış.
- Kullanıcı arayüzü metinlerinin tamamına yakını Türkçe.
- Yorum satırlarının çoğu Türkçe.
- Veri dosyalarında (verbs-a1.json) Türkçe çeviri alanları (`tr`) bulunuyor.
- Hiçbir değişiklik yapılmadı, sadece raporlandı.

**Sonraki adım:** Bu referansları İngilizce'ye çevirmek veya çok dilli bir yapıya geçmek için planlama yapılabilir.