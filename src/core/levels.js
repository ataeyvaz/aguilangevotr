/**
 * core/levels.js — CEFR seviye tanımları (A1 → C2)
 * Tek kaynak: tüm uygulama seviye bilgisini buradan alır.
 */
export const LEVELS = {
  A1: { id: 'A1', order: 1, label: 'A1 · Başlangıç',       color: '#22c55e', minXP: 0    },
  A2: { id: 'A2', order: 2, label: 'A2 · Temel',            color: '#84cc16', minXP: 300  },
  B1: { id: 'B1', order: 3, label: 'B1 · Orta',             color: '#eab308', minXP: 800  },
  B2: { id: 'B2', order: 4, label: 'B2 · Orta-üstü',        color: '#f97316', minXP: 1600 },
  C1: { id: 'C1', order: 5, label: 'C1 · İleri',            color: '#ef4444', minXP: 2800 },
  C2: { id: 'C2', order: 6, label: 'C2 · Ustalık',          color: '#8b5cf6', minXP: 4500 },
}

export const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function levelFromXP(xp = 0) {
  let current = 'A1'
  for (const id of LEVEL_ORDER) {
    if (xp >= LEVELS[id].minXP) current = id
  }
  return current
}

export function nextLevel(id) {
  const i = LEVEL_ORDER.indexOf(id)
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null
}
