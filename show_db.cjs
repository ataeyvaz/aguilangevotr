const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join('C:/Users/Ata/Desktop/aguilangevotr/data/aguilangevo.db'));

console.log('=== languages tablosu ===');
const langs = db.prepare('SELECT * FROM languages').all();
console.table(langs);

console.log('\n=== language_pairs tablosu ===');
const pairs = db.prepare('SELECT * FROM language_pairs').all();
console.table(pairs);

db.close();
