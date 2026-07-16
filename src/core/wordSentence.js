/**
 * wordSentence.js — Bir kelimeden, türüne uygun basit bir cümle üretir.
 *
 * Amaç: çocuk kelimeyi öğrenirken AYNI YERDE onunla cümle kurabilsin.
 * Her tür için BİRDEN ÇOK kalıp var (soru, istek, verme, sevme, tanımlama...)
 * ve rastgele seçilir → aynı kelime farklı yapılarda cümle üretir,
 * çocuk birden çok cümle yapısını öğrenir.
 *
 * Not: hedef dil cümlesi öğrenmenin odağı; TR sadece anlam ipucudur.
 * {w} yerine hedef kelime gelir; tr(x) fonksiyonu TR anlamı verir.
 */

function typeOf(entry) {
  if (entry.pos === 'verb' || entry.category === 'verbs') return 'verb'
  if (entry.category === 'adjectives' || entry.category === 'colors') return 'adj'
  return 'noun'
}

const TEMPLATES = {
  // ── İSİMLER (elma, köpek, masa...) ──
  noun: [
    { fn: 'tanımlama', en: 'This is {w}',        es: 'Esto es {w}',        pt: 'Isto é {w}',          de: 'Das ist {w}',           tr: w => `Bu bir ${w}` },
    { fn: 'sahiplik',  en: 'I have {w}',         es: 'Tengo {w}',          pt: 'Eu tenho {w}',        de: 'Ich habe {w}',          tr: w => `Bende ${w} var` },
    { fn: 'isteme',    en: 'I want {w}',         es: 'Quiero {w}',         pt: 'Eu quero {w}',        de: 'Ich möchte {w}',        tr: w => `${w} istiyorum` },
    { fn: 'sevme',     en: 'I like {w}',         es: 'Me gusta {w}',       pt: 'Eu gosto de {w}',     de: 'Ich mag {w}',           tr: w => `${w} severim` },
    { fn: 'soru',      en: 'Do you want {w}?',   es: '¿Quieres {w}?',      pt: 'Você quer {w}?',      de: 'Möchtest du {w}?',       tr: w => `${w} ister misin?` },
    { fn: 'soru',      en: 'Where is {w}?',      es: '¿Dónde está {w}?',   pt: 'Onde está {w}?',      de: 'Wo ist {w}?',            tr: w => `${w} nerede?` },
    { fn: 'rica',      en: 'Give me {w}, please', es: 'Dame {w}, por favor', pt: 'Me dá {w}, por favor', de: 'Gib mir {w}, bitte',   tr: w => `Bana ${w} ver, lütfen` },
    { fn: 'verme',     en: 'Here is {w}',        es: 'Aquí está {w}',      pt: 'Aqui está {w}',       de: 'Hier ist {w}',           tr: w => `İşte ${w}` },
  ],

  // ── FİİLLER (koşmak, yemek, okumak...) ── (TR mastarla çalışan kalıplar)
  verb: [
    { fn: 'isteme',    en: 'I want to {w}',       es: 'Quiero {w}',        pt: 'Eu quero {w}',        de: 'Ich möchte {w}',        tr: w => `${w} istiyorum` },
    { fn: 'soru',      en: 'Do you want to {w}?', es: '¿Quieres {w}?',     pt: 'Você quer {w}?',      de: 'Möchtest du {w}?',       tr: w => `${w} ister misin?` },
    { fn: 'sevme',     en: 'I like to {w}',       es: 'Me gusta {w}',      pt: 'Eu gosto de {w}',     de: 'Ich mag {w}',            tr: w => `${w} severim` },
    { fn: 'zaman',     en: 'I want to {w} now',   es: 'Quiero {w} ahora',  pt: 'Eu quero {w} agora',  de: 'Ich möchte jetzt {w}',   tr: w => `Şimdi ${w} istiyorum` },
    { fn: 'olumsuz',   en: "I don't want to {w}", es: 'No quiero {w}',     pt: 'Eu não quero {w}',    de: 'Ich möchte nicht {w}',   tr: w => `${w} istemiyorum` },
  ],

  // ── SIFATLAR / RENKLER (büyük, kırmızı...) ──
  adj: [
    { fn: 'tanımlama', en: 'It is {w}',           es: 'Es {w}',            pt: 'É {w}',               de: 'Es ist {w}',            tr: w => `Bu ${w}` },
    { fn: 'derece',    en: 'It is very {w}',      es: 'Es muy {w}',        pt: 'É muito {w}',         de: 'Es ist sehr {w}',        tr: w => `Çok ${w}` },
    { fn: 'soru',      en: 'Is it {w}?',          es: '¿Es {w}?',          pt: 'É {w}?',              de: 'Ist es {w}?',            tr: w => `${w} mı?` },
    { fn: 'sıfat+isim', en: 'The dog is {w}',     es: 'El perro es {w}',   pt: 'O cachorro é {w}',    de: 'Der Hund ist {w}',       tr: w => `Köpek ${w}` },
    { fn: 'sıfat+isim', en: 'My house is {w}',    es: 'Mi casa es {w}',    pt: 'Minha casa é {w}',    de: 'Mein Haus ist {w}',      tr: w => `Evim ${w}` },
  ],
}

/**
 * @param {object} entry  words/{level}.json girdisi
 * @param {string} lang   hedef dil
 * @returns {{tr, target, fn}|null}
 */
export function makeSentenceForWord(entry, lang) {
  if (!entry) return null
  const w = entry[lang] || entry.en
  if (!w) return null
  const list = TEMPLATES[typeOf(entry)]
  const t = list[Math.floor(Math.random() * list.length)]
  const target = (t[lang] || t.en).replace('{w}', w)
  return { tr: t.tr(entry.tr || ''), target, fn: t.fn }
}
