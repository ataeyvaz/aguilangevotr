/**
  * AguiLangEvo - Unified Data Store
  * Tüm kelime kaynaklarını birleştiren merkezi veri yöneticisi
  *
  * Yerleştirme: src/store/useWordStore.js
  * Kullanım:    const { words, addWords, getByLevel } = useWordStore()
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCoreWords } from '../data/oxford/oxfordProcessor';
import { batchMigrate } from '../migration/migrationHelper';
import { createUserProgress, createWordProgress } from '../schema/dataSchema';

// ─── VITE GLOB IMPORTS ────────────────────────────────────────────────────────
const categoryJsonModules = import.meta.glob('../data/*-a1.json');
const aguiLang1Modules    = import.meta.glob('../data/aguilang1/*.json');

// ─── SINGLETON CACHE ──────────────────────────────────────────────
let _cachedWords    = null
let _cachedProgress = null
let _initPromise    = null

function convertCategoryJson(rawData) {
  const entries = [];
  const category = rawData.category || 'general';
  const level = (rawData.level || 'a1').toUpperCase();
  const translations = rawData.translations || {};

  for (const [lang, langData] of Object.entries(translations)) {
    const words = langData.words || [];
    words.forEach(w => {
      if (!w.word || !w.tr) return;
      entries.push({
        id: `local_${lang}_${category}_${w.id || w.word}`,
        word: w.word,
        translation: w.tr,
        language: lang,
        level,
        category,
        examples: (w.sentences || [])
          .map(s => s.en || s.text || s[lang] || '')
          .filter(Boolean)
          .slice(0, 2),
        partOfSpeech: null,
        source: 'local',
        frequency: null,
        phonetic: w.pron || null,
        emoji: w.emoji || null,
      });
    });
  }
  return entries;
}

const STORE_KEY    = 'aguilangevo_words';
const PROGRESS_KEY = 'aguilangevo_progress';
const VERSION_KEY  = 'aguilangevo_db_version';
const DB_VERSION   = '2.1.0';

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Storage write failed:', e);
    return false;
  }
}

// ─── INDEX YARDIMCILARI ────────────────────────────────────────────────────────
function buildIndex(words) {
  const byId       = {};
  const byLevel    = {};
  const byCategory = {};
  const byLanguage = {};

  words.forEach(w => {
    byId[w.id] = w;

    if (!byLevel[w.level]) byLevel[w.level] = [];
    byLevel[w.level].push(w.id);

    if (!byCategory[w.category]) byCategory[w.category] = [];
    byCategory[w.category].push(w.id);

    if (!byLanguage[w.language]) byLanguage[w.language] = [];
    byLanguage[w.language].push(w.id);
  });

  return { byId, byLevel, byCategory, byLanguage };
}

// ─── MAIN HOOK ───────────────────────────────────────────────────────────────
export function useWordStore() {
  const [words,    setWords]    = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [initialized, setInitialized] = useState(false);

  const buildInitialDatabase = useCallback(async () => {
    const allWords = [];

    // 1. Temel Oxford NGSL kelimeleri
    const coreEN = getCoreWords('en');
    allWords.push(...coreEN);

    // 2. Kategori A1 JSON dosyaları (src/data/*-a1.json)
    const catMods = await Promise.all(Object.values(categoryJsonModules).map(fn => fn()));
    for (const mod of catMods) {
      const entries = convertCategoryJson(mod.default ?? mod);
      allWords.push(...entries);
    }
    console.log(`📂 Kategori JSONlarından ${allWords.length - coreEN.length} kelime yüklendi`);

    // 3. AguiLang1 migrate dosyaları (src/data/aguilang1/*.json)
    const l1Files = await Promise.all(
      Object.entries(aguiLang1Modules).map(async ([path, fn]) => {
        const mod = await fn();
        return { name: path.split('/').pop(), data: mod.default ?? mod };
      })
    );
    if (l1Files.length > 0) {
      const { entries: l1Entries, stats } = batchMigrate(l1Files);
      const existingIds = new Set(allWords.map(w => w.id));
      const newL1 = l1Entries.filter(w => !existingIds.has(w.id));
      allWords.push(...newL1);
      console.log(`📥 AguiLang1: ${newL1.length} yeni kelime eklendi`, stats);
    }

    // 4. Kullanıcı eklediği kelimeler
    const userWords = loadFromStorage('aguilangevo_user_words', []);
    allWords.push(...userWords);

    return allWords;
  }, []);

  const initializeStore = useCallback(async () => {
    // Zaten başlatıldıysa cache'den al
    if (_cachedWords !== null) {
      setWords(_cachedWords)
      setProgress(_cachedProgress)
      setLoading(false)
      setInitialized(true)
      return
    }

    // Başka bir instance zaten yüklüyorsa bekle
    if (_initPromise) {
      await _initPromise
      setWords(_cachedWords)
      setProgress(_cachedProgress)
      setLoading(false)
      setInitialized(true)
      return
    }

    setLoading(true)

    _initPromise = (async () => {
      const storedVersion = localStorage.getItem(VERSION_KEY)
      let storedWords = loadFromStorage(STORE_KEY, [])

      if (storedVersion !== DB_VERSION || storedWords.length === 0) {
        console.log('🔄 AguiLangEvo veritabanı başlatılıyor...')
        storedWords = await buildInitialDatabase()
        saveToStorage(STORE_KEY, storedWords)
        localStorage.setItem(VERSION_KEY, DB_VERSION)
      }

      const storedProgress = loadFromStorage(PROGRESS_KEY, null) || createUserProgress('en')
      saveToStorage(PROGRESS_KEY, storedProgress)

      _cachedWords    = storedWords
      _cachedProgress = storedProgress
      console.log(`✅ ${storedWords.length} kelime yüklendi (singleton)`)
    })()

    await _initPromise

    setWords(_cachedWords)
    setProgress(_cachedProgress)
    setLoading(false)
    setInitialized(true)
  }, [buildInitialDatabase])

  // ── İlk yükleme ──
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // ── İndeks (memo) ──
  const index = useMemo(() => buildIndex(words), [words]);

  // ── Kelime sorgulama ──
  const getByLevel = useCallback((level, language = null) => {
    const ids = index.byLevel[level] || [];
    return ids
      .map(id => index.byId[id])
      .filter(w => !language || w.language === language);
  }, [index]);

  const getByCategory = useCallback((category, language = null) => {
    const ids = index.byCategory[category] || [];
    return ids
      .map(id => index.byId[id])
      .filter(w => !language || w.language === language);
  }, [index]);

  const getByLanguage = useCallback((language) => {
    return (index.byLanguage[language] || []).map(id => index.byId[id]);
  }, [index]);

  const searchWords = useCallback((query, language = null) => {
    if (!query?.trim()) return [];
    const q = query.toLowerCase();
    return words.filter(w => {
      const matchLang = !language || w.language === language;
      const matchWord = w.word?.toLowerCase().includes(q) ||
                        w.translation?.toLowerCase().includes(q);
      return matchLang && matchWord;
    }).slice(0, 50);
  }, [words]);

  // ── Kelime ekleme ──
  const addWords = useCallback((newWords) => {
    setWords(prev => {
      const existingIds = new Set(prev.map(w => w.id));
      const toAdd = newWords.filter(w => !existingIds.has(w.id));
      if (toAdd.length === 0) return prev;

      const updated = [...prev, ...toAdd];
      saveToStorage(STORE_KEY, updated);

      // Kullanıcı eklenenler ayrı da sakla
      const userKey = 'aguilangevo_user_words';
      const userWords = loadFromStorage(userKey, []);
      const toAddUser = toAdd.filter(w => w.source === 'user');
      if (toAddUser.length > 0) {
        saveToStorage(userKey, [...userWords, ...toAddUser]);
      }

      return updated;
    });
  }, []);

  // ── AguiLang1 Migration ──
  const importAguiLang1Files = useCallback((files) => {
    const { entries, stats } = batchMigrate(files);
      saveToStorage('aguilangevo_migrated_words', entries);
    addWords(entries);
    return stats;
  }, [addWords]);

  // ── İlerleme güncelleme ──
  const updateProgress = useCallback((wordId, correct) => {
    setProgress(prev => {
      const wp = prev.words[wordId] || createWordProgress();
      const now = Date.now();

      const updated = {
        ...wp,
        seen:      wp.seen + 1,
        correct:   correct ? wp.correct + 1 : wp.correct,
        incorrect: correct ? wp.incorrect : wp.incorrect + 1,
        streak:    correct ? wp.streak + 1 : 0,
        lastSeen:  now,
        mastered:  wp.streak >= 4 && correct,
        // Spaced repetition: doğruysa daha uzun aralık
        nextReview: now + (correct
          ? Math.min(Math.pow(2, wp.streak) * 3600000, 7 * 86400000)  // max 7 gün
          : 1800000), // yanlışsa 30 dakika
      };

      const xpGained = correct ? (updated.mastered ? 20 : 10) : 2;
      const newProgress = {
        ...prev,
        words: { ...prev.words, [wordId]: updated },
        stats: {
          ...prev.stats,
          totalXP:      prev.stats.totalXP + xpGained,
          wordsLearned: updated.mastered
            ? prev.stats.wordsLearned + 1
            : prev.stats.wordsLearned,
          lastActive:   now,
        },
      };

      saveToStorage(PROGRESS_KEY, newProgress);
      return newProgress;
    });
  }, []);

  // ── Spaced Repetition: tekrar zamanı gelen kelimeler ──
  const getDueForReview = useCallback((language = null, limit = 20) => {
    const now = Date.now();
    return words
      .filter(w => {
        if (language && w.language !== language) return false;
        const wp = progress?.words[w.id];
        if (!wp) return true; // hiç görülmemişse dahil et
        return wp.nextReview && wp.nextReview <= now;
      })
      .slice(0, limit);
  }, [words, progress]);

  // ── İstatistikler ──
  const stats = useMemo(() => {
    if (!progress) return null;
    const wordEntries = Object.values(progress.words);
    return {
      totalWords:   words.length,
      seen:         wordEntries.length,
      mastered:     wordEntries.filter(w => w.mastered).length,
      accuracy:     wordEntries.length === 0 ? 0 : Math.round(
        wordEntries.reduce((a, w) => a + (w.correct / Math.max(w.seen, 1)), 0)
        / wordEntries.length * 100
      ),
      totalXP:      progress.stats.totalXP,
      wordsLearned: progress.stats.wordsLearned,
      streak:       progress.stats.streak,
      byLevel: Object.fromEntries(
        Object.keys(index.byLevel).map(level => [
          level,
          { total: (index.byLevel[level] || []).length }
        ])
      ),
    };
  }, [words, progress, index]);

  return {
    // Veri
    words, progress, loading, initialized,
    // Sorgulama
    getByLevel, getByCategory, getByLanguage, searchWords, getDueForReview,
    // Değiştirme
    addWords, importAguiLang1Files, updateProgress,
    // İstatistikler
    stats,
    // Yardımcı
    totalCount: words.length,
  };
}
