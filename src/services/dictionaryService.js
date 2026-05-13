/**
 * AguiLang2 - Dictionary Service
 * MyMemory API + cache + fallback strategy
 *
 * MyMemory: free, 5000 requests/day (10000/day with email)
 * API: https://api.mymemory.translated.net/get?q=WORD&langpair=en|es
 */

const CACHE_KEY = 'aguilang2_dict_cache_v2'; // v2: invalidates old TR-language caches
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_BASE = 'https://api.mymemory.translated.net/get';

// Optional: MyMemory account email (for increased daily limit)
// .env: VITE_MYMEMORY_EMAIL=your@email.com
const USER_EMAIL = import.meta.env?.VITE_MYMEMORY_EMAIL || '';

// ─── Cache Management ────────────────────────────────────
function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Clean old entries if localStorage is full
    clearOldCache();
  }
}

function clearOldCache() {
  const cache = getCache();
  const now = Date.now();
  const cleaned = Object.fromEntries(
    Object.entries(cache).filter(([, v]) => now - v.timestamp < CACHE_TTL)
  );
  localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
}

function getCacheKey(word, sourceLang, targetLang) {
  return `${word.toLowerCase().trim()}|${sourceLang}|${targetLang}`;
}

// ─── MyMemory API ─────────────────────────────────────────
/**
 * Fetch translation from MyMemory
 * @param {string} word
 * @param {string} sourceLang - 'en','es','pt'
 * @param {string} targetLang - target language code
 */
async function fetchFromMyMemory(word, sourceLang = 'en', targetLang) {
  if (!targetLang) throw new Error('targetLang is required');
  const langpair = `${sourceLang}|${targetLang}`;
  const params = new URLSearchParams({ q: word, langpair });
  if (USER_EMAIL) params.append('de', USER_EMAIL);

  const response = await fetch(`${API_BASE}?${params}`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error(`MyMemory API error: ${response.status}`);

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory: ${data.responseDetails}`);
  }

  return {
    translation: data.responseData.translatedText,
    confidence: data.responseData.match,
    alternatives: (data.matches || [])
      .slice(0, 5)
      .filter(m => m.translation !== data.responseData.translatedText)
      .map(m => ({ text: m.translation, source: m.subject })),
    source: 'mymemory',
  };
}

// ─── Fallback: Wiktionary ─────────────────────────────────
async function fetchFromWiktionary(word) {
  const response = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`,
    { signal: AbortSignal.timeout(4000) }
  );
  if (!response.ok) throw new Error('Wiktionary error');

  const data = await response.json();
  return {
    translation: null,
    definition: data.extract || null,
    phonetic: data.pronunciation || null,
    source: 'wiktionary',
  };
}

// ─── Main Dictionary Function ─────────────────────────────
/**
 * Lookup word - cache → MyMemory → Wiktionary fallback
 *
 * @param {string} word
 * @param {string} sourceLang - 'en' | 'es' | 'pt'
 * @param {string} targetLang - target language code
 * @returns {Promise<DictionaryResult>}
 */
export async function lookupWord(word, sourceLang = 'en', targetLang) {
  if (!targetLang) throw new Error('targetLang is required');
  if (!word?.trim()) throw new Error('Word cannot be empty');

  const cacheKey = getCacheKey(word, sourceLang, targetLang);
  const cache = getCache();

  // Cache check
  if (cache[cacheKey]) {
    const entry = cache[cacheKey];
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return { ...entry.data, fromCache: true };
    }
  }

  let result;

  // 1. Try MyMemory
  try {
    const myMemoryResult = await fetchFromMyMemory(word, sourceLang, targetLang);
    result = {
      word: word.trim(),
      translation: myMemoryResult.translation,
      alternatives: myMemoryResult.alternatives || [],
      confidence: myMemoryResult.confidence,
      sourceLang,
      targetLang,
      source: 'mymemory',
      timestamp: Date.now(),
    };
  } catch (myMemoryError) {
    console.warn('MyMemory failed, trying Wiktionary...', myMemoryError);

    // 2. Wiktionary fallback
    try {
      const wikiResult = await fetchFromWiktionary(word);
      result = {
        word: word.trim(),
        translation: null,
        definition: wikiResult.definition,
        phonetic: wikiResult.phonetic,
        alternatives: [],
        confidence: 0,
        sourceLang,
        targetLang,
        source: 'wiktionary',
        timestamp: Date.now(),
      };
    } catch {
      throw new Error(`Translation not found for "${word}". Please check your internet connection.`);
    }
  }

  // Save to cache
  const updatedCache = { ...getCache(), [cacheKey]: { data: result, timestamp: Date.now() } };
  setCache(updatedCache);

  return result;
}

// ─── Batch Translation ────────────────────────────────────
/**
 * Translate multiple words sequentially (with delay to avoid rate limits)
 * @param {string[]} words
 * @param {string} sourceLang
 * @param {number} delayMs - delay between requests (default 300ms)
 */
export async function batchLookup(words, sourceLang = 'en', delayMs = 300) {
  const results = [];

  for (let i = 0; i < words.length; i++) {
    try {
      const result = await lookupWord(words[i], sourceLang);
      results.push({ word: words[i], ...result, error: null });
    } catch (err) {
      results.push({ word: words[i], error: err.message });
    }

    // Wait if not last word
    if (i < words.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

// ─── Cache Stats ─────────────────────────────────────────
export function getCacheStats() {
  const cache = getCache();
  const entries = Object.values(cache);
  const now = Date.now();
  return {
    totalEntries: entries.length,
    validEntries: entries.filter(e => now - e.timestamp < CACHE_TTL).length,
    sizeKB: Math.round(JSON.stringify(cache).length / 1024),
  };
}

export function clearDictionaryCache() {
  localStorage.removeItem(CACHE_KEY);
}

// ─── Hook Usage Example ──────────────────────────────────
/**
 * For use in React hook:
 *
 * function useDictionary() {
 *   const [result, setResult] = useState(null)
 *   const [loading, setLoading] = useState(false)
 *   const [error, setError] = useState(null)
 *
 *   const lookup = useCallback(async (word, lang, targetLang) => {
 *     setLoading(true); setError(null)
 *     try {
 *       const data = await lookupWord(word, lang, targetLang)
 *       setResult(data)
 *     } catch(e) {
 *       setError(e.message)
 *     } finally {
 *       setLoading(false)
 *     }
 *   }, [])
 *
 *   return { result, loading, error, lookup }
 * }
 */