/**
 * AguiLang2 - Migration Utility
 * Migrate AguiLang1 Tatoeba data to AguiLang2 format
 *
 * USAGE:
 *   import { migrateAguiLang1Data } from './migrationHelper'
 *   const result = await migrateAguiLang1Data()
 */

// ─── Detect AguiLang1 JSON Format ──────────────────────────────────────
// AguiLang1 Tatoeba format (possible structures):
// Format A: { sentences: [{id, text, translation, tags}] }
// Format B: { words: [{word, meaning, example, level}] }
// Format C: [{en: "...", es: "...", level: "A1", category: "..."}]

/**
 * Extract language and level info from AguiLang1 filename
 * Example filenames: "en-es-a1.json", "de-es-b1.json", "es-a2.json"
 */
export function parseFilename(filename) {
  const base = filename.replace('.json', '').toLowerCase();
  const parts = base.split(/[-_]/);

  const levelMatch = base.match(/\b(a1|a2|b1|b2|b3|c1)\b/i);
  const level = levelMatch ? levelMatch[1].toUpperCase() : 'A1';

  const langCodes = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh'];
  const foundLangs = parts.filter(p => langCodes.includes(p));
  const sourceLanguage = foundLangs[0] || 'en';
  const targetLanguage = foundLangs[1] || null;

  return { language: sourceLanguage, level, sourceLanguage, targetLanguage };
}

/**
 * Convert a single AguiLang1 JSON file to AguiLang2 WordEntry[] format
 */
export function convertAguiLang1File(rawData, filename) {
  const { sourceLanguage, targetLanguage, level } = parseFilename(filename);
  const entries = [];
  const rawItems = normalizeRawData(rawData);

  rawItems.forEach((item, index) => {
    let word, translation, language, id;

    if (targetLanguage && item[targetLanguage]) {
      // e.g. en-es-a1.json: word=Spanish, translation=English, language='es'
      word = item[targetLanguage];
      translation = item[sourceLanguage] || '';
      language = targetLanguage;
      id = `${targetLanguage}_${level}_general_${index}`;
    } else {
      // en-es-a1.json or default: source word + Spanish translation
      word = extractWord(item, sourceLanguage);
      translation = extractTranslation(item);
      language = sourceLanguage;
      id = `${sourceLanguage}_${level}_general_${index}`;
    }

    if (!word || !translation) return;

    const category = guessCategory(word, translation);

    entries.push({
      id: `${language}_${level}_${category}_${index}`,
      word: word.trim(),
      translation: translation.trim(),
      language,
      level,
      category,
      examples: extractExamples(item),
      partOfSpeech: item.pos || item.part_of_speech || null,
      source: 'tatoeba',
      frequency: null,
      phonetic: item.phonetic || item.ipa || null,
    });
  });

  console.log(`✅ ${filename}: ${entries.length} words converted`);
  return entries;
}

// ─── Normalize Raw Data ─────────────────────────────────────────────────
function normalizeRawData(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw.sentences) return raw.sentences;
  if (raw.words) return raw.words;
  if (raw.data) return raw.data;
  if (raw.entries) return raw.entries;
  // object map format: { "hello": { es: "hola", ... } }
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        delete val.tr;
      }
      return {
        word: key, ...(typeof val === 'string' ? { translation: val } : val)
      };
    });
  }
  return [];
}

function extractWord(item, language) {
  return item.word || item[language] || item.text ||
         item.source || item.target_word || item.term || '';
}

function extractTranslation(item) {
  return item.translation || item.meaning ||
         item.translate || item.definition || '';
}

function extractExamples(item) {
  const ex = item.example || item.examples || item.sentence || item.sentences;
  if (!ex) return [];
  if (Array.isArray(ex)) return ex.slice(0, 3);
  if (typeof ex === 'string') return [ex];
  return [];
}

// ─── Category Guessing ──────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  'greetings':      ['hello','hi','bye','goodbye','welcome','thank','please','sorry'],
  'numbers':        ['one','two','three','number','count'],
  'colors':         ['red','blue','green','color','colour'],
  'family':         ['mother','father','sister','brother','family'],
  'food-drinks':    ['eat','food','drink','bread','water','coffee'],
  'animals':        ['dog','cat','bird','animal'],
  'body-parts':     ['head','hand','eye','body'],
  'clothing':       ['shirt','dress','clothes','wear'],
  'transportation': ['car','bus','train','travel'],
  'weather':        ['rain','sun','cloud','weather'],
  'home':           ['house','room','door','home'],
  'school':         ['school','learn','study','teacher'],
  'sports':         ['sport','play','game','ball'],
  'time':           ['time','day','week','month','year'],
  'professions':    ['work','job','doctor','teacher'],
  'health':         ['sick','doctor','medicine','hospital'],
  'travel':         ['travel','trip','hotel','airport'],
  'shopping':       ['buy','shop','price','money'],
  'technology':     ['computer','phone','internet','digital'],
  'business':       ['business','company','office','meeting'],
};

function guessCategory(word, translation) {
  const combined = `${word} ${translation}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) return cat;
  }
  return 'general';
}

// ─── Batch Migration ────────────────────────────────────────────────────
/**
 * Batch migrate multiple AguiLang1 files
 * @param {Object[]} files - [{ name: 'en-es-a1.json', data: {...} }]
 * @returns {{ entries: WordEntry[], stats: Object }}
 */
export function batchMigrate(files) {
  const allEntries = [];
  const stats = { total: 0, byLanguage: {}, byLevel: {}, duplicates: 0 };
  const seenIds = new Set();

  for (const { name, data } of files) {
    const entries = convertAguiLang1File(data, name);

    entries.forEach(entry => {
      if (seenIds.has(entry.id)) {
        stats.duplicates++;
        return;
      }
      seenIds.add(entry.id);
      allEntries.push(entry);

      stats.byLanguage[entry.language] = (stats.byLanguage[entry.language] || 0) + 1;
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
    });
  }

  stats.total = allEntries.length;
  console.log('📊 Migration Stats:', stats);
  return { entries: allEntries, stats };
}

// ─── Usage Example ─────────────────────────────────────────────────────
/**
 * Usage in React component:
 *
 * import { batchMigrate } from './migrationHelper'
 * import en_a1 from '../../aguilang1/en-es-a1.json'
 * import de_b1 from '../../aguilang1/de-es-b1.json'
 *
 * const { entries, stats } = batchMigrate([
 *   { name: 'en-es-a1.json', data: en_a1 },
 *   { name: 'de-es-b1.json', data: de_b1 },
 * ])
 *
 * // Save to localStorage
 * localStorage.setItem('aguilang2_migrated_words', JSON.stringify(entries))
 */