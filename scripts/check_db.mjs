import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'data', 'aguilangevo.db'));

console.log('=== TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => console.log(' -', t.name));

console.log('\n=== CONVERSATION_PACKS SCHEMA ===');
const packSchema = db.prepare('PRAGMA table_info(conversation_packs)').all();
console.log(JSON.stringify(packSchema, null, 2));

console.log('\n=== CONVERSATION_EXCHANGES SCHEMA ===');
const exchSchema = db.prepare('PRAGMA table_info(conversation_exchanges)').all();
console.log(JSON.stringify(exchSchema, null, 2));

console.log('\n=== CURRENT PACKS IN DB ===');
const packs = db.prepare(`SELECT cp.id, cp.word, cp.difficulty, cp.bot_language, cp.level, cp.context, COUNT(ce.id) as exchange_count 
  FROM conversation_packs cp 
  LEFT JOIN conversation_exchanges ce ON cp.id = ce.pack_id 
  GROUP BY cp.id`).all();
packs.forEach(p => console.log(`- [${p.id}] ${p.context || p.word} (${p.bot_language}, ${p.difficulty}) - ${p.exchange_count} exchanges`));

db.close();