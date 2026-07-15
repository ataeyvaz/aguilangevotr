/**
 * patterns.js — Cümle YAPILARINI açıkça öğreten kalıplar ve zincirler.
 *
 * PATTERNS: bir iskelet (skeleton) + değiştirilebilir yuva (slot) seçenekleri.
 *   Çocuk yuvayı değiştirerek aynı yapıyla farklı cümleler üretir
 *   → cümle yapısını içselleştirir (substitution drill).
 *
 * CHAINS: bir cümlenin kademeli büyümesi (çekirdek → genişletilmiş)
 *   → cümlelerin nasıl uzadığını gösterir.
 */

export const PATTERNS = [
  {
    id: 'want',
    note: 'İstek: özne + istemek + nesne',
    tr: 'Ben ___ istiyorum',
    skeleton: { en: 'I want ___', es: 'Quiero ___', pt: 'Eu quero ___', de: 'Ich möchte ___' },
    slots: [
      { tr: 'elma',  en: 'an apple', es: 'una manzana', pt: 'uma maçã',   de: 'einen Apfel' },
      { tr: 'su',    en: 'water',    es: 'agua',        pt: 'água',       de: 'Wasser' },
      { tr: 'kitap', en: 'a book',   es: 'un libro',    pt: 'um livro',   de: 'ein Buch' },
      { tr: 'süt',   en: 'milk',     es: 'leche',       pt: 'leite',      de: 'Milch' },
    ],
  },
  {
    id: 'have',
    note: 'Sahiplik: özne + sahip olmak + nesne',
    tr: 'Benim bir ___ var',
    skeleton: { en: 'I have a ___', es: 'Tengo un ___', pt: 'Eu tenho um ___', de: 'Ich habe einen ___' },
    slots: [
      { tr: 'köpek',    en: 'dog',     es: 'perro',    pt: 'cão',      de: 'Hund' },
      { tr: 'kardeş',   en: 'brother', es: 'hermano',  pt: 'irmão',    de: 'Bruder' },
      { tr: 'kalem',    en: 'pencil',  es: 'lápiz',    pt: 'lápis',    de: 'Bleistift' },
      { tr: 'top',      en: 'ball',    es: 'balón',    pt: 'bola',     de: 'Ball' },
    ],
  },
  {
    id: 'where',
    note: 'Yer sorma: soru kelimesi + nesne',
    tr: '___ nerede?',
    skeleton: { en: 'Where is the ___?', es: '¿Dónde está el ___?', pt: 'Onde fica o ___?', de: 'Wo ist der ___?' },
    slots: [
      { tr: 'okul',     en: 'school',   es: 'colegio',  pt: 'escola',    de: 'Schule' },
      { tr: 'park',     en: 'park',     es: 'parque',   pt: 'parque',    de: 'Park' },
      { tr: 'tuvalet',  en: 'toilet',   es: 'baño',     pt: 'banheiro',  de: 'Toilette' },
      { tr: 'çıkış',    en: 'exit',     es: 'salida',   pt: 'saída',     de: 'Ausgang' },
    ],
  },
  {
    id: 'can',
    note: 'Yetenek: özne + -ebilmek + fiil',
    tr: '___ yapabilirim',
    skeleton: { en: 'I can ___', es: 'Puedo ___', pt: 'Eu posso ___', de: 'Ich kann ___' },
    slots: [
      { tr: 'yüzmek',    en: 'swim',    es: 'nadar',    pt: 'nadar',    de: 'schwimmen' },
      { tr: 'koşmak',    en: 'run',     es: 'correr',   pt: 'correr',   de: 'rennen' },
      { tr: 'okumak',    en: 'read',    es: 'leer',     pt: 'ler',      de: 'lesen' },
      { tr: 'şarkı söylemek', en: 'sing', es: 'cantar', pt: 'cantar',  de: 'singen' },
    ],
  },
  {
    id: 'like',
    note: 'Tercih: özne + sevmek + nesne',
    tr: '___ severim',
    skeleton: { en: 'I like ___', es: 'Me gusta ___', pt: 'Eu gosto de ___', de: 'Ich mag ___' },
    slots: [
      { tr: 'müzik',    en: 'music',    es: 'la música',   pt: 'música',    de: 'Musik' },
      { tr: 'futbol',   en: 'football', es: 'el fútbol',   pt: 'futebol',   de: 'Fußball' },
      { tr: 'dondurma', en: 'ice cream', es: 'el helado',  pt: 'sorvete',   de: 'Eis' },
      { tr: 'kediler',  en: 'cats',     es: 'los gatos',   pt: 'gatos',     de: 'Katzen' },
    ],
  },
  {
    id: 'this_is',
    note: 'Tanımlama: bu + olmak + nesne',
    tr: 'Bu bir ___',
    skeleton: { en: 'This is a ___', es: 'Esto es un ___', pt: 'Isto é um ___', de: 'Das ist ein ___' },
    slots: [
      { tr: 'masa',     en: 'table',   es: 'mesa',     pt: 'mesa',     de: 'Tisch' },
      { tr: 'araba',    en: 'car',     es: 'coche',    pt: 'carro',    de: 'Auto' },
      { tr: 'ev',       en: 'house',   es: 'casa',     pt: 'casa',     de: 'Haus' },
      { tr: 'çiçek',    en: 'flower',  es: 'flor',     pt: 'flor',     de: 'Blume' },
    ],
  },
]

export const CHAINS = [
  {
    note: 'Fiil → zarf → zaman: cümle nasıl uzar',
    tr: ['Koşuyorum', 'Hızlı koşuyorum', 'Her gün hızlı koşuyorum'],
    en: ['I run', 'I run fast', 'I run fast every day'],
    es: ['Corro', 'Corro rápido', 'Corro rápido todos los días'],
    pt: ['Eu corro', 'Eu corro rápido', 'Eu corro rápido todos os dias'],
    de: ['Ich renne', 'Ich renne schnell', 'Ich renne jeden Tag schnell'],
  },
  {
    note: 'Nesne → sayı → yer ekleme',
    tr: ['Elma istiyorum', 'Beş elma istiyorum', 'Markette beş elma istiyorum'],
    en: ['I want apples', 'I want five apples', 'I want five apples at the market'],
    es: ['Quiero manzanas', 'Quiero cinco manzanas', 'Quiero cinco manzanas en el mercado'],
    pt: ['Eu quero maçãs', 'Eu quero cinco maçãs', 'Eu quero cinco maçãs no mercado'],
    de: ['Ich möchte Äpfel', 'Ich möchte fünf Äpfel', 'Ich möchte fünf Äpfel auf dem Markt'],
  },
  {
    note: 'Özne → fiil → nesne → zaman',
    tr: ['O okur', 'O kitap okur', 'O her akşam kitap okur'],
    en: ['She reads', 'She reads a book', 'She reads a book every evening'],
    es: ['Ella lee', 'Ella lee un libro', 'Ella lee un libro cada noche'],
    pt: ['Ela lê', 'Ela lê um livro', 'Ela lê um livro toda noite'],
    de: ['Sie liest', 'Sie liest ein Buch', 'Sie liest jeden Abend ein Buch'],
  },
  {
    note: 'Sahiplik → sıfat → renk',
    tr: ['Bir kedim var', 'Küçük bir kedim var', 'Küçük beyaz bir kedim var'],
    en: ['I have a cat', 'I have a small cat', 'I have a small white cat'],
    es: ['Tengo un gato', 'Tengo un gato pequeño', 'Tengo un gato pequeño y blanco'],
    pt: ['Eu tenho um gato', 'Eu tenho um gato pequeno', 'Eu tenho um gato pequeno e branco'],
    de: ['Ich habe eine Katze', 'Ich habe eine kleine Katze', 'Ich habe eine kleine weiße Katze'],
  },
  {
    note: 'Fiil → yer → araç',
    tr: ['Gidiyorum', 'Okula gidiyorum', 'Otobüsle okula gidiyorum'],
    en: ['I go', 'I go to school', 'I go to school by bus'],
    es: ['Voy', 'Voy a la escuela', 'Voy a la escuela en autobús'],
    pt: ['Eu vou', 'Eu vou para a escola', 'Eu vou para a escola de ônibus'],
    de: ['Ich gehe', 'Ich gehe zur Schule', 'Ich gehe mit dem Bus zur Schule'],
  },
  {
    note: 'Yemek → miktar → zaman',
    tr: ['Ekmek yerim', 'Biraz ekmek yerim', 'Sabahları biraz ekmek yerim'],
    en: ['I eat bread', 'I eat some bread', 'I eat some bread in the mornings'],
    es: ['Como pan', 'Como un poco de pan', 'Como un poco de pan por las mañanas'],
    pt: ['Eu como pão', 'Eu como um pouco de pão', 'Eu como um pouco de pão de manhã'],
    de: ['Ich esse Brot', 'Ich esse etwas Brot', 'Ich esse morgens etwas Brot'],
  },
]
