/**
 * scenarios/index.js — Senaryo kataloğu (veri-güdümlü)
 *
 * Yeni senaryo eklemek için:
 *  1) src/data/scenarios/{id}-a1.json dosyasını oluştur (market şablonu)
 *  2) buraya bir satır ekle. ScenariosPage otomatik gösterir.
 *
 * "planned: true" → içerik henüz yok (yakında rozetiyle görünür).
 */
export const DOMAINS = {
  social:   { label: 'Selamlaşma & Sosyal', emoji: '👋' },
  shopping: { label: 'Alışveriş',            emoji: '🛍️' },
  food:     { label: 'Yeme-İçme',            emoji: '🍽️' },
  school:   { label: 'Okul',                 emoji: '🏫' },
  travel:   { label: 'Seyahat & Yön',        emoji: '✈️' },
  health:   { label: 'Sağlık',               emoji: '🏥' },
  daily:    { label: 'Günlük Hayat',         emoji: '☀️' },
  work:     { label: 'İş & Meslek',          emoji: '💼' },
}

export const SCENARIOS = [
  { id: 'greetings',  title: 'Tanışma & Selam',     emoji: '🙋', domain: 'social',   level: 'A1' },
  { id: 'market',     title: 'Markette Alışveriş',  emoji: '🛒', domain: 'shopping', level: 'A1' },
  { id: 'restaurant', title: 'Restoranda Sipariş',  emoji: '🍽️', domain: 'food',     level: 'A1' },
  { id: 'school',     title: 'Okulda İlk Gün',      emoji: '🏫', domain: 'school',   level: 'A1' },
  { id: 'directions', title: 'Yol Sorma',           emoji: '🧭', domain: 'travel',   level: 'A1' },
  { id: 'airport',    title: 'Havaalanında',        emoji: '🛫', domain: 'travel',   level: 'A2' },
  { id: 'hotel',      title: 'Otelde',              emoji: '🏨', domain: 'travel',   level: 'A2' },
  { id: 'doctor',     title: 'Doktorda',            emoji: '🩺', domain: 'health',   level: 'A2' },
  { id: 'emergency',  title: 'Acil Durum',          emoji: '🚨', domain: 'daily',    level: 'A2' },
  { id: 'phone',      title: 'Telefon Konuşması',   emoji: '📞', domain: 'daily',    level: 'A2' },
]
