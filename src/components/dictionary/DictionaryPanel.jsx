/**
 * AguiLang2 - Dictionary Component
 * Yerleştirme: src/components/Dictionary/DictionaryPanel.jsx
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { lookupWord, getCacheStats, clearDictionaryCache } from '../../services/dictionaryService';
import { useWordStore } from '../../store/useWordStore';
import { useTranslation } from '../../i18n/translations';
import { useApp } from '../../context/AppContext';

const LANG_LABELS = { en: '🇬🇧 English', es: '🇪🇸 Spanish', pt: '🇧🇷 Portuguese' };
const POS_LABELS = {
  noun: 'noun', verb: 'verb', adjective: 'adjective',
  adverb: 'adverb', preposition: 'preposition', conjunction: 'conjunction', pronoun: 'pronoun',
};

// ─── ANA BİLEŞEN ─────────────────────────────────────────────────────────────
export default function DictionaryPanel({ defaultLang = 'en' }) {
  const { t } = useTranslation();
  const { uiLanguage, profile } = useApp();
  // Restrict to supported languages — TR must never be used as target
  const nativeLang = ['en', 'es', 'pt'].includes(uiLanguage) ? uiLanguage : 'en';
  const rawTargetLang = profile?.learn_lang;
  const targetLang = ['en', 'es', 'pt'].includes(rawTargetLang) && rawTargetLang !== nativeLang
    ? rawTargetLang
    : (nativeLang === 'en' ? 'es' : 'en');
  const [query,    setQuery]    = useState('');
  const [lang,     setLang]     = useState(defaultLang);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [cacheInfo, setCacheInfo] = useState(null);

  const [autoAdded, setAutoAdded] = useState(false);

  const inputRef = useRef(null);
  const { addWords, searchWords, words: storeWords } = useWordStore();

  // Fast lookup map for cross-language translation display in suggestions
  const wordById = useMemo(() => new Map(storeWords.map(w => [w.id, w])), [storeWords]);

  // Yerel arama önerileri
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length >= 2) {
      const local = searchWords(query, lang).slice(0, 5);
      setSuggestions(local);
    } else {
      setSuggestions([]);
    }
  }, [query, lang, searchWords]);

  const handleLookup = useCallback(async (word = query) => {
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSuggestions([]);
    setAutoAdded(false);

    // source = selected dictionary language, target = user's native language
    // If source === native (e.g. EN speaker looking up EN word), fall back to ES
    const targetLang = lang !== nativeLang ? nativeLang : (lang === 'en' ? 'es' : 'en');

    try {
      const data = await lookupWord(word.trim(), lang, targetLang);
      setResult(data);
      setHistory(h => [{ word: word.trim(), lang, data }, ...h].slice(0, 20));

      // Yerel veritabanında yoksa otomatik ekle
      const translationText = data.translation || data.definition || '';
      if (translationText) {
        const alreadyExists = storeWords.some(
          w => w.word.toLowerCase() === data.word.toLowerCase() && w.language === lang
        );
        if (!alreadyExists) {
          addWords([{
            id:          `dict_${lang}_${Date.now()}`,
            word:        data.word,
            translation: translationText,
            language:    lang,
            level:       'A2',
            category:    'general',
            source:      'dictionary',
            phonetic:    data.phonetic || null,
            examples:    [],
          }]);
          setAutoAdded(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, lang, nativeLang, addWords, storeWords]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleSaveWord = useCallback(() => {
    if (!result) return;
    addWords([{
      id:          `user_${lang}_${Date.now()}`,
      word:        result.word,
      translation: result.translation || result.definition || '',
      language:    lang,
      level:       'A2',
      category:    'general',
      source:      'user',
      phonetic:    result.phonetic || null,
    }]);
  }, [result, lang, addWords]);

  const loadCacheInfo = () => {
    setCacheInfo(getCacheStats());
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">📖 {t('dictionary')}</h2>
        <button
          onClick={loadCacheInfo}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cache info
        </button>
      </div>

      {/* Önbellek bilgisi */}
      {cacheInfo && (
        <div className="text-xs bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-3">
          <span>💾 {cacheInfo.totalEntries} words cached ({cacheInfo.sizeKB}KB)</span>
          <button
            onClick={() => { clearDictionaryCache(); setCacheInfo(null); }}
            className="text-red-500 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Arama alanı */}
      <div className="relative flex gap-2">
        {/* Dil seçici */}
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="shrink-0 px-3 py-2 border border-gray-200 dark:border-gray-700
                     rounded-xl bg-white dark:bg-gray-800 text-sm font-medium
                     focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        {/* Kelime girişi */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('searchWord')}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700
                       rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResult(null); setError(null); setSuggestions([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}

          {/* Öneriler dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800
                            border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10">
              {suggestions.map(w => {
                let displayTr = '';
                if (w.source === 'local') {
                  // local words: tr field is always Turkish — cross-lookup the correct language
                  const pairLang = lang === nativeLang ? targetLang : nativeLang;
                  const pairedId = w.id.replace(`local_${lang}_`, `local_${pairLang}_`);
                  displayTr = wordById.get(pairedId)?.word || '';
                } else if (w.source !== 'oxford3000') {
                  // dict_ / user_ words: translation was set via API in the correct lang
                  displayTr = w.translation || '';
                }
                // oxford3000: translation is always Turkish — never show
                return (
                  <button
                    key={w.id}
                    onClick={() => { setQuery(w.word); handleLookup(w.word); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700
                               first:rounded-t-xl last:rounded-b-xl transition-colors"
                  >
                    <span className="font-medium text-gray-800 dark:text-white">{w.word}</span>
                    {displayTr && (
                      <span className="text-gray-400 ml-2 text-sm">→ {displayTr}</span>
                    )}
                    <span className="float-right text-xs text-indigo-500">{w.level}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ara butonu */}
        <button
          onClick={() => handleLookup()}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
                     text-white rounded-xl font-medium transition-colors shrink-0"
        >
          {loading ? <LoadingSpinner /> : t('search')}
        </button>
      </div>

      {/* Hata */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                        rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Yükleniyor */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <LoadingSpinner /> <span className="ml-2">Loading...</span>
        </div>
      )}

      {/* Sonuç kartı */}
      {result && !loading && (
        <ResultCard result={result} onSave={handleSaveWord} initialSaved={autoAdded} />
      )}

      {/* Arama geçmişi */}
      {history.length > 0 && !result && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Recent searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 10).map((h, i) => (
              <button
                key={i}
                onClick={() => { setQuery(h.word); setLang(h.lang); handleLookup(h.word); }}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm
                           text-gray-700 dark:text-gray-300 hover:bg-indigo-100
                           dark:hover:bg-indigo-900 transition-colors"
              >
                {h.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SONUÇ KARTI ─────────────────────────────────────────────────────────────
function ResultCard({ result, onSave, initialSaved = false }) {
  const [saved, setSaved] = useState(initialSaved);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    rounded-2xl p-5 shadow-sm">
      {/* Kelime & kaydet */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {result.word}
          </h3>
          {result.phonetic && (
            <p className="text-gray-400 text-sm mt-0.5">/{result.phonetic}/</p>
          )}
        </div>
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-green-100 text-green-600'
              : 'bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
          }`}
        >
          {saved ? '✅ Added' : '+ Add to list'}
        </button>
      </div>

      {/* Translation */}
      {result.translation && (
        <div className="mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {({ en: 'English', es: 'Spanish', pt: 'Portuguese' }[result.targetLang] ?? 'Translation')}:{' '}
          </span>
          <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            {result.translation}
          </span>
        </div>
      )}

      {/* Tanım (Wiktionary fallback) */}
      {result.definition && !result.translation && (
        <div className="mb-3 text-gray-700 dark:text-gray-300 text-sm bg-gray-50
                        dark:bg-gray-700 rounded-xl p-3">
          {result.definition}
        </div>
      )}

      {/* Alternatifler */}
      {result.alternatives?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Other translations:</p>
          <div className="flex flex-wrap gap-1.5">
            {result.alternatives.slice(0, 5).map((alt, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg
                           text-sm text-gray-600 dark:text-gray-300"
              >
                {alt.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Kaynak & güven skoru */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400">
          Source: {result.source === 'mymemory' ? 'MyMemory' : 'Wiktionary'}
        </span>
        {result.confidence > 0 && (
          <ConfidenceBadge score={result.confidence} />
        )}
        {result.fromCache && (
          <span className="text-xs text-gray-400">💾 from cache</span>
        )}
      </div>
    </div>
  );
}

function ConfidenceBadge({ score }) {
  const pct   = Math.round(score * 100);
  const color  = score > 0.8 ? 'green' : score > 0.5 ? 'yellow' : 'red';
  const labels = { green: 'High', yellow: 'Medium', red: 'Low' };
  const colors = {
    green:  'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
    red:    'bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[color]}`}>
      {labels[color]} confidence ({pct}%)
    </span>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}
