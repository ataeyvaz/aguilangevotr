/**
 * AguiLang2 - Level System Component
 * A1'den B3'e kadar ilerleme görselleştirmesi
 * Yerleştirme: src/components/Levels/LevelSystem.jsx
 */

import { useMemo } from 'react';
import { LEVELS } from '../../schema/dataSchema';

const LEVEL_CONFIGS = [
  {
    key: 'A1',
    label: 'Beginner',
    range: '0–200 XP',
    wordTarget: 300,
    description: 'Greetings, numbers, colors, family members',
    unlocks: ['20 categories', 'Basic exercises', 'Flashcard mode'],
    color: 'from-emerald-400 to-green-500',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    key: 'A2',
    label: 'Elementary',
    range: '200–500 XP',
    wordTarget: 600,
    description: 'Daily dialogues, shopping, travel, time expressions',
    unlocks: ['Sentence completion', 'Listening exercises', 'Dictionary'],
    color: 'from-lime-400 to-green-500',
    textColor: 'text-lime-600',
    bgColor: 'bg-lime-50 dark:bg-lime-900/20',
    borderColor: 'border-lime-200 dark:border-lime-800',
  },
  {
    key: 'B1',
    label: 'Pre-Intermediate',
    range: '500–900 XP',
    wordTarget: 1200,
    description: 'Work, technology, news texts, connectors',
    unlocks: ['Context exercises', 'Article reading', 'Oxford 3000 B1'],
    color: 'from-yellow-400 to-amber-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    key: 'B2',
    label: 'Intermediate',
    range: '900–1400 XP',
    wordTarget: 2000,
    description: 'Academic texts, debate, abstract concepts',
    unlocks: ['Discussion simulator', 'Idioms module', 'Oxford 3000 B2'],
    color: 'from-orange-400 to-red-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  {
    key: 'B3',
    label: 'Upper-Intermediate',
    range: '1400–2000 XP',
    wordTarget: 3000,
    description: 'Advanced business language, academic writing, nuanced expressions',
    unlocks: ['Oxford 5000 B3', 'Academic word list', 'Writing assistant'],
    color: 'from-rose-400 to-pink-500',
    textColor: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  {
    key: 'C1',
    label: 'Advanced',
    range: '2000+ XP',
    wordTarget: 5000,
    description: 'Academic and professional high-level usage',
    unlocks: ['C1 content pack', 'Article generator', 'All features'],
    color: 'from-purple-400 to-violet-500',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
];

// ─── ANA BİLEŞEN ─────────────────────────────────────────────────────────────
export default function LevelSystem({ currentXP = 0, stats, onLevelSelect }) {
  const currentLevel = useMemo(() => {
    const levels = Object.entries(LEVELS).sort((a, b) => b[1].minScore - a[1].minScore);
    return levels.find(([, l]) => currentXP >= l.minScore)?.[0] || 'A1';
  }, [currentXP]);

  const nextLevel = useMemo(() => {
    const keys = Object.keys(LEVELS);
    const idx  = keys.indexOf(currentLevel);
    return keys[idx + 1] || null;
  }, [currentLevel]);

  const progressToNext = useMemo(() => {
    if (!nextLevel) return 100;
    const curr = LEVELS[currentLevel].minScore;
    const next = LEVELS[nextLevel].minScore;
    return Math.round(((currentXP - curr) / (next - curr)) * 100);
  }, [currentXP, currentLevel, nextLevel]);

  return (
    <div className="space-y-4 p-4">
      {/* Mevcut seviye özeti */}
      <CurrentLevelCard
        currentLevel={currentLevel}
        nextLevel={nextLevel}
        currentXP={currentXP}
        progress={progressToNext}
        stats={stats}
      />

      {/* Seviye yol haritası */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
        Learning Path
      </h3>
      <div className="space-y-3">
        {LEVEL_CONFIGS.map((cfg, i) => (
          <LevelCard
            key={cfg.key}
            config={cfg}
            isCurrentLevel={cfg.key === currentLevel}
            isUnlocked={Object.keys(LEVELS).indexOf(cfg.key) <=
                        Object.keys(LEVELS).indexOf(currentLevel)}
            wordsLearned={stats?.byLevel?.[cfg.key]?.total || 0}
            onSelect={onLevelSelect}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MEVCUT SEVİYE KARTI ─────────────────────────────────────────────────────
function CurrentLevelCard({ currentLevel, nextLevel, currentXP, progress, stats }) {
  const cfg = LEVEL_CONFIGS.find(c => c.key === currentLevel);
  if (!cfg) return null;

  return (
    <div className={`rounded-2xl p-5 border ${cfg.bgColor} ${cfg.borderColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-black ${cfg.textColor}`}>{cfg.key}</span>
            <span className="text-gray-600 dark:text-gray-400 font-medium">{cfg.label}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cfg.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{currentXP}</p>
          <p className="text-xs text-gray-400">total XP</p>
        </div>
      </div>

      {/* İlerleme çubuğu */}
      {nextLevel && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{cfg.key}</span>
            <span>{progress}% to {nextLevel}</span>
          </div>
          <div className="h-2.5 bg-white/60 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${cfg.color} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mini istatistikler */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Seen',     value: stats.seen || 0 },
            { label: 'Mastered', value: stats.mastered || 0 },
            { label: 'Accuracy', value: `${stats.accuracy || 0}%` },
          ].map(s => (
            <div key={s.label}
                 className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SEVİYE KARTI ────────────────────────────────────────────────────────────
function LevelCard({ config, isCurrentLevel, isUnlocked, wordsLearned, onSelect }) {
  const { key, label, range, wordTarget, description, unlocks, color,
          textColor, bgColor, borderColor } = config;

  return (
    <button
      onClick={() => isUnlocked && onSelect?.(key)}
      disabled={!isUnlocked}
      className={`w-full text-left rounded-2xl p-4 border transition-all
                  ${isCurrentLevel
                    ? `${bgColor} ${borderColor} ring-2 ring-offset-1 ring-current ${textColor}`
                    : isUnlocked
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                  }`}
    >
      <div className="flex items-center gap-3">
        {/* Seviye rozeti */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                         bg-gradient-to-br ${color} text-white font-black text-sm
                         ${!isUnlocked ? 'grayscale' : ''}`}>
          {key}
        </div>

        {/* Bilgiler */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-white">{label}</span>
            {isCurrentLevel && (
              <span className="text-xs bg-current/10 px-1.5 py-0.5 rounded-full font-medium">
                Current
              </span>
            )}
            {!isUnlocked && <span className="text-gray-400 text-xs">🔒</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
        </div>

        {/* Sağ taraf: kelime sayısı */}
        <div className="text-right shrink-0">
          <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">
            {isUnlocked ? wordsLearned : '—'}
            <span className="text-gray-400 font-normal">/{wordTarget}</span>
          </p>
          <p className="text-xs text-gray-400">{range}</p>
        </div>
      </div>

      {/* Kilidi açılan özellikler (açık seviyelerde) */}
      {isUnlocked && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {unlocks.map(u => (
            <span key={u}
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700
                             text-gray-500 dark:text-gray-400 rounded-full">
              {u}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
