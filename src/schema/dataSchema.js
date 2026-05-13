/**
 * AguiLang2 - Unified Data Schema
 * Consolidates all data sources (AguiLang1 + Oxford 3000 + user data) into a single format
 */

// ─── LEVEL DEFINITIONS ──────────────────────────────────────────────────────
export const LEVELS = {
  A1: { label: 'A1 Beginner',     order: 1, color: '#22c55e', minScore: 0   },
  A2: { label: 'A2 Elementary',    order: 2, color: '#84cc16', minScore: 200  },
  B1: { label: 'B1 Intermediate',  order: 3, color: '#eab308', minScore: 500  },
  B2: { label: 'B2 Upper Intermediate', order: 4, color: '#f97316', minScore: 900  },
  B3: { label: 'B3 Advanced',        order: 5, color: '#ef4444', minScore: 1400 },
  C1: { label: 'C1 Proficient',     order: 6, color: '#8b5cf6', minScore: 2000 },
};

// ─── SUPPORTED LANGUAGES ────────────────────────────────────────────────────
export const LANGUAGES = {
  EN: { code: 'en', label: 'English', flag: '🇺🇸', myMemoryCode: 'en-US' },
  ES: { code: 'es', label: 'Spanish', flag: '🇪🇸', myMemoryCode: 'es-MX' },
  PT: { code: 'pt', label: 'Portuguese', flag: '🇧🇷', myMemoryCode: 'pt-BR' },
};

// ─── WORD ENTRY SCHEMA ──────────────────────────────────────────────────────
/**
 * @typedef {Object} WordEntry
 * @property {string}   id          - Unique ID: "{lang}_{level}_{category}_{index}"
 * @property {string}   word        - Target language word
 * @property {string}   translation - Translation in target language
 * @property {string}   language    - 'en' | 'de' | 'es'
 * @property {string}   level       - 'A1'|'A2'|'B1'|'B2'|'B3'|'C1'
 * @property {string}   category    - Category name (slug format)
 * @property {string}   [phonetic]  - IPA phonetic (optional)
 * @property {string[]} [examples]  - Example sentences
 * @property {string}   [partOfSpeech] - 'noun'|'verb'|'adjective'|'adverb'|'phrase'
 * @property {string}   source      - 'tatoeba'|'oxford3000'|'user'|'manual'
 * @property {number}   [frequency] - Oxford 3000 frequency score (1-3000)
 */

// ─── CATEGORY SCHEMA ────────────────────────────────────────────────────────
/**
 * @typedef {Object} Category
 * @property {string}   id       - slug: 'daily-life'
 * @property {string}   label    - Category label
 * @property {string}   icon     - emoji
 * @property {string[]} levels   - which levels it appears in
 * @property {string}   [color]  - theme color
 */

// AguiLang2 existing 20 categories + newly added ones
export const CATEGORIES = {
  // Existing AguiLang2 categories (A1)
  'greetings':      { label: 'Greetings',      icon: '👋', levels: ['A1','A2'] },
  'numbers':        { label: 'Numbers',          icon: '🔢', levels: ['A1','A2'] },
  'colors':         { label: 'Colors',          icon: '🎨', levels: ['A1'] },
  'family':         { label: 'Family',          icon: '👨‍👩‍👧', levels: ['A1','A2'] },
  'food-drinks':    { label: 'Food & Drink',    icon: '🍎', levels: ['A1','A2','B1'] },
  'animals':        { label: 'Animals',         icon: '🐾', levels: ['A1','A2'] },
  'body-parts':     { label: 'Body Parts',      icon: '🫀', levels: ['A1','A2'] },
  'clothing':       { label: 'Clothing',        icon: '👕', levels: ['A1','A2'] },
  'transportation': { label: 'Transportation',   icon: '🚗', levels: ['A1','A2','B1'] },
  'weather':        { label: 'Weather',         icon: '☀️', levels: ['A1','A2','B1'] },
  'home':           { label: 'Home & Furniture', icon: '🏠', levels: ['A1','A2'] },
  'school':         { label: 'School',          icon: '🏫', levels: ['A1','A2'] },
  'sports':         { label: 'Sports',          icon: '⚽', levels: ['A1','A2','B1'] },
  'time':           { label: 'Time',            icon: '🕐', levels: ['A1','A2'] },
  'professions':    { label: 'Professions',     icon: '👩‍💼', levels: ['A1','A2','B1'] },
  'nature':         { label: 'Nature',          icon: '🌿', levels: ['A1','A2','B1'] },
  'emotions':       { label: 'Emotions',        icon: '😊', levels: ['A1','A2','B1'] },
  'shopping':       { label: 'Shopping',        icon: '🛍️', levels: ['A2','B1'] },
  'health':         { label: 'Health',          icon: '🏥', levels: ['A2','B1','B2'] },
  'travel':         { label: 'Travel',          icon: '✈️', levels: ['A2','B1','B2'] },
  // New B1+ categories
  'technology':     { label: 'Technology',      icon: '💻', levels: ['B1','B2','B3'] },
  'business':       { label: 'Business',        icon: '💼', levels: ['B1','B2','B3'] },
  'culture':        { label: 'Culture & Arts',  icon: '🎭', levels: ['B1','B2','B3'] },
  'science':        { label: 'Science',         icon: '🔬', levels: ['B2','B3','C1'] },
  'politics':       { label: 'Politics',        icon: '🏛️', levels: ['B2','B3','C1'] },
  'environment':    { label: 'Environment',     icon: '🌍', levels: ['B1','B2','B3'] },
  'idioms':         { label: 'Idioms',          icon: '💬', levels: ['B2','B3','C1'] },
  'academic':       { label: 'Academic',        icon: '📚', levels: ['B3','C1'] },
};

// ─── USER PROGRESS SCHEMA ───────────────────────────────────────────────────
/**
 * localStorage key: 'aguilang2_progress'
 * @typedef {Object} UserProgress
 * @property {string} userId
 * @property {Object.<string, WordProgress>} words  - wordId → progress
 * @property {Object} stats
 * @property {string} currentLevel
 * @property {string} targetLanguage
 */

/**
 * @typedef {Object} WordProgress
 * @property {number} seen         - number of times seen
 * @property {number} correct      - number of correct answers
 * @property {number} incorrect    - number of incorrect answers
 * @property {number} streak       - current streak
 * @property {number} lastSeen     - timestamp of last review
 * @property {boolean} mastered    - whether the word is mastered
 * @property {number} nextReview   - spaced repetition next review timestamp
 */

export const createWordProgress = () => ({
  seen: 0, correct: 0, incorrect: 0,
  streak: 0, lastSeen: null, mastered: false, nextReview: null,
});

export const createUserProgress = (targetLanguage = 'en') => ({
  userId: `user_${Date.now()}`,
  targetLanguage,
  currentLevel: 'A1',
  words: {},
  stats: {
    totalXP: 0, streak: 0, lastActive: null,
    sessionsCompleted: 0, wordsLearned: 0,
  },
  settings: {
    dailyGoal: 10, notifications: true, darkMode: false,
  },
});