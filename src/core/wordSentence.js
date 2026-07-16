/**
 * wordSentence.js — Bir kelimeden, türüne uygun basit bir cümle üretir.
 *
 * Amaç: çocuk kelimeyi öğrenirken AYNI YERDE onunla cümle kurabilsin
 * (bölümden çıkmadan). Fiil/sıfat/isim için farklı kalıp kullanılır.
 *
 * Not: hedef dil cümlesi öğrenmenin odağı; TR sadece anlam ipucudur.
 */

// Kelime türünü belirle
function typeOf(entry) {
  if (entry.pos === 'verb' || entry.category === 'verbs') return 'verb'
  if (entry.category === 'adjectives' || entry.category === 'colors') return 'adj'
  return 'noun'
}

// Kalıplar: {word} yerine hedef kelime gelir
const TEMPLATES = {
  verb: {
    en: 'I want to {w}', es: 'Quiero {w}', pt: 'Eu quero {w}', de: 'Ich möchte {w}',
    tr: (tr) => `${tr} istiyorum`,          // koşmak istiyorum
  },
  noun: {
    en: 'I have {w}', es: 'Tengo {w}', pt: 'Eu tenho {w}', de: 'Ich habe {w}',
    tr: (tr) => `Bende ${tr} var`,          // Bende elma var
  },
  adj: {
    en: 'It is {w}', es: 'Es {w}', pt: 'É {w}', de: 'Es ist {w}',
    tr: (tr) => `Bu ${tr}`,                 // Bu büyük
  },
}

/**
 * @param {object} entry  words/{level}.json girdisi (tr/en/es/pt/de/pos/category)
 * @param {string} lang   hedef dil
 * @returns {{tr:string, target:string}|null}
 */
export function makeSentenceForWord(entry, lang) {
  if (!entry) return null
  const w = entry[lang] || entry.en
  if (!w) return null
  const t = TEMPLATES[typeOf(entry)]
  const target = (t[lang] || t.en).replace('{w}', w)
  return { tr: t.tr(entry.tr || ''), target }
}
