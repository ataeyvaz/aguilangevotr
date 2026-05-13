/**
 * AguiLang2 - Oxford 3000 Entegrasyonu
 *
 * Oxford 3000 kelimelerini seviyeye göre kategorize eder.
 * Kaynak: https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000
 *
 * ÖNEMLİ: Oxford 3000'in tam listesi telif hakkı kapsamındadır.
 * Bu dosya, kendi derlediğiniz kelime listenizi işlemek için yapıyı sunar.
 * Ücretsiz alternatifler için SOURCES bölümüne bakın.
 */

// ─── ÜCRETSIZ KELIME LİSTESİ KAYNAKLARI ──────────────────────────────────────
/**
 * SOURCES (ücretsiz ve açık lisans):
 * 1. CEFR Wordlist (British Council): https://www.teachingenglish.org.uk/
 * 2. New General Service List: http://www.newgeneralservicelist.org/
 * 3. Frequency lists (corpus-based): https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists
 * 4. Academic Word List (AWL): https://www.victoria.ac.nz/lals/resources/academicwordlist/
 * 5. Kendi Tatoeba verileriniz (zaten AguiLang1'de var!)
 */

// ─── SEVIYE EŞLEME ─────────────────────────────────────────────────────────
export const OXFORD_LEVEL_MAP = {
  // Oxford 3000 resmi etiketleri → AguiLang2 seviyeleri
  'a1': 'A1', 'a2': 'A2',
  'b1': 'B1', 'b2': 'B2',
  'c1': 'C1', 'c2': 'C1',  // C2 yok, C1'e map et
  // Sayısal frekans aralıkları (NGSL tabanlı)
  '1-500':   'A1', '501-1000': 'A2',
  '1001-2000': 'B1', '2001-3000': 'B2',
  '3001-5000': 'B3',
};

// ─── TEMEL A1-A2 KELİMELERİ (NGSL / Public Domain) ──────────────────────────
// Bu liste NGSL (New General Service List) + CEFR tabanlı açık lisanslı kelimelerdir
export const CORE_WORD_LIST = {
  A1: [
    // Zamirler & Temel yapılar
    { word: 'I',      pos: 'pronoun', tr: 'ben' },
    { word: 'you',    pos: 'pronoun', tr: 'sen/siz' },
    { word: 'he',     pos: 'pronoun', tr: 'o (erkek)' },
    { word: 'she',    pos: 'pronoun', tr: 'o (kadın)' },
    { word: 'we',     pos: 'pronoun', tr: 'biz' },
    { word: 'they',   pos: 'pronoun', tr: 'onlar' },
    { word: 'this',   pos: 'pronoun', tr: 'bu' },
    { word: 'that',   pos: 'pronoun', tr: 'şu/o' },
    // Fiiller
    { word: 'be',     pos: 'verb',    tr: 'olmak' },
    { word: 'have',   pos: 'verb',    tr: 'sahip olmak' },
    { word: 'do',     pos: 'verb',    tr: 'yapmak' },
    { word: 'say',    pos: 'verb',    tr: 'söylemek' },
    { word: 'get',    pos: 'verb',    tr: 'almak/elde etmek' },
    { word: 'make',   pos: 'verb',    tr: 'yapmak/üretmek' },
    { word: 'go',     pos: 'verb',    tr: 'gitmek' },
    { word: 'know',   pos: 'verb',    tr: 'bilmek' },
    { word: 'think',  pos: 'verb',    tr: 'düşünmek' },
    { word: 'see',    pos: 'verb',    tr: 'görmek' },
    { word: 'come',   pos: 'verb',    tr: 'gelmek' },
    { word: 'want',   pos: 'verb',    tr: 'istemek' },
    { word: 'look',   pos: 'verb',    tr: 'bakmak' },
    { word: 'use',    pos: 'verb',    tr: 'kullanmak' },
    { word: 'find',   pos: 'verb',    tr: 'bulmak' },
    { word: 'give',   pos: 'verb',    tr: 'vermek' },
    { word: 'tell',   pos: 'verb',    tr: 'söylemek/anlatmak' },
    { word: 'work',   pos: 'verb',    tr: 'çalışmak' },
    { word: 'call',   pos: 'verb',    tr: 'aramak/çağırmak' },
    { word: 'like',   pos: 'verb',    tr: 'sevmek/beğenmek' },
    { word: 'need',   pos: 'verb',    tr: 'ihtiyaç duymak' },
    { word: 'feel',   pos: 'verb',    tr: 'hissetmek' },
    { word: 'eat',    pos: 'verb',    tr: 'yemek' },
    { word: 'drink',  pos: 'verb',    tr: 'içmek' },
    { word: 'sleep',  pos: 'verb',    tr: 'uyumak' },
    { word: 'read',   pos: 'verb',    tr: 'okumak' },
    { word: 'write',  pos: 'verb',    tr: 'yazmak' },
    { word: 'speak',  pos: 'verb',    tr: 'konuşmak' },
    { word: 'listen', pos: 'verb',    tr: 'dinlemek' },
    { word: 'learn',  pos: 'verb',    tr: 'öğrenmek' },
    { word: 'help',   pos: 'verb',    tr: 'yardım etmek' },
    { word: 'play',   pos: 'verb',    tr: 'oynamak' },
    { word: 'walk',   pos: 'verb',    tr: 'yürümek' },
    { word: 'run',    pos: 'verb',    tr: 'koşmak' },
    { word: 'buy',    pos: 'verb',    tr: 'satın almak' },
    { word: 'open',   pos: 'verb',    tr: 'açmak' },
    { word: 'close',  pos: 'verb',    tr: 'kapatmak' },
    { word: 'ask',    pos: 'verb',    tr: 'sormak' },
    { word: 'answer', pos: 'verb',    tr: 'cevaplamak' },
    { word: 'wait',   pos: 'verb',    tr: 'beklemek' },
    { word: 'start',  pos: 'verb',    tr: 'başlamak' },
    { word: 'stop',   pos: 'verb',    tr: 'durmak' },
    // İsimler
    { word: 'day',    pos: 'noun',    tr: 'gün' },
    { word: 'year',   pos: 'noun',    tr: 'yıl' },
    { word: 'time',   pos: 'noun',    tr: 'zaman/saat' },
    { word: 'week',   pos: 'noun',    tr: 'hafta' },
    { word: 'month',  pos: 'noun',    tr: 'ay' },
    { word: 'house',  pos: 'noun',    tr: 'ev' },
    { word: 'school', pos: 'noun',    tr: 'okul' },
    { word: 'book',   pos: 'noun',    tr: 'kitap' },
    { word: 'water',  pos: 'noun',    tr: 'su' },
    { word: 'food',   pos: 'noun',    tr: 'yiyecek' },
    { word: 'money',  pos: 'noun',    tr: 'para' },
    { word: 'city',   pos: 'noun',    tr: 'şehir' },
    { word: 'country',pos: 'noun',    tr: 'ülke' },
    { word: 'friend', pos: 'noun',    tr: 'arkadaş' },
    { word: 'family', pos: 'noun',    tr: 'aile' },
    { word: 'name',   pos: 'noun',    tr: 'isim' },
    { word: 'number', pos: 'noun',    tr: 'numara/sayı' },
    { word: 'door',   pos: 'noun',    tr: 'kapı' },
    { word: 'car',    pos: 'noun',    tr: 'araba' },
    { word: 'hand',   pos: 'noun',    tr: 'el' },
    { word: 'eye',    pos: 'noun',    tr: 'göz' },
    { word: 'head',   pos: 'noun',    tr: 'baş' },
    // Sıfatlar
    { word: 'good',   pos: 'adjective', tr: 'iyi' },
    { word: 'big',    pos: 'adjective', tr: 'büyük' },
    { word: 'small',  pos: 'adjective', tr: 'küçük' },
    { word: 'new',    pos: 'adjective', tr: 'yeni' },
    { word: 'old',    pos: 'adjective', tr: 'eski/yaşlı' },
    { word: 'long',   pos: 'adjective', tr: 'uzun' },
    { word: 'short',  pos: 'adjective', tr: 'kısa' },
    { word: 'happy',  pos: 'adjective', tr: 'mutlu' },
    { word: 'sad',    pos: 'adjective', tr: 'üzgün' },
    { word: 'hot',    pos: 'adjective', tr: 'sıcak' },
    { word: 'cold',   pos: 'adjective', tr: 'soğuk' },
    { word: 'fast',   pos: 'adjective', tr: 'hızlı' },
    { word: 'slow',   pos: 'adjective', tr: 'yavaş' },
    { word: 'easy',   pos: 'adjective', tr: 'kolay' },
    { word: 'hard',   pos: 'adjective', tr: 'zor/sert' },
    { word: 'right',  pos: 'adjective', tr: 'doğru/sağ' },
    { word: 'wrong',  pos: 'adjective', tr: 'yanlış' },
  ],
  A2: [
    { word: 'although',   pos: 'conjunction', tr: 'her ne kadar' },
    { word: 'actually',   pos: 'adverb',      tr: 'aslında' },
    { word: 'usually',    pos: 'adverb',      tr: 'genellikle' },
    { word: 'often',      pos: 'adverb',      tr: 'sıklıkla' },
    { word: 'sometimes',  pos: 'adverb',      tr: 'bazen' },
    { word: 'never',      pos: 'adverb',      tr: 'hiçbir zaman' },
    { word: 'already',    pos: 'adverb',      tr: 'çoktan/zaten' },
    { word: 'still',      pos: 'adverb',      tr: 'hâlâ' },
    { word: 'yet',        pos: 'adverb',      tr: 'henüz' },
    { word: 'together',   pos: 'adverb',      tr: 'birlikte' },
    { word: 'difference', pos: 'noun',        tr: 'fark' },
    { word: 'problem',    pos: 'noun',        tr: 'problem/sorun' },
    { word: 'answer',     pos: 'noun',        tr: 'cevap' },
    { word: 'question',   pos: 'noun',        tr: 'soru' },
    { word: 'minute',     pos: 'noun',        tr: 'dakika' },
    { word: 'hour',       pos: 'noun',        tr: 'saat' },
    { word: 'morning',    pos: 'noun',        tr: 'sabah' },
    { word: 'afternoon',  pos: 'noun',        tr: 'öğleden sonra' },
    { word: 'evening',    pos: 'noun',        tr: 'akşam' },
    { word: 'night',      pos: 'noun',        tr: 'gece' },
    { word: 'today',      pos: 'noun',        tr: 'bugün' },
    { word: 'tomorrow',   pos: 'noun',        tr: 'yarın' },
    { word: 'yesterday',  pos: 'noun',        tr: 'dün' },
    { word: 'restaurant', pos: 'noun',        tr: 'restoran' },
    { word: 'hospital',   pos: 'noun',        tr: 'hastane' },
    { word: 'station',    pos: 'noun',        tr: 'istasyon' },
    { word: 'airport',    pos: 'noun',        tr: 'havalimanı' },
    { word: 'beautiful',  pos: 'adjective',   tr: 'güzel' },
    { word: 'important',  pos: 'adjective',   tr: 'önemli' },
    { word: 'different',  pos: 'adjective',   tr: 'farklı' },
    { word: 'possible',   pos: 'adjective',   tr: 'mümkün' },
    { word: 'interested', pos: 'adjective',   tr: 'ilgili/meraklı' },
    { word: 'tired',      pos: 'adjective',   tr: 'yorgun' },
    { word: 'hungry',     pos: 'adjective',   tr: 'aç' },
    { word: 'thirsty',    pos: 'adjective',   tr: 'susuz' },
    { word: 'travel',     pos: 'verb',        tr: 'seyahat etmek' },
    { word: 'arrive',     pos: 'verb',        tr: 'varmak/ulaşmak' },
    { word: 'leave',      pos: 'verb',        tr: 'ayrılmak/bırakmak' },
    { word: 'remember',   pos: 'verb',        tr: 'hatırlamak' },
    { word: 'forget',     pos: 'verb',        tr: 'unutmak' },
    { word: 'understand', pos: 'verb',        tr: 'anlamak' },
    { word: 'explain',    pos: 'verb',        tr: 'açıklamak' },
    { word: 'describe',   pos: 'verb',        tr: 'tarif etmek' },
    { word: 'choose',     pos: 'verb',        tr: 'seçmek' },
    { word: 'decide',     pos: 'verb',        tr: 'karar vermek' },
  ],
};

// ─── OXFORD LİSTESİNİ AGUILANG2 FORMATINA DÖNÜŞTÜR ──────────────────────────
/**
 * Oxford formatlı kelime listesini AguiLang2 WordEntry[] formatına çevirir
 * @param {Object[]} oxfordWords - [{ word, level, pos, frequency }]
 * @param {string} language - hedef dil (varsayılan 'en')
 */
export function processOxfordList(oxfordWords, language = 'en') {
  return oxfordWords.map((item, index) => {
    const level = OXFORD_LEVEL_MAP[item.level?.toLowerCase()] || 'B1';
    const category = item.category || 'general';

    return {
      id: `oxford_${language}_${level}_${index}`,
      word: item.word,
      translation: item.tr || item.translation || null, // Başlangıçta null, sonra API ile doldurulur
      language,
      level,
      category,
      partOfSpeech: item.pos || null,
      frequency: item.frequency || index + 1,
      source: 'oxford3000',
      examples: item.examples || [],
    };
  });
}

/**
 * CORE_WORD_LIST'i AguiLang2 formatına çevirir
 */
export function getCoreWords(language = 'en') {
  const entries = [];
  Object.entries(CORE_WORD_LIST).forEach(([level, words]) => {
    words.forEach((item, index) => {
      entries.push({
        id: `core_${language}_${level}_${index}`,
        word: item.word,
        translation: item.tr,
        language,
        level,
        category: guessCategoryFromPos(item.pos),
        partOfSpeech: item.pos,
        source: 'oxford3000',
        frequency: index + 1,
        examples: [],
      });
    });
  });
  return entries;
}

function guessCategoryFromPos(pos) {
  const map = {
    'verb': 'verbs', 'noun': 'nouns',
    'adjective': 'adjectives', 'adverb': 'adverbs',
    'pronoun': 'pronouns', 'conjunction': 'connectors',
    'preposition': 'prepositions',
  };
  return map[pos] || 'general';
}
