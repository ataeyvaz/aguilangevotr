/**
 * sentenceBank.js — Diyalog + senaryo cümlelerini toplayan paylaşılan kaynak.
 * SentenceBuilder ve Shadowing (Söyle) modları bunu kullanır.
 */
const dialogueMods = import.meta.glob('./dialogues/*.json')
const scenarioMods = import.meta.glob('./scenarios/*.json')

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean)

/**
 * THEME_SENTENCES — günlük hayattan tema bazlı hazır cümleler.
 * Diyalog/senaryo havuzuna ek olarak SentenceBuilder ve FillBlank'i besler.
 * Her satır 5 dilde: { tr, en, es, pt, de }.
 */
const THEME_SENTENCES = [
  // ── Selamlaşma & tanışma ──
  { tr: 'Merhaba, nasılsın?',            en: 'Hello, how are you?',           es: 'Hola, ¿cómo estás?',            pt: 'Olá, como você está?',           de: 'Hallo, wie geht es dir?' },
  { tr: 'İyiyim, teşekkürler.',          en: 'I am fine, thank you.',          es: 'Estoy bien, gracias.',          pt: 'Estou bem, obrigado.',           de: 'Mir geht es gut, danke.' },
  { tr: 'Adın ne?',                      en: 'What is your name?',             es: '¿Cómo te llamas?',              pt: 'Qual é o seu nome?',             de: 'Wie heißt du?' },
  { tr: 'Tanıştığıma memnun oldum.',     en: 'Nice to meet you.',              es: 'Encantado de conocerte.',       pt: 'Prazer em conhecer você.',       de: 'Freut mich, dich kennenzulernen.' },
  { tr: 'Nerelisin?',                    en: 'Where are you from?',            es: '¿De dónde eres?',               pt: 'De onde você é?',                de: 'Woher kommst du?' },
  { tr: 'Görüşmek üzere.',               en: 'See you later.',                 es: 'Hasta luego.',                  pt: 'Até logo.',                      de: 'Bis später.' },

  // ── Alışveriş ──
  { tr: 'Bu ne kadar?',                  en: 'How much is this?',              es: '¿Cuánto cuesta esto?',          pt: 'Quanto custa isto?',             de: 'Wie viel kostet das?' },
  { tr: 'Çok pahalı.',                   en: 'It is too expensive.',           es: 'Es demasiado caro.',            pt: 'É muito caro.',                  de: 'Das ist zu teuer.' },
  { tr: 'Bunu almak istiyorum.',         en: 'I want to buy this.',            es: 'Quiero comprar esto.',          pt: 'Eu quero comprar isto.',         de: 'Ich möchte das kaufen.' },
  { tr: 'Kredi kartı kabul ediyor musunuz?', en: 'Do you accept credit cards?', es: '¿Aceptan tarjetas de crédito?', pt: 'Vocês aceitam cartão de crédito?', de: 'Akzeptieren Sie Kreditkarten?' },
  { tr: 'Başka bir renk var mı?',        en: 'Is there another color?',        es: '¿Hay otro color?',              pt: 'Tem outra cor?',                 de: 'Gibt es eine andere Farbe?' },

  // ── Restoran & yemek ──
  { tr: 'Menüyü alabilir miyim?',        en: 'Can I have the menu?',           es: '¿Me da el menú?',               pt: 'Posso ver o cardápio?',          de: 'Kann ich die Speisekarte haben?' },
  { tr: 'Bir kahve istiyorum.',          en: 'I would like a coffee.',         es: 'Quiero un café.',               pt: 'Eu quero um café.',              de: 'Ich möchte einen Kaffee.' },
  { tr: 'Hesabı alabilir miyim?',        en: 'Can I have the bill?',           es: '¿Me trae la cuenta?',           pt: 'Pode trazer a conta?',           de: 'Kann ich die Rechnung haben?' },
  { tr: 'Çok lezzetliydi.',              en: 'It was very delicious.',         es: 'Estaba muy delicioso.',         pt: 'Estava muito delicioso.',        de: 'Es war sehr lecker.' },
  { tr: 'Aç değilim.',                   en: 'I am not hungry.',               es: 'No tengo hambre.',              pt: 'Não estou com fome.',            de: 'Ich habe keinen Hunger.' },

  // ── Yol tarifi & ulaşım ──
  { tr: 'İstasyon nerede?',              en: 'Where is the station?',          es: '¿Dónde está la estación?',      pt: 'Onde fica a estação?',           de: 'Wo ist der Bahnhof?' },
  { tr: 'Sola dön.',                     en: 'Turn left.',                     es: 'Gira a la izquierda.',          pt: 'Vire à esquerda.',               de: 'Biege links ab.' },
  { tr: 'Düz git.',                      en: 'Go straight ahead.',             es: 'Sigue recto.',                  pt: 'Siga em frente.',                de: 'Geh geradeaus.' },
  { tr: 'Kayboldum.',                    en: 'I am lost.',                     es: 'Estoy perdido.',                pt: 'Estou perdido.',                 de: 'Ich habe mich verlaufen.' },
  { tr: 'Bilet ne kadar?',               en: 'How much is the ticket?',        es: '¿Cuánto cuesta el billete?',    pt: 'Quanto custa a passagem?',       de: 'Wie viel kostet die Fahrkarte?' },

  // ── Zaman & günlük ──
  { tr: 'Saat kaç?',                     en: 'What time is it?',               es: '¿Qué hora es?',                 pt: 'Que horas são?',                 de: 'Wie spät ist es?' },
  { tr: 'Bugün çok meşgulüm.',           en: 'I am very busy today.',          es: 'Hoy estoy muy ocupado.',        pt: 'Hoje estou muito ocupado.',      de: 'Heute bin ich sehr beschäftigt.' },
  { tr: 'Yarın görüşürüz.',              en: 'See you tomorrow.',              es: 'Nos vemos mañana.',             pt: 'A gente se vê amanhã.',          de: 'Wir sehen uns morgen.' },
  { tr: 'Geç kaldım.',                   en: 'I am late.',                     es: 'Llego tarde.',                  pt: 'Estou atrasado.',                de: 'Ich bin spät dran.' },

  // ── Duygular & küçük sohbet ──
  { tr: 'Çok mutluyum.',                 en: 'I am very happy.',               es: 'Estoy muy feliz.',              pt: 'Estou muito feliz.',             de: 'Ich bin sehr glücklich.' },
  { tr: 'Yorgun hissediyorum.',          en: 'I feel tired.',                  es: 'Me siento cansado.',            pt: 'Eu me sinto cansado.',           de: 'Ich fühle mich müde.' },
  { tr: 'Bunu çok sevdim.',              en: 'I really liked this.',           es: 'Me gustó mucho esto.',          pt: 'Eu gostei muito disto.',         de: 'Das hat mir sehr gefallen.' },
  { tr: 'Anlamıyorum.',                  en: 'I do not understand.',           es: 'No entiendo.',                  pt: 'Eu não entendo.',                de: 'Ich verstehe nicht.' },
  { tr: 'Tekrar eder misin?',            en: 'Can you repeat that?',           es: '¿Puedes repetir?',              pt: 'Você pode repetir?',             de: 'Kannst du das wiederholen?' },
  { tr: 'Yavaş konuşabilir misin?',      en: 'Can you speak slowly?',          es: '¿Puedes hablar despacio?',      pt: 'Você pode falar devagar?',       de: 'Kannst du langsam sprechen?' },

  // ── Yardım & acil ──
  { tr: 'Bana yardım eder misin?',       en: 'Can you help me?',               es: '¿Me puedes ayudar?',            pt: 'Você pode me ajudar?',           de: 'Kannst du mir helfen?' },
  { tr: 'Bir doktora ihtiyacım var.',    en: 'I need a doctor.',               es: 'Necesito un médico.',           pt: 'Eu preciso de um médico.',       de: 'Ich brauche einen Arzt.' },
  { tr: 'Telefonumu kaybettim.',         en: 'I lost my phone.',               es: 'Perdí mi teléfono.',            pt: 'Eu perdi meu telefone.',         de: 'Ich habe mein Handy verloren.' },
]

/**
 * @param {string} lang  hedef dil ('en'|'es'|'pt'|'de')
 * @param {{minW?:number,maxW?:number}} opts  kelime sayısı sınırı
 * @returns {Promise<{tr,target}[]>}
 */
export async function collectSentences(lang, { minW = 2, maxW = 10 } = {}) {
  const out = []
  const push = (tr, target) => {
    if (!tr || !target) return
    const n = words(target).length
    if (n < minW || n > maxW) return
    out.push({ tr, target })
  }

  // Tema bazlı hazır cümleler (statik havuz)
  for (const s of THEME_SENTENCES) push(s.tr, s[lang])

  const dlgs = await Promise.all(Object.values(dialogueMods).map(fn => fn()))
  for (const m of dlgs) {
    for (const line of (m.default?.lines || [])) push(line.tr, line[lang])
  }
  const scns = await Promise.all(Object.values(scenarioMods).map(fn => fn()))
  for (const m of scns) {
    const s = m.default
    for (const ex of (s?.teach || [])) push(ex.tr, ex[lang])
    for (const qa of (s?.qa || [])) {
      push(qa.prompt?.tr, qa.prompt?.[lang])
      push(qa.answer?.tr, qa.answer?.[lang])
    }
  }

  const seen = new Set()
  return out.filter(s => {
    const k = s.target.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}
