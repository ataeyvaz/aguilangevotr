/**
 * add-pt-dialogues.cjs — Diyalog dosyalarına Portekizce (pt) satır ekler.
 * en metnine göre eşleştirir; her satırı {speaker,en,tr,de,es,pt,hint} olarak yeniden yazar.
 */
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '..', 'src', 'data', 'dialogues')

const PT = {
  // home
  "Good morning, Kartal! Did you sleep well?": "Bom dia, Kartal! Você dormiu bem?",
  "Good morning! Yes, I slept very well. I am hungry now.": "Bom dia! Sim, dormi muito bem. Agora estou com fome.",
  "Me too! What do you want for breakfast?": "Eu também! O que você quer no café da manhã?",
  "I want bread, cheese and a glass of milk.": "Eu quero pão, queijo e um copo de leite.",
  "Good idea! I want eggs and orange juice.": "Boa ideia! Eu quero ovos e suco de laranja.",
  "After breakfast, shall we watch a film?": "Depois do café da manhã, vamos assistir a um filme?",
  "Yes! What film do you want to watch?": "Sim! Que filme você quer assistir?",
  "I want to watch a funny film. I like funny films.": "Eu quero assistir a um filme engraçado. Eu gosto de filmes engraçados.",
  "Great! And after the film, shall we play a game?": "Ótimo! E depois do filme, vamos jogar um jogo?",
  "Sure! Today is a great day. I am very happy!": "Claro! Hoje é um dia ótimo. Estou muito feliz!",
  // park
  "Emir, do you want to play football?": "Emir, você quer jogar futebol?",
  "Yes! I love football! Let us play!": "Sim! Eu adoro futebol! Vamos jogar!",
  "The park is very big and beautiful today.": "O parque está muito grande e bonito hoje.",
  "Yes! And the weather is sunny and warm.": "Sim! E o tempo está ensolarado e quente.",
  "I am tired now. Can we stop and rest?": "Agora estou cansado. Podemos parar e descansar?",
  "Okay! Let us sit on the bench. I am thirsty.": "Está bem! Vamos sentar no banco. Estou com sede.",
  "I have water in my bag. Do you want some?": "Eu tenho água na minha mochila. Você quer um pouco?",
  "Yes, please! Thank you, you are very kind.": "Sim, por favor! Obrigado, você é muito gentil.",
  "Look! There is a dog over there. It is so cute!": "Olha! Tem um cachorro ali. Ele é tão fofo!",
  "Oh, how lovely! I want a dog too. Let us go home now.": "Oh, que lindo! Eu também quero um cachorro. Vamos para casa agora.",
  // market
  "Hello! Good morning!": "Olá! Bom dia!",
  "Good morning! How can I help you?": "Bom dia! Como posso ajudar você?",
  "I want to buy some apples, please.": "Eu quero comprar algumas maçãs, por favor.",
  "How many apples do you want?": "Quantas maçãs você quer?",
  "Five apples, please. And one banana.": "Cinco maçãs, por favor. E uma banana.",
  "Okay! Do you want anything else?": "Está bem! Você quer mais alguma coisa?",
  "Yes, I need some water too.": "Sim, eu também preciso de água.",
  "That is three euros fifty, please.": "São três euros e cinquenta, por favor.",
  "Here you are. Thank you very much!": "Aqui está. Muito obrigado!",
  "You are welcome! Have a nice day!": "De nada! Tenha um bom dia!",
  // restaurant
  "Hello! Welcome! Please sit down.": "Olá! Bem-vindo! Por favor, sente-se.",
  "Thank you! Can I see the menu, please?": "Obrigado! Posso ver o cardápio, por favor?",
  "Of course! Here is the menu. What would you like?": "Claro! Aqui está o cardápio. O que você gostaria?",
  "I would like a pizza and a salad, please.": "Eu gostaria de uma pizza e uma salada, por favor.",
  "Good choice! Would you like something to drink?": "Boa escolha! Você gostaria de algo para beber?",
  "Yes, please. I want orange juice. Is it cold?": "Sim, por favor. Eu quero suco de laranja. Está gelado?",
  "Yes, it is very cold and fresh! Perfect for a hot day.": "Sim, está muito gelado e fresco! Perfeito para um dia quente.",
  "The food is very good! I am not hungry now.": "A comida está muito boa! Agora não estou com fome.",
  "I am glad you liked it! Can I bring you anything else?": "Fico feliz que você gostou! Posso trazer mais alguma coisa?",
  "No, thank you. Can I have the bill, please?": "Não, obrigado. Pode me trazer a conta, por favor?",
  // school
  "Hi! My name is Kartal. What is your name?": "Oi! Meu nome é Kartal. Qual é o seu nome?",
  "Hi! My name is Emir. Nice to meet you!": "Oi! Meu nome é Emir. Prazer em conhecer você!",
  "How old are you, Emir?": "Quantos anos você tem, Emir?",
  "I am nine years old. And you?": "Eu tenho nove anos. E você?",
  "I am nine too! Which class are you in?": "Eu também tenho nove! Em que turma você está?",
  "I am in class three B. And you?": "Eu estou na turma três B. E você?",
  "I am in class three A. Do you like school?": "Eu estou na turma três A. Você gosta da escola?",
  "Yes, I like school! My favourite lesson is art.": "Sim, eu gosto da escola! Minha matéria favorita é arte.",
  "Cool! My favourite lesson is maths.": "Legal! Minha matéria favorita é matemática.",
  "Let us be friends! Shall we sit together?": "Vamos ser amigos! Vamos sentar juntos?",
  // travel
  "Excuse me! I am lost. Can you help me?": "Com licença! Estou perdido. Você pode me ajudar?",
  "Of course! Where do you want to go?": "Claro! Aonde você quer ir?",
  "I want to go to the train station. Is it far?": "Eu quero ir para a estação de trem. É longe?",
  "No, it is not far. It is about ten minutes on foot.": "Não, não é longe. São cerca de dez minutos a pé.",
  "Can you show me the way, please?": "Você pode me mostrar o caminho, por favor?",
  "Yes! Go straight. Then turn left at the big school.": "Sim! Vá em frente. Depois vire à esquerda na escola grande.",
  "Okay. Go straight and turn left at the school.": "Está bem. Ir em frente e virar à esquerda na escola.",
  "Yes, that is right! Then you will see a park. The station is next to the park.": "Sim, isso mesmo! Depois você verá um parque. A estação fica ao lado do parque.",
  "I understand! Thank you so much. You are very kind.": "Eu entendo! Muito obrigado. Você é muito gentil.",
  "You are welcome! Have a safe trip. Goodbye!": "De nada! Boa viagem. Tchau!",
}

let total = 0, added = 0, missing = []
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const p = path.join(dir, f)
  const d = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''))
  d.lines = (d.lines || []).map(l => {
    total++
    const pt = PT[l.en]
    if (pt) added++; else missing.push(l.en)
    return { speaker: l.speaker, en: l.en, tr: l.tr, de: l.de, es: l.es, ...(pt ? { pt } : {}), hint: l.hint }
  })
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8')
  console.log(`  ${f} güncellendi`)
}
console.log(`\n✅ ${added}/${total} satıra PT eklendi`)
if (missing.length) { console.log('⚠️  eksik:', missing.length); missing.forEach(m => console.log('   -', m)) }
