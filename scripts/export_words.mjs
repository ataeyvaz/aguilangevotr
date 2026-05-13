import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';

const db = new Database('data/aguilangevo.db');

// Query to get words with translations
const getWordsWithTranslations = (cefrLevel) => {
  const words = db.prepare(`
    SELECT 
      w.id,
      w.word,
      w.part_of_speech,
      w.cefr_level,
      w.ipa
    FROM words w
    WHERE w.cefr_level = ? AND w.language_id = 'en'
    ORDER BY w.word
  `).all(cefrLevel);

  return words.map(word => {
    // Get ES translation
    const esTrans = db.prepare(`
      SELECT translation, alt_translations, example_target
      FROM word_translations
      WHERE word_id = ? AND target_lang = 'es'
    `).get(word.id);

    // Get PT translation
    const ptTrans = db.prepare(`
      SELECT translation, alt_translations, example_target
      FROM word_translations
      WHERE word_id = ? AND target_lang = 'pt'
    `).get(word.id);

    const result = {
      word: word.word,
      part_of_speech: word.part_of_speech,
      cefr_level: word.cefr_level,
      ipa: word.ipa,
      translations: {}
    };

    if (esTrans) {
      result.translations.es = {
        translation: esTrans.translation,
        alt_translations: esTrans.alt_translations ? JSON.parse(esTrans.alt_translations) : [],
        example_target: esTrans.example_target || null
      };
    }

    if (ptTrans) {
      result.translations.pt = {
        translation: ptTrans.translation,
        alt_translations: ptTrans.alt_translations ? JSON.parse(ptTrans.alt_translations) : [],
        example_target: ptTrans.example_target || null
      };
    }

    return result;
  });
};

// Export B1 words
console.log('Exporting B1 words...');
const b1Words = getWordsWithTranslations('B1');
writeFileSync('src/data/words-b1.json', JSON.stringify(b1Words, null, 2), 'utf-8');
console.log(`Exported ${b1Words.length} B1 words to src/data/words-b1.json`);

// Export B2 words
console.log('Exporting B2 words...');
const b2Words = getWordsWithTranslations('B2');
writeFileSync('src/data/words-b2.json', JSON.stringify(b2Words, null, 2), 'utf-8');
console.log(`Exported ${b2Words.length} B2 words to src/data/words-b2.json`);

db.close();
console.log('Done!');