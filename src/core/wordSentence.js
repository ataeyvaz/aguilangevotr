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
    { fn: 'olumsuz',   en: 'This is not {w}',    es: 'Esto no es {w}',     pt: 'Isto não é {w}',      de: 'Das ist nicht {w}',      tr: w => `Bu ${w} değil` },
    { fn: 'ihtiyaç',   en: 'I need {w}',         es: 'Necesito {w}',       pt: 'Eu preciso de {w}',   de: 'Ich brauche {w}',        tr: w => `Bana ${w} lazım` },
    { fn: 'görme',     en: 'I see {w}',          es: 'Veo {w}',            pt: 'Eu vejo {w}',         de: 'Ich sehe {w}',           tr: w => `${w} görüyorum` },
    { fn: 'arama',     en: 'I am looking for {w}', es: 'Busco {w}',        pt: 'Estou procurando {w}', de: 'Ich suche {w}',         tr: w => `${w} arıyorum` },
    { fn: 'soru',      en: 'Do you like {w}?',   es: '¿Te gusta {w}?',     pt: 'Você gosta de {w}?',  de: 'Magst du {w}?',          tr: w => `${w} sever misin?` },
    { fn: 'sevme',     en: 'I love {w}',         es: 'Me encanta {w}',     pt: 'Eu adoro {w}',        de: 'Ich liebe {w}',          tr: w => `${w} çok severim` },
  ],

  // ── FİİLLER (koşmak, yemek, okumak...) ── (TR mastarla çalışan kalıplar)
  verb: [
    { fn: 'isteme',    en: 'I want to {w}',       es: 'Quiero {w}',        pt: 'Eu quero {w}',        de: 'Ich möchte {w}',        tr: w => `${w} istiyorum` },
    { fn: 'soru',      en: 'Do you want to {w}?', es: '¿Quieres {w}?',     pt: 'Você quer {w}?',      de: 'Möchtest du {w}?',       tr: w => `${w} ister misin?` },
    { fn: 'sevme',     en: 'I like to {w}',       es: 'Me gusta {w}',      pt: 'Eu gosto de {w}',     de: 'Ich mag {w}',            tr: w => `${w} severim` },
    { fn: 'zaman',     en: 'I want to {w} now',   es: 'Quiero {w} ahora',  pt: 'Eu quero {w} agora',  de: 'Ich möchte jetzt {w}',   tr: w => `Şimdi ${w} istiyorum` },
    { fn: 'olumsuz',   en: "I don't want to {w}", es: 'No quiero {w}',     pt: 'Eu não quero {w}',    de: 'Ich möchte nicht {w}',   tr: w => `${w} istemiyorum` },
    { fn: 'zorunluluk', en: 'I have to {w}',      es: 'Tengo que {w}',     pt: 'Eu tenho que {w}',    de: 'Ich muss {w}',           tr: w => `${w} zorundayım` },
    { fn: 'ihtiyaç',   en: 'I need to {w}',       es: 'Necesito {w}',      pt: 'Eu preciso {w}',      de: 'Ich muss {w}',           tr: w => `${w} lazım` },
    { fn: 'öğrenme',   en: 'I am learning to {w}', es: 'Estoy aprendiendo a {w}', pt: 'Estou aprendendo a {w}', de: 'Ich lerne zu {w}', tr: w => `${w} öğreniyorum` },
    { fn: 'planlama',  en: 'I plan to {w}',       es: 'Planeo {w}',        pt: 'Eu planejo {w}',      de: 'Ich plane zu {w}',       tr: w => `${w} planlıyorum` },
    { fn: 'deneme',    en: 'I try to {w}',        es: 'Intento {w}',       pt: 'Eu tento {w}',        de: 'Ich versuche zu {w}',    tr: w => `${w} deniyorum` },
  ],

  // ── SIFATLAR / RENKLER (büyük, kırmızı...) ──
  adj: [
    { fn: 'tanımlama', en: 'It is {w}',           es: 'Es {w}',            pt: 'É {w}',               de: 'Es ist {w}',            tr: w => `Bu ${w}` },
    { fn: 'derece',    en: 'It is very {w}',      es: 'Es muy {w}',        pt: 'É muito {w}',         de: 'Es ist sehr {w}',        tr: w => `Çok ${w}` },
    { fn: 'soru',      en: 'Is it {w}?',          es: '¿Es {w}?',          pt: 'É {w}?',              de: 'Ist es {w}?',            tr: w => `${w} mı?` },
    { fn: 'sıfat+isim', en: 'The dog is {w}',     es: 'El perro es {w}',   pt: 'O cachorro é {w}',    de: 'Der Hund ist {w}',       tr: w => `Köpek ${w}` },
    { fn: 'sıfat+isim', en: 'My house is {w}',    es: 'Mi casa es {w}',    pt: 'Minha casa é {w}',    de: 'Mein Haus ist {w}',      tr: w => `Evim ${w}` },
    { fn: 'olumsuz',   en: 'It is not {w}',       es: 'No es {w}',         pt: 'Não é {w}',           de: 'Es ist nicht {w}',       tr: w => `${w} değil` },
    { fn: 'duygu',     en: 'I am {w}',            es: 'Estoy {w}',         pt: 'Estou {w}',           de: 'Ich bin {w}',            tr: w => `Ben ${w}` },
    { fn: 'ünlem',     en: 'How {w} it is!',      es: '¡Qué {w}!',         pt: 'Que {w}!',            de: 'Wie {w}!',               tr: w => `Ne kadar ${w}!` },
    { fn: 'karşılaştırma', en: 'It is more {w}',  es: 'Es más {w}',        pt: 'É mais {w}',          de: 'Es ist {w}er',           tr: w => `Daha ${w}` },
    { fn: 'zaman',     en: 'Today it is {w}',     es: 'Hoy está {w}',      pt: 'Hoje está {w}',       de: 'Heute ist es {w}',       tr: w => `Bugün ${w}` },
  ],
}

// ══════════════════════════════════════════════════════════
// KATEGORİYE ÖZEL BAĞLAMSAL KALIPLAR
// Kelimeyi izole değil, GERÇEK KONUŞMA bağlamında öğretir.
// (manavda fiyat sorma, ulaşımda gitme, sağlıkta ağrı...)
// Aynı {w} yer tutucu + tr(x) gloss deseni.
// ══════════════════════════════════════════════════════════
const MARKET = [
  { fn: 'stok',   en: 'Do you have {w}?',       es: '¿Tienes {w}?',            pt: 'Você tem {w}?',            de: 'Hast du {w}?',            tr: w => `${w} var mı?` },
  { fn: 'fiyat',  en: 'How much is {w}?',        es: '¿Cuánto cuesta {w}?',     pt: 'Quanto custa {w}?',        de: 'Wie viel kostet {w}?',    tr: w => `${w} ne kadar?` },
  { fn: 'isteme', en: 'I would like some {w}',   es: 'Quiero un poco de {w}',   pt: 'Eu quero um pouco de {w}', de: 'Ich möchte etwas {w}',    tr: w => `Biraz ${w} istiyorum` },
  { fn: 'lezzet', en: '{w} is delicious',        es: '{w} está delicioso',      pt: '{w} está delicioso',       de: '{w} ist lecker',          tr: w => `${w} çok lezzetli` },
  { fn: 'soru',   en: 'Is the {w} fresh?',       es: '¿Está fresco {w}?',       pt: '{w} está fresco?',         de: 'Ist {w} frisch?',         tr: w => `${w} taze mi?` },
]

const CATEGORY_TEMPLATES = {
  food: MARKET, fruits: MARKET, vegetables: MARKET,

  animals: [
    { fn: 'tanımlama', en: 'Look at the {w}!',     es: '¡Mira el {w}!',       pt: 'Olha o {w}!',        de: 'Schau, der {w}!',     tr: w => `Şu ${w}'a bak!` },
    { fn: 'derece',    en: 'The {w} is very big',  es: 'El {w} es muy grande', pt: 'O {w} é muito grande', de: 'Der {w} ist sehr groß', tr: w => `${w} çok büyük` },
    { fn: 'sahiplik',  en: 'I have a {w}',         es: 'Tengo un {w}',        pt: 'Eu tenho um {w}',    de: 'Ich habe einen {w}',  tr: w => `Bir ${w}'im var` },
    { fn: 'konum',     en: 'Where is the {w}?',    es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?',   de: 'Wo ist der {w}?',     tr: w => `${w} nerede?` },
  ],

  clothing: [
    { fn: 'giyme',     en: 'I am wearing a {w}',    es: 'Llevo un {w}',          pt: 'Estou usando um {w}',  de: 'Ich trage einen {w}',  tr: w => `Bir ${w} giyiyorum` },
    { fn: 'fiyat',     en: 'How much is this {w}?', es: '¿Cuánto cuesta este {w}?', pt: 'Quanto custa este {w}?', de: 'Wie viel kostet dieser {w}?', tr: w => `Bu ${w} ne kadar?` },
    { fn: 'tanımlama', en: 'This {w} is nice',      es: 'Este {w} es bonito',    pt: 'Este {w} é bonito',    de: 'Dieser {w} ist schön', tr: w => `Bu ${w} güzel` },
  ],

  transport: [
    { fn: 'yönelme', en: 'I go by {w}',        es: 'Voy en {w}',          pt: 'Eu vou de {w}',      de: 'Ich fahre mit dem {w}', tr: w => `${w} ile giderim` },
    { fn: 'konum',   en: 'Where is the {w}?',  es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?',   de: 'Wo ist der {w}?',       tr: w => `${w} nerede?` },
    { fn: 'zaman',   en: 'The {w} is coming',  es: 'El {w} está llegando', pt: 'O {w} está chegando', de: 'Der {w} kommt',        tr: w => `${w} geliyor` },
  ],

  places: [
    { fn: 'yönelme', en: 'I want to go to the {w}', es: 'Quiero ir al {w}',    pt: 'Eu quero ir ao {w}', de: 'Ich möchte zum {w} gehen', tr: w => `${w}'a gitmek istiyorum` },
    { fn: 'konum',   en: 'Where is the {w}?',       es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?',   de: 'Wo ist der {w}?',          tr: w => `${w} nerede?` },
    { fn: 'soru',    en: 'Is the {w} far?',         es: '¿Está lejos el {w}?', pt: 'O {w} é longe?',     de: 'Ist der {w} weit?',        tr: w => `${w} uzak mı?` },
  ],

  travel: [
    { fn: 'yönelme', en: 'I want to go to the {w}', es: 'Quiero ir al {w}',    pt: 'Eu quero ir ao {w}', de: 'Ich möchte zum {w} gehen', tr: w => `${w}'a gitmek istiyorum` },
    { fn: 'ihtiyaç', en: 'I need a {w}',            es: 'Necesito un {w}',     pt: 'Eu preciso de um {w}', de: 'Ich brauche einen {w}',  tr: w => `Bana bir ${w} lazım` },
    { fn: 'soru',    en: 'Where can I find a {w}?', es: '¿Dónde encuentro un {w}?', pt: 'Onde encontro um {w}?', de: 'Wo finde ich einen {w}?', tr: w => `Nerede ${w} bulabilirim?` },
  ],

  family: [
    { fn: 'aile',  en: 'This is my {w}', es: 'Este es mi {w}', pt: 'Este é meu {w}', de: 'Das ist mein {w}',    tr: w => `Bu benim ${w}` },
    { fn: 'sevme', en: 'I love my {w}',  es: 'Amo a mi {w}',   pt: 'Eu amo meu {w}', de: 'Ich liebe meinen {w}', tr: w => `${w} çok seviyorum` },
    { fn: 'konum', en: 'My {w} is here', es: 'Mi {w} está aquí', pt: 'Meu {w} está aqui', de: 'Mein {w} ist hier', tr: w => `${w} burada` },
  ],

  body: [
    { fn: 'ağrı',      en: 'My {w} hurts',   es: 'Me duele {w}',    pt: 'Meu {w} dói',    de: 'Mein {w} tut weh', tr: w => `${w} ağrıyor` },
    { fn: 'tanımlama', en: 'This is my {w}',  es: 'Este es mi {w}',  pt: 'Este é meu {w}', de: 'Das ist mein {w}', tr: w => `Bu benim ${w}` },
    { fn: 'sahiplik',  en: 'I have two {w}',  es: 'Tengo dos {w}',   pt: 'Eu tenho dois {w}', de: 'Ich habe zwei {w}', tr: w => `İki ${w}'im var` },
  ],

  health: [
    { fn: 'ağrı',    en: 'I have a {w}',   es: 'Tengo {w}',       pt: 'Eu tenho {w}',        de: 'Ich habe {w}',         tr: w => `Bende ${w} var` },
    { fn: 'ihtiyaç', en: 'I need a {w}',   es: 'Necesito un {w}', pt: 'Eu preciso de um {w}', de: 'Ich brauche einen {w}', tr: w => `Bana bir ${w} lazım` },
    { fn: 'konum',   en: 'Where is the {w}?', es: '¿Dónde está el {w}?', pt: 'Onde está o {w}?', de: 'Wo ist der {w}?',  tr: w => `${w} nerede?` },
  ],

  jobs: [
    { fn: 'meslek', en: 'I want to be a {w}', es: 'Quiero ser {w}', pt: 'Eu quero ser {w}', de: 'Ich möchte {w} werden', tr: w => `${w} olmak istiyorum` },
    { fn: 'meslek', en: 'She is a {w}',       es: 'Ella es {w}',    pt: 'Ela é {w}',        de: 'Sie ist {w}',           tr: w => `O bir ${w}` },
    { fn: 'soru',   en: 'Are you a {w}?',     es: '¿Eres {w}?',     pt: 'Você é {w}?',      de: 'Bist du {w}?',          tr: w => `Sen ${w} misin?` },
  ],

  school: [
    { fn: 'ihtiyaç', en: 'I need a {w}',     es: 'Necesito un {w}',    pt: 'Eu preciso de um {w}', de: 'Ich brauche einen {w}', tr: w => `Bana bir ${w} lazım` },
    { fn: 'konum',   en: 'Where is my {w}?', es: '¿Dónde está mi {w}?', pt: 'Onde está meu {w}?',  de: 'Wo ist mein {w}?',      tr: w => `${w} nerede?` },
    { fn: 'sahiplik', en: 'I have a {w}',    es: 'Tengo un {w}',       pt: 'Eu tenho um {w}',      de: 'Ich habe einen {w}',    tr: w => `Bir ${w}'im var` },
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
  const typeList = TEMPLATES[typeOf(entry)]
  const catList  = CATEGORY_TEMPLATES[entry.category]
  // Kategoriye özel bağlamsal kalıp varsa %55 ihtimalle onu kullan
  // (bağlam + çeşitlilik dengesi). Yoksa türe göre genel kalıp.
  const list = (catList && catList.length && Math.random() < 0.55) ? catList : typeList
  const t = list[Math.floor(Math.random() * list.length)]
  const target = (t[lang] || t.en).replace('{w}', w)
  return { tr: t.tr(entry.tr || ''), target, fn: t.fn }
}
