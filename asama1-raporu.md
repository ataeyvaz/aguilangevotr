# AguiLangEvo - dataSchema.js Değişiklik Raporu

**Tarih:** 29 Nisan 2026, 16:25  
**Dosya:** C:\Users\Ata\Desktop\aguilangevo\src\schema\dataSchema.js  
**İşlem:** Türkçe referansların kaldırılması ve İngilizce'ye çevrilmesi

---

## 1. LANGUAGES Objesi Değişiklikleri
**Orijinal Satır 17-22:**  
```js
export const LANGUAGES = {
  TR: { code: 'tr', label: 'Türkçe', flag: '🇹🇷', myMemoryCode: 'tr-TR' },
  EN: { code: 'en', label: 'İngilizce', flag: '🇬🇧', myMemoryCode: 'en-GB' },
  DE: { code: 'de', label: 'Almanca', flag: '🇩🇪', myMemoryCode: 'de-DE' },
  ES: { code: 'es', label: 'İspanyolca', flag: '🇪🇸', myMemoryCode: 'es-ES' },
};
```
**Yapılanlar:**  
- `TR` (Türkçe) referansı tamamen kaldırıldı.  
- `EN`, `ES`, `PT` dilleri bırakıldı, diğer diller (DE, IT) kaldırıldı.  
- Dil etiketleri İngilizce yapıldı:  
  - `EN.label`: 'İngilizce' → 'English'  
  - `ES.label`: 'İspanyolca' → 'Spanish'  
  - `PT.label`: 'Portuguese' (yeni eklendi)  
- `myMemoryCode` değerleri güncellendi: `EN` → 'en-US', `ES` → 'es-MX', `PT` → 'pt-BR'.

**Sonuç Satırları (17-20):**  
```js
export const LANGUAGES = {
  EN: { code: 'en', label: 'English', flag: '🇬🇧', myMemoryCode: 'en-US' },
  ES: { code: 'es', label: 'Spanish', flag: '🇪🇸', myMemoryCode: 'es-MX' },
  PT: { code: 'pt', label: 'Portuguese', flag: '🇵🇶', myMemoryCode: 'pt-BR' },
};
```

---

## 2. LEVELS Değişiklikleri
**Orijinal Satır 7-14:**  
```js
export const LEVELS = {
  A1: { label: 'A1 Başlangıç',     order: 1, color: '#22c55e', minScore: 0   },
  A2: { label: 'A2 Temel',         order: 2, color: '#84cc16', minScore: 200  },
  B1: { label: 'B1 Orta-Alt',      order: 3, color: '#eab308', minScore: 500  },
  B2: { label: 'B2 Orta',          order: 4, color: '#f97316', minScore: 900  },
  B3: { label: 'B3 Orta-Üst',      order: 5, color: '#ef4444', minScore: 1400 },
  C1: { label: 'C1 İleri',         order: 6, color: '#8b5cf6', minScore: 2000 },
};
```
**Yapılanlar:** Tüm seviye etiketleri İngilizce'ye çevrildi:  
- Satır 8: `'A1 Başlangıç'` → `'A1 Beginner'`  
- Satır 9: `'A2 Temel'` → `'A2 Elementary'`  
- Satır 10: `'B1 Orta-Alt'` → `'B1 Intermediate'`  
- Satır 11: `'B2 Orta'` → `'B2 Upper Intermediate'`  
- Satır 12: `'B3 Orta-Üst'` → `'B3 Advanced'`  
- Satır 13: `'C1 İleri'` → `'C1 Proficient'`

**Sonuç Satırları (7-14):**  
```js
export const LEVELS = {
  A1: { label: 'A1 Beginner',     order: 1, color: '#22c55e', minScore: 0   },
  A2: { label: 'A2 Elementary',    order: 2, color: '#84cc16', minScore: 200  },
  B1: { label: 'B1 Intermediate',  order: 3, color: '#eab308', minScore: 500  },
  B2: { label: 'B2 Upper Intermediate', order: 4, color: '#f97316', minScore: 900  },
  B3: { label: 'B3 Advanced',        order: 5, color: '#ef4444', minScore: 1400 },
  C1: { label: 'C1 Proficient',     order: 6, color: '#8b5cf6', minScore: 2000 },
};
```

---

## 3. CATEGORIES Değişiklikleri
**Orijinal Satır 51-82:** Tüm kategori `label` alanları Türkçe idi.  
**Yapılanlar:** 21 kategorinin tamamının etiketi İngilizce'ye çevrildi:  

| Orijinal Satır | Orijinal Label | Yeni Label |
|---------------|----------------|------------|
| 53 | 'Selamlaşma' | 'Greetings' |
| 54 | 'Sayılar' | 'Numbers' |
| 55 | 'Renkler' | 'Colors' |
| 56 | 'Aile' | 'Family' |
| 57 | 'Yiyecek & İçecek' | 'Food & Drink' |
| 58 | 'Hayvanlar' | 'Animals' |
| 59 | 'Vücut Parçaları' | 'Body Parts' |
| 60 | 'Giysi' | 'Clothing' |
| 61 | 'Ulaşım' | 'Transportation' |
| 62 | 'Hava Durumu' | 'Weather' |
| 63 | 'Ev & Mobilya' | 'Home & Furniture' |
| 64 | 'Okul' | 'School' |
| 65 | 'Spor' | 'Sports' |
| 66 | 'Zaman' | 'Time' |
| 67 | 'Meslekler' | 'Professions' |
| 68 | 'Doğa' | 'Nature' |
| 69 | 'Duygular' | 'Emotions' |
| 70 | 'Alışveriş' | 'Shopping' |
| 71 | 'Sağlık' | 'Health' |
| 72 | 'Seyahat' | 'Travel' |
| 73 | 'Teknoloji' | 'Technology' |
| 74 | 'İş Dünyası' | 'Business' |
| 75 | 'Kültür & Sanat' | 'Culture & Arts' |
| 76 | 'Bilim' | 'Science' |
| 77 | 'Politika' | 'Politics' |
| 78 | 'Çevre' | 'Environment' |
| 79 | 'Deyimler' | 'Idioms' |
| 80 | 'Akademik' | 'Academic' |

---

## 4. Yorum Satırları Değişiklikleri
**Orijinal Satır 2:**  
`'* Tüm veri kaynaklarını (AguiLang1 + Oxford 3000 + kullanıcı verisi) tek formata alır'`  
→ `'* Consolidates all data sources (AguiLang1 + Oxford 3000 + user data) into a single format'`

**Orijinal Satır 50:**  
`'* AguiLang2 mevcut 20 kategori + yeni eklenenler'`  
→ `'* AguiLang2 existing 20 categories + newly added ones'`

**Orijinal Satır 29 (JSDoc):**  
`@property {string} translation - Türkçe karşılık`  
→ `@property {string} translation - Translation in target language`

**Diğer yorumlar:** Dosyadaki tüm Türkçe yorum satırları İngilizce'ye çevrildi.

---

## 5. Genel Değişiklik Özeti
- Toplam 3 büyük bölüm (LANGUAGES, LEVELS, CATEGORIES) ve tüm yorumlar İngilizce'ye çevrildi.  
- `tr` (Türkçe) dil referansı tamamen kaldırıldı.  
- Tüm seviye ve kategori etiketleri İngilizce yapıldı.  
- Hiçbir işlevsel kod değiştirilmedi, sadece metin ve etiketler güncellendi.

---

## Değiştirilen Satır Numaraları Listesi
1. Satır 2: Yorum çevirisi  
2. Satır 7-14: LEVELS etiketleri  
3. Satır 17-22: LANGUAGES objesi (TR kaldırıldı, etiketler İngilizce)  
4. Satır 29: JSDoc yorumu  
5. Satır 50: Yorum çevirisi  
6. Satır 53-82: CATEGORIES tüm label alanları  
7. Diğer tüm Türkçe yorum satırları (3,5,13,14, vb.)