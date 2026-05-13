import Database from 'better-sqlite3';
import { readFileSync } from 'fs';

const db = new Database('data/aguilangevo.db');

// JSON verisini oku
const wordsData = JSON.parse(readFileSync('data/words_b1.json', 'utf-8'));

console.log(`Toplam ${wordsData.length} kelime yüklenecek...`);

// Transaction kullanarak veritabanı işlemleri
const insertWord = db.prepare(`
  INSERT OR IGNORE INTO words (word, language_id, part_of_speech, cefr_level, ipa)
  VALUES (?, ?, ?, ?, ?)
`);

const insertTranslation = db.prepare(`
  INSERT OR IGNORE INTO word_translations (word_id, target_lang, translation, alt_translations, example_target)
  VALUES (?, ?, ?, ?, ?)
`);

const getWordId = db.prepare(`
  SELECT id FROM words WHERE word = ? AND language_id = 'en'
`);

let addedCount = 0;

const transaction = db.transaction(() => {
  for (const wordData of wordsData) {
    // Kelimeyi ekle
    const wordResult = insertWord.run(
      wordData.word,
      'en',
      wordData.part_of_speech,
      wordData.cefr_level,
      wordData.ipa
    );

    // Eğer kelime yeni eklenmiş ise (changes > 0)
    if (wordResult.changes > 0) {
      addedCount++;
    }

    // Word ID'yi al
    const wordRow = getWordId.get(wordData.word);
    if (!wordRow) continue;
    
    const wordId = wordRow.id;

    // ES çevirisi ekle
    if (wordData.translations?.es) {
      const es = wordData.translations.es;
      insertTranslation.run(
        wordId,
        'es',
        es.translation,
        JSON.stringify(es.alt_translations || []),
        es.example_target || null
      );
    }

    // PT çevirisi ekle
    if (wordData.translations?.pt) {
      const pt = wordData.translations.pt;
      insertTranslation.run(
        wordId,
        'pt',
        pt.translation,
        JSON.stringify(pt.alt_translations || []),
        pt.example_target || null
      );
    }
  }
});

transaction();

console.log(`${addedCount} kelime eklendi`);

db.close();