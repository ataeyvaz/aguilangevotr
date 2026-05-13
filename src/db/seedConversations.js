/**
 * seedConversations.js
 * Conversation pack JSON dosyalarını SQLite DB'ye aktarır.
 * Çalıştır: node src/db/seedConversations.js
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { getDb, closeDb } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

const BATCH_FILES = [
  'conversation_pack_test.json',
  'conversation_pack_batch2.json',
  'conversation_pack_batch3.json',
  'conversation_pack_batch4.json',
  'conversation_pack_batch5.json',
  'conversation_pack_missing.json',
  'conversation_pack_pt_batch1.json',
]

// ── JSON dosyalarını yükle ve birleştir ───────────────────────
function loadAllPacks() {
  const all = []
  for (const fname of BATCH_FILES) {
    const fpath = join(ROOT, fname)
    if (!existsSync(fpath)) {
      console.log(`  ⚠️  Bulunamadı: ${fname}`)
      continue
    }
    const raw = readFileSync(fpath, 'utf8').trim()
    if (!raw) {
      console.log(`  ⚠️  Boş dosya: ${fname}`)
      continue
    }
    try {
      const packs = JSON.parse(raw)
      console.log(`  ✅ ${fname}: ${packs.length} pack yüklendi`)
      all.push(...packs)
    } catch (e) {
      console.log(`  ❌ ${fname}: JSON parse hatası — ${e.message}`)
    }
  }
  return all
}

// ── Ana seed fonksiyonu ───────────────────────────────────────
function seed() {
  console.log('\n═══════════════════════════════════════════')
  console.log(' seedConversations.js başlatıldı')
  console.log('═══════════════════════════════════════════\n')

  console.log('📂 ADIM 1 — Dosyalar yükleniyor...')
  const allPacks = loadAllPacks()
  console.log(`\n   Toplam yüklenen pack: ${allPacks.length}\n`)

  console.log('🗄️  ADIM 2 — DB bağlantısı ve migration...')
  const db = getDb()
  console.log('   Migration tamamlandı.\n')

  // ── Prepared statements ──────────────────────────────────
  const findWord = db.prepare(
    `SELECT id FROM words WHERE LOWER(word) = LOWER(?) AND language_id = 'en' LIMIT 1`
  )
  const checkDuplicate = db.prepare(
    `SELECT id FROM conversation_packs WHERE word = ? AND difficulty = ? AND bot_language = ? LIMIT 1`
  )
  const insertPack = db.prepare(`
    INSERT INTO conversation_packs
      (word_id, word, level, difficulty, context, bot_language)
    VALUES
      (@word_id, @word, @level, @difficulty, @context, @bot_language)
  `)
  const insertExchange = db.prepare(`
    INSERT INTO conversation_exchanges
      (pack_id, exchange_order, bot_message, options,
       correct_index, points, feedback_correct, feedback_wrong)
    VALUES
      (@pack_id, @exchange_order, @bot_message, @options,
       @correct_index, @points, @feedback_correct, @feedback_wrong)
  `)

  // ── Sayaçlar ─────────────────────────────────────────────
  let countPack       = 0
  let countExchange   = 0
  let countWordMatch  = 0
  let countWordNull   = 0
  let countDuplicate  = 0
  let countError      = 0
  const nullWords     = []

  console.log('⚙️  ADIM 3 — Seed işlemi başlıyor...\n')

  const runSeed = db.transaction(() => {
    for (let i = 0; i < allPacks.length; i++) {
      const pack = allPacks[i]

      try {
        // Duplicate kontrol
        const botLang = pack.bot_language || 'es'
        const dup = checkDuplicate.get(pack.word, pack.difficulty, botLang)
        if (dup) {
          countDuplicate++
          continue
        }

        // words tablosunda eşleşme ara
        const wordRow = findWord.get(pack.word)
        const wordId  = wordRow ? wordRow.id : null

        if (wordId) {
          countWordMatch++
        } else {
          countWordNull++
          if (!nullWords.includes(pack.word)) nullWords.push(pack.word)
        }

        // conversation_packs INSERT
        const packResult = insertPack.run({
          word_id:      wordId,
          word:         pack.word,
          level:        pack.level,
          difficulty:   pack.difficulty,
          context:      pack.context || null,
          bot_language: pack.bot_language || 'es',
        })
        const packId = packResult.lastInsertRowid
        countPack++

        // conversation_exchanges INSERT
        const exchanges = pack.exchanges || []
        for (let j = 0; j < exchanges.length; j++) {
          const ex = exchanges[j]
          insertExchange.run({
            pack_id:          packId,
            exchange_order:   j,
            bot_message:      ex.bot,
            options:          JSON.stringify(ex.options),
            correct_index:    ex.correct,
            points:           ex.points || 10,
            feedback_correct: ex.feedback_correct || null,
            feedback_wrong:   ex.feedback_wrong   || null,
          })
          countExchange++
        }

        // Her 50 pakette bir ilerleme logu
        if (countPack % 50 === 0) {
          console.log(`   ... ${countPack} pack eklendi`)
        }
      } catch (e) {
        countError++
        console.log(`   ❌ Pack hatası (${pack.word}/${pack.difficulty}): ${e.message}`)
      }
    }
  })

  runSeed()

  // ── Özet rapor ────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════')
  console.log(' SEED ÖZET RAPORU')
  console.log('═══════════════════════════════════════════')
  console.log(`  Toplam pack      : ${countPack}`)
  console.log(`  Exchange         : ${countExchange}`)
  console.log(`  word_id eşleşti  : ${countWordMatch}`)
  console.log(`  word_id null     : ${countWordNull}`)
  if (nullWords.length > 0) {
    console.log(`  Eşleşmeyen kelimeler (${nullWords.length}):`)
    for (const w of nullWords.slice(0, 30)) {
      console.log(`    - ${w}`)
    }
    if (nullWords.length > 30) console.log(`    ... ve ${nullWords.length - 30} tane daha`)
  }
  console.log(`  Duplicate skip   : ${countDuplicate}`)
  console.log(`  Hata             : ${countError}`)
  console.log('═══════════════════════════════════════════\n')

  // ── Doğrulama sorguları ───────────────────────────────────
  console.log('🔍 ADIM 4 — Doğrulama sorguları...\n')

  const totalPacks = db.prepare('SELECT COUNT(*) as c FROM conversation_packs').get().c
  const totalExch  = db.prepare('SELECT COUNT(*) as c FROM conversation_exchanges').get().c
  console.log(`  conversation_packs     : ${totalPacks} kayıt`)
  console.log(`  conversation_exchanges : ${totalExch} kayıt\n`)

  const byDiff = db.prepare(
    `SELECT difficulty, COUNT(*) as c FROM conversation_packs GROUP BY difficulty`
  ).all()
  console.log('  Difficulty dağılımı:')
  for (const row of byDiff) {
    console.log(`    ${row.difficulty.padEnd(8)}: ${row.c}`)
  }

  const topWords = db.prepare(`
    SELECT word, COUNT(*) as pack_count
    FROM conversation_packs
    GROUP BY word
    ORDER BY pack_count DESC
    LIMIT 10
  `).all()
  console.log('\n  En fazla pack\'e sahip kelimeler (top 10):')
  for (const row of topWords) {
    console.log(`    ${row.word.padEnd(20)}: ${row.pack_count}`)
  }

  console.log('\n✅ Seed tamamlandı.\n')
  closeDb()
}

seed()
