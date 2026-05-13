# AguiLang — Mimari Denetim Raporu

> Tarih: 2026-04-13  
> Kapsam: Mevcut kodu kırmadan, güvenli refactor stratejisi  
> Kural: Kod yazılmaz. Yalnızca analiz ve öneri.

---

## 1. MİMARİ DENETİM

### App.jsx'in Fazla Yüklendiği Sorumluluklar

`App.jsx` şu anda şu işleri tek başına yapıyor (265 satır):

| Sorumluluk | Satırlar | Problem Notu |
|---|---|---|
| Tüm hook'ları bağlama (`useProfile`, `useProgress`, `useSettings`, `useDailyPlan`, `useSession`) | 31–39 | Her yeni hook buraya ekleniyor, dosya şişiyor |
| Tüm ekran state'i (`screen`, `language`, `category`, `quizResult`, `fromDailyMission`, `activePlan`) | 41–46 | 6 bağımlı state, birlikte tutulmak zorunda |
| Tüm navigasyon fonksiyonları (`goProfile`, `goDash`, `goLanguage`…) | 49–57 | 8 ayrı fonksiyon, çağrı sırası kritik |
| Daily Mission akışının iş mantığı (`onDailyMissionStart`, `LANG_MAP`) | 62–78 | Saf navigasyon değil, iş kuralı — yanlış yerde |
| Quiz/FlashCard akış dallanması (`fromDailyMission` flag'i) | 112–133 | `if (fromDailyMission)` dalı → gizli state makinesi |
| Zaman kısıtlaması render bloğu | 138–163 | Inline JSX + inline style → CLAUDE.md kuralını ihlal ediyor |
| 21 sayfa import'u | 1–29 | Tüm uygulama her render'da bellekte |

**Sonuç:** App.jsx; router, controller ve middleware görevini tek başına üstleniyor. Bu, küçük ölçekte sorunsuz çalışır, ancak her yeni sayfa veya akış doğrudan buraya eklenmek zorunda kalıyor.

---

### Aşırı Sıkı Bağlı (Tightly Coupled) Mantık

**1. `fromDailyMission` flag anti-pattern'i**

```
onFlashCardsDone → if (fromDailyMission) → quiz'e git
onQuizFinish    → if (fromDailyMission) → game-select'e git
```

Tek bir boolean flag, iki farklı fonksiyonun davranışını değiştiriyor.  
Yeni bir akış (örneğin "Haftalık Tekrar Modu") gelirse üçüncü bir `if` dalı açılacak.  
**Risk:** Akış sayısı arttıkça bu flag paterni bakımı imkânsız hale gelir.

**2. `LANG_MAP` sabiti App.jsx içinde**

Dil eşlemesi (`en → {id, flag, label}`) `onDailyMissionStart` içinde tanımlanmış.  
Aynı eşleme `LanguageSelect.jsx`'te de muhtemelen tekrarlanıyor.  
**Risk:** Yeni bir dil (ör. Fransızca) eklenince 2+ yerde güncelleme gerekir.

**3. Zaman kısıtlaması: render içinde ham JSX + inline style**

`checkTimeRestriction()` döndüğünde App.jsx içinde 25 satırlık inline-styled bir blok render ediliyor.  
Bu hem CLAUDE.md'nin "inline style YAZMA" kuralını çiğniyor hem de test edilmesi imkânsız.  
**Risk:** Tatil modu, hafta sonu istisnaları vb. genişledikçe bu blok daha da büyür.

**4. `Dashboard.jsx` — kendi alt navigasyonunu kendi içinde tanımlıyor**

`NAV` dizisi Dashboard'a gömülü, `BottomNav.jsx` bileşeni ise ayrı bir dosyada var (`src/components/`).  
İki ayrı nav implementasyonu aynı anda hayatta.  
**Risk:** Nav öğesi eklenince her iki yerde güncelleme şart.

**5. `useProgress.js` hem rozet mantığını hem de hard-word takibini içeriyor**

`recordQuiz` içinde `hardWords` hesaplaması yapılıyor — bu `useSession`/wordStats sorumluluğu.  
**Risk:** İki hook aynı verinin farklı kopyalarını tutuyor (`hardWords` in `useProgress`, `wordStats` in `useSession`), senkronizasyon riski var.

---

## 2. REFACTOR STRATEJİSİ

### Önerilen Klasör Yapısı (mevcut yapıya ek)

```
src/
  router/
    useAppRouter.js       ← screen state + tüm navigasyon fonksiyonları
    useFlowState.js       ← language, category, quizResult, activePlan, fromDailyMission
  guards/
    TimeGate.jsx          ← zaman kısıtlaması ekranı (şu an App.jsx'teki inline blok)
  constants/
    languages.js          ← LANG_MAP sabitinin kalıcı evi
```

**Dikkat:** Mevcut `pages/` ve `hooks/` yapısına dokunulmaz. Yeni klasörler ek katman olarak eklenir.

### Separation of Concerns — Üç Adım

**Adım 1 — Navigasyon izolasyonu (`useAppRouter`)**

`goProfile`, `goDash`, `goLanguage`, `goMode`… gibi 8 fonksiyon + `screen` state'i tek bir hook'a taşınır.  
App.jsx `const { screen, goProfile, … } = useAppRouter()` şeklinde tüketir.  
Bu değişiklik hiçbir sayfayı etkilemez.

**Adım 2 — Akış state izolasyonu (`useFlowState`)**

`language`, `category`, `quizResult`, `fromDailyMission`, `activePlan` bir hook'a taşınır.  
`onDailyMissionStart`, `onFlashCardsDone`, `onQuizFinish` bu hook içinde yaşar.  
App.jsx bu hook'u tüketir; sayfalar değişmez.

**Adım 3 — `TimeGate` bileşeni**

App.jsx'teki inline zaman kısıtlaması bloğu `src/guards/TimeGate.jsx`'e çıkarılır.  
App.jsx'te `<TimeGate onBack={goProfile}>` olarak sarılır.  
Tailwind sınıflarına geçiş burada yapılır (CLAUDE.md kuralına uyum).

---

## 3. UX AKIŞI BASİTLEŞTİRME

### Şu Anki Karar Yükü (Çocuk Perspektifi)

Profil seç → Görev ekranı → (Atla veya Başla) → Dil seç → Kategori seç → Mod seç → İçerik

Çocuk için **3 karar noktası** fazla: Dil, Kategori, Mod.

### Önerilen Akış (3 Mod)

```
Profil Seç
    ↓
[Günlük Görev] ← Ebeveyn planı varsa otomatik
    |
    ↓ (veya "Serbest Oyna")
    ├── 📚 ÖĞREN   → Dil (otomatik? öncelikli dil) → Kategori → FlashCards → Quiz
    ├── 🎮 OYNA    → Öğrenilen kelimeler → Oyun seç → Oyun
    └── 🗣️ KONUŞ  → Diyalog seç → Diyalog
```

**Öneriler:**
- `LanguageSelect` adımını `Daily Mission` tarafından otomatik doldur (ebeveyn öncelikli dil = default)
- `ModeSelect` sayfasını kaldırmak yerine `CategorySelect` sonrasına FlashCards'ı otomatik başlat; "quiz mi oyun mu" sorusunu quiz sonrası `QuizSummary`'e taşı
- Böylece çocuk akışı: **Profil → Kategori → FlashCards → Quiz → (rozet veya oyun önerisi)**

---

## 4. STATE YÖNETİMİ

### Screen-Based State — Uzun Vadeli Değerlendirme

Şu anki `useState('profile')` sistemi **bu uygulama için yeterli**, tamamen değiştirilmesine gerek yok.  
Ancak şu problemler büyümeyle birlikte ağırlaşır:

| Problem | Tetikleyici Eşik |
|---|---|
| `screen` string'ini `console.log`'suz debug etmek | ~20 ekran (şu an ~18) |
| Geri/ileri geçmişi yok — tarayıcı "back" butonu çalışmıyor | Zaten bugün sorun |
| Her yeni akış App.jsx'e `if (s === …)` bloğu ekliyor | Her yeni sayfa |

### Önerilen Hafif İyileştirme (Kırılma Yok)

Mevcut `screen` state'i **korunur**. Ekstra olarak:

1. `useAppRouter` hook'u screen geçmişini `useRef` ile bir dizi olarak tutar → `goBack()` fonksiyonu sağlar
2. Her ekran için bir sabit obje tanımlanır (şu anki dağınık string'ler yerine):
   ```js
   // src/router/screens.js
   export const SCREENS = {
     PROFILE: 'profile',
     DASHBOARD: 'dashboard',
     DAILY_MISSION: 'daily-mission',
     // …
   }
   ```
   Böylece typo ile ekran kaybolması riski ortadan kalkar.

**Ne zaman gerçek router (React Router vb.) düşünülür?**  
Diyalog sistemi deep link gerektirdiğinde veya tarayıcı "geri" tuşu beklentisi oluştuğunda.  
Şu an için overkill.

---

## 5. EBEVEYN SİSTEMİ ENTEGRASYONU

### Mevcut Durum

`useParentControls.js` tamamen **servis katmanı** olarak doğru yazılmış:
- Saf fonksiyonlar (`readLangSettings`, `readEnergyMode`, `checkTimeRestriction`) hook dışından çağrılabiliyor
- Tek localStorage erişim noktası
- Gerçek bir React hook'a (`useParentControls`) ihtiyaç duymadan bile kullanılabiliyor

### Sorunlu Nokta: Zaman Kontrolü Middleware Değil, Component İçinde

`checkTimeRestriction()` App.jsx'te render sırasında çağrılıyor.  
Bu aslında doğru yaklaşım **ama** bloklama ekranı App.jsx'e gömülü.

### Öneri: Guard Bileşeni Katmanı

```
App.jsx
  └── <TimeGate>          ← guard: profil seçilmişse zaman kontrolü
        └── <ekran JSX>   ← normal akış
```

`TimeGate` sadece sunum bileşeni: `checkTimeRestriction()` sonucuna göre ya içeriği gösterir ya engeleme ekranını.  
Ebeveyn mantığı (`useParentControls`) middleware olarak değil, **guard bileşeni** aracılığıyla etkinleştirilir.  
Bu, mevcut `checkTimeRestriction` API'sini kırmaz.

---

## 6. RİSK ANALİZİ

### Uygulama 2x Büyürse Ne Kırılır?

| Alan | Risk Seviyesi | Açıklama |
|---|---|---|
| App.jsx if-chain | 🔴 Yüksek | Her yeni ekran 1 `if` bloğu + olası bağlı handler ekler. 30 ekranda okunmaz hale gelir |
| `fromDailyMission` flag | 🔴 Yüksek | Üçüncü bir akış (haftalık tekrar, yarışma modu vb.) gelince birden fazla boolean flag yönetilmesi gerekir |
| `hardWords` çift takibi | 🟡 Orta | `useProgress.hardWords` ile `useSession.wordStats` senkronize tutulması gerekir; şu an quiz'den sonra senkron, ama flaş kartta `recordCard` çağrılmıyorsa diverge eder |
| Dashboard'daki hardcoded NAV | 🟡 Orta | `BottomNav.jsx` bileşeni var ama Dashboard onu kullanmıyor; nav güncellenmesi 2 yerde yapılacak |
| LANG_MAP tekrarı | 🟡 Orta | Yeni dil eklenince App.jsx + LanguageSelect + muhtemelen başka yerler güncellenmeli |
| Inline style'lar | 🟡 Orta | Dashboard.jsx'te 200+ satır inline style; Tailwind geçişi yapılırsa büyük diff ama mantıksal risk yok |
| `useDailyPlan` hook'u her render'da localStorage okuyor | 🟢 Düşük | Senkron ve hızlı; sorun olmaz ama `useMemo` ile optimize edilebilir |

### Teknik Borç Özeti

1. **Kritik borç:** `fromDailyMission` flag + çift `onQuizFinish` fonksiyonu
2. **Orta borç:** App.jsx'teki inline zaman kısıtlaması bloğu
3. **Küçük borç:** `LANG_MAP` dağınıklığı, Dashboard nav tekrarı
4. **Hayırlı borç değil:** Hook mimarisi (`useProgress`, `useSession`, `useParentControls`) zaten sağlam yazılmış

---

## 7. ADIM ADIM MİGRASYON PLANI

### Faz 1 — Güvenli Refactor (Sıfır Kırılma Riski)

> Hedef: App.jsx'i sadeleştir, davranış değişmesin.

- [ ] `src/constants/languages.js` oluştur → `LANG_MAP` sabiti oraya taşı
- [ ] `src/router/useFlowState.js` oluştur → `language`, `category`, `quizResult`, `fromDailyMission`, `activePlan` + tüm handler'lar oraya taşı
- [ ] `src/router/useAppRouter.js` oluştur → `screen` state + `go*` fonksiyonları oraya taşı
- [ ] App.jsx bu iki hook'u tüketir; JSX aynı kalır
- [ ] `src/guards/TimeGate.jsx` oluştur → inline zaman bloğu oraya taşı, inline style → Tailwind
- [ ] `SCREENS` sabiti oluştur, string literal kullanımını kaldır

**Tahmini değişen dosya sayısı:** App.jsx (küçülür) + 4 yeni dosya. Hiçbir sayfa değişmez.

---

### Faz 2 — UX Sadeleştirme

> Hedef: Çocuk için karar sayısını azalt.

- [ ] `ModeSelect` sayfası kaldırılmaz — devre dışı bırakılır. `CategorySelect`'ten sonra doğrudan `flashcards`'a git
- [ ] `LanguageSelect`'te ebeveynin öncelikli dili (readLangSettings().priority) default seçili gelsin; çocuk değiştiremez (veya büyük "devam et" butonu ile otomatik ilerlesin)
- [ ] `Dashboard`'daki hardcoded `NAV` kaldırılır, `BottomNav.jsx` bileşeni kullanılır

---

### Faz 3 — Mimari Temizlik

> Hedef: Ölçeklenebilirlik zemini kur.

- [ ] `useProgress.hardWords` ile `useSession.wordStats` tek kaynağa birleştirilir (`useSession` kazanır, daha zengin veri tutuyor)
- [ ] `useAppRouter` içine `goBack()` geçmişi ekle (tarayıcı back desteği için)
- [ ] FAZ 7 wordStats sistemi bu temiz zeminde inşa edilir

---

## ÖZET

| Konu | Mevcut | Öneri |
|---|---|---|
| App.jsx boyutu | 265 satır, 21 import | ~80 satır, 2 custom hook tüketimi |
| Navigasyon | Ad-hoc `if` zinciri | `useAppRouter` hook |
| Akış dallanması | `fromDailyMission` boolean | `useFlowState` ile akış adı |
| Ebeveyn kontrolü | Inline render bloğu | `<TimeGate>` guard bileşeni |
| Dil sabitleri | App.jsx içi LANG_MAP | `constants/languages.js` |
| State yönetimi | `useState` string | Korunur + `SCREENS` sabitleri |
| React Router | Yok | Şimdilik gereksiz |

> **Altın kural:** Refactor, sırayla yapılır — her faz bağımsız olarak taşınabilir ve geri alınabilir. Hiçbir sayfa bileşeni değişmeden App.jsx sıfırlanabilir hale getirilebilir.
