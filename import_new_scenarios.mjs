import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'data', 'aguilangevo.db'));
db.pragma('foreign_keys = ON');

// New scenario files to import
const newFiles = [
  'conversation_pack_hospital.json',
  'conversation_pack_bank.json',
  'conversation_pack_postoffice.json',
  'conversation_pack_gym.json',
  'conversation_pack_movietheater.json',
  'conversation_pack_hairsalon.json',
  'conversation_pack_gasstation.json',
  'conversation_pack_pharmacy.json'
];

// Check existing packs
const getPack = db.prepare(
  'SELECT id FROM conversation_packs WHERE word = ? AND difficulty = ? AND bot_language = ?'
);

const insertPack = db.prepare(`
  INSERT INTO conversation_packs
    (word, difficulty, bot_language, level, context)
  VALUES
    (?, ?, ?, ?, ?)
`);

const insertExchange = db.prepare(`
  INSERT INTO conversation_exchanges
    (pack_id, exchange_order, bot_message, options, correct_index, points)
  VALUES
    (?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
let skipped = 0;

for (const file of newFiles) {
  try {
    const data = JSON.parse(readFileSync(join(__dirname, file), 'utf8'));
    
    const word = data.scenario;
    const difficulty = data.difficulty || 'easy';
    const bot_language = data.language || 'pt';
    const level = 'a1';
    const context = word.charAt(0).toUpperCase() + word.slice(1);
    
    // Check if already exists
    const existing = getPack.get(word, difficulty, bot_language);
    if (existing) {
      console.log(`⏭️  Skipped: ${context} (already exists)`);
      skipped++;
      continue;
    }
    
    // Insert pack
    const packResult = insertPack.run(word, difficulty, bot_language, level, context);
    const packId = packResult.lastInsertRowid;
    
    // Insert exchanges
    for (let i = 0; i < data.exchanges.length; i++) {
      const ex = data.exchanges[i];
      // Create options with expected answer as correct option
      const options = JSON.stringify([
        ex.expected,
        "...",
        "..."
      ]);
      
      insertExchange.run(packId, i + 1, ex.bot, options, 0, 10);
    }
    
    console.log(`✅ Inserted: ${context} (${data.exchanges.length} exchanges)`);
    inserted++;
    
  } catch (err) {
    console.error(`❌ Error processing ${file}:`, err.message);
  }
}

console.log(`\n📊 Done: ${inserted} inserted, ${skipped} skipped`);
db.close();