/**
 * AguiLangEvo · Profile DB Queries (Node.js only)
 * Browser/WebView içinde kullanılamaz.
 * React tarafı src/context/AppContext.jsx → localStorage kullanır.
 */

import { getDb } from './db.js'

/**
 * İlk profili döner (id=1). Yoksa null.
 * @returns {object|null}
 */
export function getProfile() {
  const db = getDb()
  return db.prepare('SELECT * FROM profiles ORDER BY id ASC LIMIT 1').get() ?? null
}

/**
 * Profil oluşturur, id'yi döner.
 * @param {'adult'|'child'} ageMode
 * @param {'en'|'es'|'pt'}  uiLang
 * @returns {number} lastInsertRowid
 */
export function createProfile(ageMode, uiLang = 'en') {
  const db = getDb()
  const res = db.prepare(`
    INSERT INTO profiles (name, type, avatar_initial, ui_language)
    VALUES ('Aguila', ?, 'A', ?)
  `).run(ageMode, uiLang)
  return res.lastInsertRowid
}

/**
 * Profili günceller.
 * @param {number} id
 * @param {object} fields  — { name, type, ui_language, placement_done, current_level, ... }
 */
export function updateProfile(id, fields) {
  const db = getDb()
  const allowed = ['name', 'type', 'avatar_initial', 'ui_language',
                   'placement_done', 'current_level', 'points', 'level',
                   'streak', 'last_active_date']
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k))
  if (!entries.length) return

  const sets   = entries.map(([k]) => `${k} = ?`).join(', ')
  const values = entries.map(([, v]) => v)
  db.prepare(`UPDATE profiles SET ${sets} WHERE id = ?`).run(...values, id)
}
