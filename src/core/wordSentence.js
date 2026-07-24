/**
 * wordSentence.js — Bir kelimeden, türüne uygun GERÇEKÇİ bir cümle üretir.
 *
 * Amaç: çocuk kelimeyi öğrenirken AYNI YERDE onunla cümle kurabilsin —
 * cümleler günlük hayattan, mantıklı ve doğal olmalı.
 *
 * ⚠️ TASARIM KURALLARI (Temmuz 2026):
 *  1) Girdi ZATEN bir cümle/ifade ise (A2/B1 "Koştum." / "I ran.") onu ŞABLONA
 *     SOKMA → olduğu gibi göster. ("I want to I ran" saçmalığını önler.)
 *  2) Kelimenin KATEGORİSİNE özel şablon varsa DAİMA onu kullan (gerçekçi bağlam);
 *     yoksa türe göre (isim/fiil/sıfat) genel kalıp.
 *  3) Genel kalıplar HER kelimeye uyacak kadar nötr — nesnenin yenebilir/sevilebilir/
 *     kişi/uzuv olduğunu VARSAYMAZ.
 *  4) TÜRKÇE ipucunda {w} DAİMA yalın (eksiz) durur → "Bu benim baş" gibi bozuk
 *     ekler yerine doğru, doğal Türkçe. (Ekler {w}'ye değil çevre kelimelere konur.)
 */

function typeOf(entry) {
  if (entry.pos === 'verb' || entry.category === 'verbs') return 'verb'
  if (entry.category === 'adjectives' || entry.category === 'colors' || entry.category === 'feelings') return 'adj'
  return 'noun'
}

/** Girdi zaten tam bir cümle/ifade mi? (Şablona sokmadan olduğu gibi kullan.) */
function isReadySentence(entry) {
  if (entry.category === 'phrases') return true
  const en = (entry.en || '').trim()
  const tr = (entry.tr || '').trim()
  if (/[.!?]$/.test(en) || /[.!?]$/.test(tr)) return true      // noktalama → cümle
  if (en && en.split(/\s+/).length >= 3) return true            // 3+ kelime → cümle
  return false
}

const TEMPLATES = {
  // ── İSİMLER (kategorisi olmayan genel isimler) ── {w} her yerde YALIN
  noun: [
    { fn: 'tanımlama', en: 'This is a {w}',      es: 'Esto es un {w}',      pt: 'Isto é um {w}',       de: 'Das ist ein {w}',        tr: w => `Bu bir ${w}` },
    { fn: 'olumsuz',   en: 'This is not a {w}',  es: 'Esto no es un {w}',   pt: 'Isto não é um {w}',   de: 'Das ist kein {w}',       tr: w => `Bu bir ${w} değil` },
    { fn: 'soru',      en: 'Where is the {w}?',  es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?',    de: 'Wo ist der {w}?',        tr: w => `${w} nerede?` },
    { fn: 'görme',     en: 'I see a {w}',        es: 'Veo un {w}',          pt: 'Eu vejo um {w}',      de: 'Ich sehe einen {w}',     tr: w => `Bir ${w} görüyorum` },
    { fn: 'stok',      en: 'Do you have a {w}?', es: '¿Tienes un {w}?',     pt: 'Você tem um {w}?',    de: 'Hast du einen {w}?',     tr: w => `${w} var mı?` },
    { fn: 'verme',     en: 'Here is the {w}',    es: 'Aquí está el {w}',    pt: 'Aqui está o {w}',     de: 'Hier ist der {w}',       tr: w => `İşte ${w}` },
  ],

  // ── FİİLLER (mastar: koşmak, gitmek...) ── TR mastar YALIN kalır
  verb: [
    { fn: 'isteme',    en: 'I want to {w}',       es: 'Quiero {w}',        pt: 'Eu quero {w}',        de: 'Ich möchte {w}',        tr: w => `${w} istiyorum` },
    { fn: 'soru',      en: 'Do you want to {w}?', es: '¿Quieres {w}?',     pt: 'Você quer {w}?',      de: 'Möchtest du {w}?',       tr: w => `${w} ister misin?` },
    { fn: 'zorunluluk', en: 'I have to {w}',      es: 'Tengo que {w}',     pt: 'Eu tenho que {w}',    de: 'Ich muss {w}',           tr: w => `${w} zorundayım` },
    { fn: 'olumsuz',   en: "I don't want to {w}", es: 'No quiero {w}',     pt: 'Eu não quero {w}',    de: 'Ich möchte nicht {w}',   tr: w => `${w} istemiyorum` },
    { fn: 'zaman',     en: 'I want to {w} now',   es: 'Quiero {w} ahora',  pt: 'Eu quero {w} agora',  de: 'Ich möchte jetzt {w}',   tr: w => `Şimdi ${w} istiyorum` },
    { fn: 'zaman',     en: 'I want to {w} today', es: 'Quiero {w} hoy',    pt: 'Eu quero {w} hoje',   de: 'Ich möchte heute {w}',   tr: w => `Bugün ${w} istiyorum` },
  ],

  // ── SIFATLAR / RENKLER / DUYGULAR (büyük, kırmızı, mutlu...) ── özne YALIN {w}
  adj: [
    { fn: 'tanımlama', en: 'It is {w}',           es: 'Es {w}',            pt: 'É {w}',               de: 'Es ist {w}',            tr: w => `Bu ${w}` },
    { fn: 'derece',    en: 'It is very {w}',      es: 'Es muy {w}',        pt: 'É muito {w}',         de: 'Es ist sehr {w}',        tr: w => `Çok ${w}` },
    { fn: 'soru',      en: 'Is it {w}?',          es: '¿Es {w}?',          pt: 'É {w}?',              de: 'Ist es {w}?',            tr: w => `${w} mı?` },
    { fn: 'olumsuz',   en: 'It is not {w}',       es: 'No es {w}',         pt: 'Não é {w}',           de: 'Es ist nicht {w}',       tr: w => `${w} değil` },
    { fn: 'karşılaştırma', en: 'It is more {w}',  es: 'Es más {w}',        pt: 'É mais {w}',          de: 'Es ist {w}er',           tr: w => `Daha ${w}` },
    { fn: 'ünlem',     en: 'How {w}!',            es: '¡Qué {w}!',         pt: 'Que {w}!',            de: 'Wie {w}!',               tr: w => `Ne kadar ${w}!` },
  ],
}

// ══════════════════════════════════════════════════════════
// KATEGORİYE ÖZEL GERÇEKÇİ SENARYO KALIPLARI
// Kelimeyi izole değil, gerçek konuşma anında öğretir.
// Kategori şablonu olan kelime DAİMA buradan cümle alır (anlam güvenliği).
// Türkçe ipucunda {w} yalın; ekler çevre kelimelerde.
// ══════════════════════════════════════════════════════════
const MARKET = [
  { fn: 'stok',   en: 'Do you have {w}?',       es: '¿Tienes {w}?',            pt: 'Você tem {w}?',            de: 'Hast du {w}?',            tr: w => `${w} var mı?` },
  { fn: 'fiyat',  en: 'How much is {w}?',        es: '¿Cuánto cuesta {w}?',     pt: 'Quanto custa {w}?',        de: 'Wie viel kostet {w}?',    tr: w => `${w} ne kadar?` },
  { fn: 'isteme', en: 'I would like some {w}',   es: 'Quiero un poco de {w}',   pt: 'Eu quero um pouco de {w}', de: 'Ich möchte etwas {w}',    tr: w => `Biraz ${w} istiyorum` },
  { fn: 'lezzet', en: 'The {w} is delicious',    es: 'El {w} está delicioso',   pt: 'O {w} está delicioso',     de: 'Der {w} ist lecker',      tr: w => `${w} çok lezzetli` },
  { fn: 'sevme',  en: 'I like {w}',              es: 'Me gusta {w}',            pt: 'Eu gosto de {w}',          de: 'Ich mag {w}',             tr: w => `${w} severim` },
]

const CATEGORY_TEMPLATES = {
  food: MARKET, fruits: MARKET, vegetables: MARKET,

  animals: [
    { fn: 'tanımlama', en: 'Look, a {w}!',        es: '¡Mira, un {w}!',      pt: 'Olha, um {w}!',       de: 'Schau, ein {w}!',     tr: w => `Bak, bir ${w}!` },
    { fn: 'derece',    en: 'The {w} is very big',  es: 'El {w} es muy grande', pt: 'O {w} é muito grande', de: 'Der {w} ist sehr groß', tr: w => `${w} çok büyük` },
    { fn: 'sahiplik',  en: 'I have a {w}',         es: 'Tengo un {w}',        pt: 'Eu tenho um {w}',    de: 'Ich habe einen {w}',  tr: w => `Bende bir ${w} var` },
    { fn: 'konum',     en: 'Where is the {w}?',    es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?',   de: 'Wo ist der {w}?',     tr: w => `${w} nerede?` },
  ],

  clothing: [
    { fn: 'giyme',     en: 'I am wearing a {w}',    es: 'Llevo un {w}',          pt: 'Estou usando um {w}',  de: 'Ich trage einen {w}',  tr: w => `Bir ${w} giyiyorum` },
    { fn: 'fiyat',     en: 'How much is this {w}?', es: '¿Cuánto cuesta este {w}?', pt: 'Quanto custa este {w}?', de: 'Wie viel kostet dieser {w}?', tr: w => `Bu ${w} ne kadar?` },
    { fn: 'tanımlama', en: 'This {w} is nice',      es: 'Este {w} es bonito',    pt: 'Este {w} é bonito',    de: 'Dieser {w} ist schön', tr: w => `Bu ${w} güzel` },
  ],

  colors: [
    { fn: 'tanımlama', en: 'It is {w}',                es: 'Es {w}',                 pt: 'É {w}',                 de: 'Es ist {w}',              tr: w => `Bu ${w}` },
    { fn: 'renk',      en: 'The ball is {w}',          es: 'La pelota es {w}',       pt: 'A bola é {w}',          de: 'Der Ball ist {w}',        tr: w => `Top ${w}` },
    { fn: 'sevme',     en: 'I like the color {w}',     es: 'Me gusta el color {w}',  pt: 'Eu gosto da cor {w}',   de: 'Ich mag die Farbe {w}',   tr: w => `${w} rengini severim` },
    { fn: 'soru',      en: 'Is it {w}?',               es: '¿Es {w}?',               pt: 'É {w}?',                de: 'Ist es {w}?',             tr: w => `${w} mı?` },
  ],

  // Tek kelimelik duygu sıfatları (mutlu, üzgün...). Cümle formundakiler (A2
  // "Ben üzgünüm.") isReadySentence ile yakalanır.
  feelings: [
    { fn: 'duygu', en: 'I feel {w}',        es: 'Me siento {w}',   pt: 'Eu me sinto {w}',  de: 'Ich fühle mich {w}', tr: w => `${w} hissediyorum` },
    { fn: 'duygu', en: 'Today I feel {w}',  es: 'Hoy me siento {w}', pt: 'Hoje me sinto {w}', de: 'Heute fühle ich mich {w}', tr: w => `Bugün ${w} hissediyorum` },
    { fn: 'soru',  en: 'Are you {w}?',      es: '¿Estás {w}?',     pt: 'Você está {w}?',   de: 'Bist du {w}?',       tr: w => `${w} misin?` },
  ],

  // Selamlar / işlev kelimeleri (merhaba, lütfen, evet...) — kısa ifade.
  greetings: [
    { fn: 'ifade', en: '{w}!',            es: '¡{w}!',          pt: '{w}!',            de: '{w}!',            tr: w => `${w}!` },
    { fn: 'ifade', en: '{w}, my friend!', es: '¡{w}, amigo!',   pt: '{w}, meu amigo!', de: '{w}, mein Freund!', tr: w => `${w}, dostum!` },
  ],

  // Soru kelimeleri (ne, nerede, kim...) — kısa soru.
  questions: [
    { fn: 'soru', en: '{w}?',      es: '¿{w}?',    pt: '{w}?',     de: '{w}?',       tr: w => `${w}?` },
    { fn: 'soru', en: 'And {w}?',  es: '¿Y {w}?',  pt: 'E {w}?',   de: 'Und {w}?',   tr: w => `Peki ${w}?` },
  ],

  transport: [
    { fn: 'yönelme', en: 'I go by {w}',        es: 'Voy en {w}',          pt: 'Eu vou de {w}',      de: 'Ich fahre mit dem {w}', tr: w => `${w} ile giderim` },
    { fn: 'konum',   en: 'Where is the {w}?',  es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?',   de: 'Wo ist der {w}?',       tr: w => `${w} nerede?` },
    { fn: 'zaman',   en: 'The {w} is coming',  es: 'El {w} está llegando', pt: 'O {w} está chegando', de: 'Der {w} kommt',        tr: w => `${w} geliyor` },
  ],

  places: [
    { fn: 'konum',     en: 'Where is the {w}?',   es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?', de: 'Wo ist der {w}?',   tr: w => `${w} nerede?` },
    { fn: 'soru',      en: 'Is the {w} far?',     es: '¿Está lejos el {w}?', pt: 'O {w} é longe?',   de: 'Ist der {w} weit?', tr: w => `${w} uzak mı?` },
    { fn: 'tanımlama', en: 'This {w} is beautiful', es: 'Este {w} es hermoso', pt: 'Este {w} é lindo', de: 'Dieser {w} ist schön', tr: w => `Bu ${w} çok güzel` },
  ],

  travel: [
    { fn: 'ihtiyaç', en: 'I need a {w}',            es: 'Necesito un {w}',     pt: 'Eu preciso de um {w}', de: 'Ich brauche einen {w}',  tr: w => `Bana bir ${w} lazım` },
    { fn: 'arama',   en: 'Where can I find a {w}?', es: '¿Dónde encuentro un {w}?', pt: 'Onde encontro um {w}?', de: 'Wo finde ich einen {w}?', tr: w => `Nerede ${w} bulabilirim?` },
    { fn: 'fiyat',   en: 'How much is the {w}?',    es: '¿Cuánto cuesta el {w}?', pt: 'Quanto custa o {w}?', de: 'Wie viel kostet der {w}?', tr: w => `${w} ne kadar?` },
  ],

  family: [
    { fn: 'sevme', en: '{w}, I love you!', es: '¡{w}, te quiero!', pt: '{w}, eu te amo!',  de: '{w}, ich liebe dich!', tr: w => `${w}, seni seviyorum!` },
    { fn: 'konum', en: 'Where is {w}?',    es: '¿Dónde está {w}?', pt: 'Onde está {w}?',   de: 'Wo ist {w}?',          tr: w => `${w} nerede?` },
    { fn: 'aile',  en: '{w} is here',      es: '{w} está aquí',    pt: '{w} está aqui',    de: '{w} ist hier',         tr: w => `${w} burada` },
  ],

  body: [
    { fn: 'ağrı',      en: 'My {w} hurts',   es: 'Me duele el {w}', pt: 'Meu {w} dói',    de: 'Mein {w} tut weh', tr: w => `${w} ağrıyor` },
    { fn: 'tanımlama', en: 'This is the {w}', es: 'Este es el {w}',  pt: 'Este é o {w}',   de: 'Das ist der {w}',  tr: w => `Bu ${w}` },
  ],

  health: [
    { fn: 'ağrı',    en: 'I have a {w}',      es: 'Tengo {w}',           pt: 'Eu tenho {w}',        de: 'Ich habe {w}',         tr: w => `Bende ${w} var` },
    { fn: 'ihtiyaç', en: 'I need a {w}',      es: 'Necesito un {w}',     pt: 'Eu preciso de um {w}', de: 'Ich brauche einen {w}', tr: w => `Bana bir ${w} lazım` },
    { fn: 'konum',   en: 'Where is the {w}?', es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?',    de: 'Wo ist der {w}?',       tr: w => `${w} nerede?` },
  ],

  jobs: [
    { fn: 'meslek', en: 'I want to be a {w}', es: 'Quiero ser {w}', pt: 'Eu quero ser {w}', de: 'Ich möchte {w} werden', tr: w => `${w} olmak istiyorum` },
    { fn: 'meslek', en: 'She is a {w}',       es: 'Ella es {w}',    pt: 'Ela é {w}',        de: 'Sie ist {w}',           tr: w => `O bir ${w}` },
    { fn: 'soru',   en: 'Are you a {w}?',     es: '¿Eres {w}?',     pt: 'Você é {w}?',      de: 'Bist du {w}?',          tr: w => `Sen ${w} misin?` },
  ],

  school: [
    { fn: 'ihtiyaç', en: 'I need a {w}',     es: 'Necesito un {w}',    pt: 'Eu preciso de um {w}', de: 'Ich brauche einen {w}', tr: w => `Bana bir ${w} lazım` },
    { fn: 'konum',   en: 'Where is my {w}?', es: '¿Dónde está mi {w}?', pt: 'Onde está meu {w}?',  de: 'Wo ist mein {w}?',      tr: w => `${w} nerede?` },
    { fn: 'sahiplik', en: 'I have a {w}',    es: 'Tengo un {w}',       pt: 'Eu tenho um {w}',      de: 'Ich habe einen {w}',    tr: w => `Bende bir ${w} var` },
  ],

  home: [
    { fn: 'konum',     en: 'The {w} is in the room', es: 'El {w} está en la habitación', pt: 'O {w} está no quarto', de: 'Der {w} ist im Zimmer', tr: w => `${w} odada` },
    { fn: 'tanımlama', en: 'This is the {w}',        es: 'Este es el {w}',              pt: 'Este é o {w}',         de: 'Das ist der {w}',       tr: w => `Bu ${w}` },
    { fn: 'ihtiyaç',   en: 'We need a new {w}',      es: 'Necesitamos un {w} nuevo',    pt: 'Precisamos de um {w} novo', de: 'Wir brauchen einen neuen {w}', tr: w => `Yeni bir ${w} lazım` },
  ],

  sports: [
    { fn: 'oynama', en: 'I play {w}',  es: 'Juego {w}',     pt: 'Eu jogo {w}',    de: 'Ich spiele {w}', tr: w => `${w} oynarım` },
    { fn: 'sevme',  en: 'I like {w}',  es: 'Me gusta {w}',  pt: 'Eu gosto de {w}', de: 'Ich mag {w}',   tr: w => `${w} severim` },
  ],

  numbers: [
    { fn: 'sayma', en: 'I want {w} apples',  es: 'Quiero {w} manzanas', pt: 'Eu quero {w} maçãs', de: 'Ich möchte {w} Äpfel', tr: w => `${w} elma istiyorum` },
    { fn: 'yaş',   en: 'I am {w} years old', es: 'Tengo {w} años',      pt: 'Eu tenho {w} anos',  de: 'Ich bin {w} Jahre alt', tr: w => `${w} yaşındayım` },
  ],

  time: [
    { fn: 'zaman', en: 'See you {w}',    es: 'Nos vemos {w}', pt: 'Até {w}',     de: 'Bis {w}',     tr: w => `${w} görüşürüz` },
    { fn: 'zaman', en: 'I will come {w}', es: 'Vendré {w}',   pt: 'Eu venho {w}', de: 'Ich komme {w}', tr: w => `${w} geleceğim` },
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

  // 1) Zaten cümle/ifade ise → şablona sokma, olduğu gibi kullan
  if (isReadySentence(entry)) {
    return { tr: entry.tr || '', target: w, fn: 'ifade' }
  }

  // 2) Kategori şablonu varsa DAİMA onu kullan (anlam güvenliği); yoksa türe göre
  const catList = CATEGORY_TEMPLATES[entry.category]
  const list = (catList && catList.length) ? catList : TEMPLATES[typeOf(entry)]
  const t = list[Math.floor(Math.random() * list.length)]
  let target = (t[lang] || t.en).replace('{w}', w)
  if (lang === 'en') target = fixArticles(target)
  return { tr: t.tr(entry.tr || ''), target, fn: t.fn }
}

// İngilizce "a apple" → "an apple" (sesli harfle başlayan kelimeler)
function fixArticles(s) {
  return s.replace(/\b([Aa]) ([aeiouAEIOU])/g, (_, art, v) =>
    (art === 'A' ? 'An' : 'an') + ' ' + v)
}
