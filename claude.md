# CLAUDE.md — Grabket Proje Kılavuzu

> Bu dosyayı her oturumun başında oku. Projenin hafızasısın.

---

## 🧑‍💻 Geliştirici Profili

- **İsim:** Ata
- **Seviye:** Deneyimsiz geliştirici, kodlamayı öğrenme aşamasında
- **Çalışma stili:**
  - Adım adım ilerle, her adımı Türkçe açıkla
  - Kopyala-yapıştır yapabileceği **tam ve eksiksiz** komutlar ver
  - Kısmi snippet verme, her zaman **tam dosya içeriğini** ver
  - Hata çıktısını yapıştırınca analiz et ve çöz
  - Varsayım yapma, emin olmadığında sor
- **Ortam:** Windows, PowerShell, VS Code
- **Konuşma dili:** Türkçe

---

## 📱 Proje: Grabket

**Açıklama:** Türkiye pazarına yönelik akıllı alışveriş listesi uygulaması. Kullanıcı alışveriş listesini oluşturur, uygulama A101, BİM, Migros, CarrefourSA, ŞOK gibi marketlerdeki fiyatları karşılaştırıp en ucuz sepeti bulur.

**Hedef kitle:** Önce kişisel kullanım, sonra App Store / Play Store yayını.

**Veri kaynağı:** marketfiyati.org.tr (TÜBİTAK + Merkez Bankası projesi, ücretsiz, kamuya açık)

---

## 🛠️ Tech Stack

```
Frontend:  React Native + Expo SDK + TypeScript
Router:    Expo Router (file-based navigation)
Backend:   Firebase (Auth + Firestore + Cloud Functions)
API:       marketfiyati.org.tr — https://api.marketfiyati.org.tr/api/v2
```

---

## 📡 marketfiyati.org.tr API Bilgileri

**Base URL:** `https://api.marketfiyati.org.tr/api/v2`

**API Key:** Yok (kamuya açık, ücretsiz)

**Bilinen Endpoint'ler:**
```
GET /products
  Params: keywords (string), latitude (float), longitude (float),
          distance (km, opsiyonel), size (int, opsiyonel)

GET /products/{id}
  Params: latitude (float), longitude (float)

GET /products/{id}/compare
  Params: productId (string)
```

**Kritik not:** latitude ve longitude parametreleri zorunlu — API yakındaki mağazaların fiyatlarını döndürür.

**Mimari kararı — Proxy katmanı:**
```
Grabket App → Firebase Cloud Functions → marketfiyati.org.tr API
```
Neden: API değişirse sadece Cloud Function güncellenir, app store'a yeniden göndermek gerekmez.

**Faz 3 başında yapılacak ilk iş:** Gerçek API response'unu test et.
Kontrol edilecekler:
- Alternatif/eşdeğer ürün verisi geliyor mu?
- Kampanya / kart indirimi alanı var mı?
- Rate limit ne kadar?

---

## ✅ Netleştirilmiş Özellik Listesi

### v1 — MVP

#### Alışveriş listesi yönetimi
- Birden fazla liste oluşturma, silme, yeniden adlandırma
- Ürün ekleme — isimle API araması ile
- Ürün miktarı ve birimi (adet / kg / lt / paket)
- Alışveriş modu: ürüne dokununca "aldım" işareti (üstü çizilir)

#### Fiyat karşılaştırma
- Ürün bazında market karşılaştırması (A101, BİM, Migros, ŞOK, CarrefourSA)
- İki mod — kullanıcı seçsin:
  - Tek market modu: tüm listeyi tek marketten al, hangisi en ucuz?
  - Böl-al modu: her ürünü en ucuz olduğu marketten al, toplam minimum
- Konum: GPS otomatik alır, kullanıcı isterse manuel değiştirir
- Sepet toplam tutarı göster

#### Barkod — UI hazır, fonksiyon v2'de
- Barkod butonu arayüzde görünür ve tıklanabilir
- v1'de tıklayınca "Bu özellik yakında geliyor" mesajı
- v2'de gerçek kamera tarama eklenir
- Neden böyle: tasarım tutarlı kalır, kullanıcı özelliğin geleceğini bilir

#### Hesap sistemi
- Firebase Auth ile e-posta + şifre kayıt / giriş
- Kullanıcı profili (isim, e-posta)

#### API'ye bağımlı — Faz 3'te test sonrası karar
- Alternatif ürün önerileri: "Pınar süt yerine Sek süt %15 ucuz." API veriyi sunuyorsa ekle.
- Kampanya / kart indirimleri: "CarrefourSA kart ile 25₺." API alanı varsa göster.

---

### v2 — Sonraki sürüm (şimdi dokunma)

- Barkod okuma (gerçek kamera taraması)
- Anlık fiyat değişikliği bildirimi (push notification)
- Fiyat geçmişi grafiği (30 günlük trend)
- Enflasyon takibi
- Bütçe takibi (aylık harcama özeti)
- Liste paylaşımı (rol bazlı: sahip düzenler, davet edilen görür)
- Gerçek zamanlı senkronizasyon (Firestore realtime)

---

## 🗂️ Proje Klasör Yapısı

```
grabket/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx           # Listelerim (ana ekran)
│   │   ├── compare.tsx         # Fiyat karşılaştırma sonuçları
│   │   └── profile.tsx         # Kullanıcı profili
│   ├── _layout.tsx
│   ├── list/
│   │   └── [id].tsx            # Belirli liste detayı
│   └── auth/
│       ├── login.tsx
│       └── register.tsx
├── components/
│   ├── ShoppingList/
│   │   ├── ListCard.tsx
│   │   ├── ProductItem.tsx
│   │   └── AddProductModal.tsx
│   ├── PriceComparison/
│   │   ├── MarketCard.tsx
│   │   ├── ModeSwitcher.tsx    # Tek market / Böl-al seçici
│   │   └── BarcodeButton.tsx   # UI placeholder — v1'de "yakında"
│   └── common/
│       ├── EmptyState.tsx
│       └── LoadingSpinner.tsx
├── services/
│   ├── marketApi.ts            # marketfiyati.org.tr çağrıları
│   ├── firebase.ts             # Firebase config
│   ├── auth.ts
│   └── lists.ts                # Liste CRUD
├── hooks/
│   ├── useLocation.ts          # GPS + manuel konum
│   └── usePriceComparison.ts
├── store/
│   └── useAppStore.ts          # Zustand global state
├── types/
│   ├── product.ts
│   ├── list.ts
│   └── market.ts
├── constants/
│   ├── markets.ts
│   └── theme.ts
├── utils/
│   └── priceCalculator.ts      # Her iki mod algoritması
├── .env                        # Asla git'e ekleme!
├── .env.example
├── CLAUDE.md
├── PROGRESS.md
└── SOLUTIONS.md
```

---

## 🎨 Tasarım Sistemi

```typescript
const colors = {
  primary:    '#E84040',  // Kırmızı — ana aksiyon
  secondary:  '#1A1A2E',  // Koyu lacivert — başlıklar
  success:    '#2ECC71',  // Yeşil — en ucuz
  warning:    '#F39C12',  // Turuncu — orta fiyat
  danger:     '#E74C3C',  // Kırmızı — pahalı
  background: '#F8F9FA',
  surface:    '#FFFFFF',
  text:       '#2C3E50',
  muted:      '#95A5A6',
}

const marketColors = {
  'BİM':         '#E30613',
  'A101':        '#FF6B00',
  'Migros':      '#FF0000',
  'ŞOK':         '#FFD700',
  'CarrefourSA': '#004A96',
}
```

---

## 🗺️ Geliştirme Fazları

### ✅ Faz 0 — Araştırma & Planlama (TAMAMLANDI)
- [x] API araştırması
- [x] Tech stack kararı
- [x] Özellik listesi netleştirildi
- [x] Proje dökümanları hazırlandı

### 🔄 Faz 1 — Temel Altyapı (MEVCUT FAZ)
- [ ] Expo projesi kurulumu (TypeScript template)
- [ ] Expo Router tab navigasyonu
- [ ] Firebase projesi oluşturma ve bağlantı
- [ ] Firebase Auth (login / register ekranları)
- [ ] Temel TypeScript tipleri
- [ ] .env yapılandırması

### ⏳ Faz 2 — Alışveriş Listesi
- [ ] Liste CRUD — Firestore
- [ ] Ürün ekleme (API araması ile)
- [ ] Miktar ve birim
- [ ] Alışveriş modu (aldım işareti)
- [ ] BarcodeButton UI placeholder

### ⏳ Faz 3 — Fiyat Karşılaştırma
- [ ] API gerçek testi ve response analizi
- [ ] Konum izni + GPS
- [ ] Market fiyat kartları
- [ ] Tek market mod algoritması
- [ ] Böl-al mod algoritması
- [ ] Alternatif ürün (API'ye bağımlı)
- [ ] Kampanya/kart indirimi (API'ye bağımlı)

### ⏳ Faz 4 — Cilalama & Yayın
- [ ] Hata yönetimi ve boş state'ler
- [ ] Loading skeleton'ları
- [ ] App icon ve splash screen
- [ ] Expo EAS Build
- [ ] App Store / Play Store

---

## 🔥 Firebase Yapısı (Firestore)

```
users/{userId}
  displayName: string
  email: string
  createdAt: timestamp

lists/{listId}
  title: string
  ownerId: string
  createdAt: timestamp
  updatedAt: timestamp

  items/{itemId}
    name: string
    quantity: number
    unit: 'adet' | 'kg' | 'lt' | 'paket'
    checked: boolean
    barcode?: string
    productId?: string
    addedBy: string
    createdAt: timestamp

priceCache/{productId}
  data: object
  cachedAt: timestamp
  expiresAt: timestamp    ← 1 saat sonra expire
```

---

## ⚡ Kritik Kurallar

1. `.env` dosyasını asla git'e ekleme
2. API çağrılarını doğrudan app'ten yapma — Cloud Functions üzerinden
3. Her özellik için önce TypeScript tipi, sonra component
4. BarcodeButton her zaman görünür — sadece onPress davranışı v1/v2'de değişir
5. Konum iznini fiyat karşılaştırma anında iste, açılışta değil
6. Firestore security rules'u baştan yaz
7. priceCache'i kullan — aynı ürünü tekrar tekrar API'den çekme

---

## 📝 Oturum Başlangıç Rutini

1. CLAUDE.md oku
2. PROGRESS.md oku
3. SOLUTIONS.md oku
4. Ata'ya mevcut durumu özetle, sonra devam et

---

## 🔗 Kaynaklar

- Expo: https://docs.expo.dev
- Expo Router: https://docs.expo.dev/router/introduction/
- Firebase: https://firebase.google.com/docs/web/setup
- API ref (Python): https://github.com/yibudak/marketfiyati_mcp
- API ref (TS): https://github.com/aigile-era/market-mcp-serkan
