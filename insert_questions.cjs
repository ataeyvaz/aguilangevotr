const D = require('better-sqlite3');
const db = new D('./data/aguilangevo.db');
const max = db.prepare('SELECT MAX(order_index) as m FROM placement_questions').get().m;

const questions = [
  // B1 Sorular
  {q:"What does 'improve' mean in Spanish?", a:"mejorar", d:'["lograr","reducir","evitar"]', l:"B1", o:max+1},
  {q:"What does 'challenge' mean in Spanish?", a:"desafio", d:'["ventaja","progreso","decision"]', l:"B1", o:max+2},
  {q:"What does 'confident' mean in Spanish?", a:"seguro", d:'["nervioso","ansioso","curioso"]', l:"B1", o:max+3},
  {q:"What does 'opportunity' mean in Spanish?", a:"oportunidad", d:'["habilidad","relacion","tradicion"]', l:"B1", o:max+4},
  {q:"What does 'responsible' mean in Spanish?", a:"responsable", d:'["flexible","honesto","generoso"]', l:"B1", o:max+5},
  {q:"What does 'develop' mean in Spanish?", a:"desarrollar", d:'["reducir","organizar","evitar"]', l:"B1", o:max+6},
  {q:"What does 'suggest' mean in Spanish?", a:"sugerir", d:'["comparar","explicar","preparar"]', l:"B1", o:max+7},
  {q:"What does 'progress' mean in Spanish?", a:"progreso", d:'["memoria","cultura","decision"]', l:"B1", o:max+8},
  {q:"What does 'honest' mean in Spanish?", a:"honesto", d:'["valiente","capaz","curioso"]', l:"B1", o:max+9},
  {q:"What does 'freedom' mean in Spanish?", a:"libertad", d:'["carrera","comunidad","tradicion"]', l:"B1", o:max+10},
  // B2 Sorular
  {q:"What does 'strategy' mean in Spanish?", a:"estrategia", d:'["impacto","actitud","evidencia"]', l:"B2", o:max+11},
  {q:"What does 'significant' mean in Spanish?", a:"significativo", d:'["creativo","etico","genuino"]', l:"B2", o:max+12},
  {q:"What does 'collaborate' mean in Spanish?", a:"colaborar", d:'["negociar","evaluar","debatir"]', l:"B2", o:max+13},
  {q:"What does 'motivation' mean in Spanish?", a:"motivacion", d:'["diversidad","evidencia","impacto"]', l:"B2", o:max+14},
  {q:"What does 'dedicated' mean in Spanish?", a:"dedicado", d:'["ambicioso","etico","critico"]', l:"B2", o:max+15},
  {q:"What does 'consequence' mean in Spanish?", a:"consecuencia", d:'["perspectiva","actitud","tendencia"]', l:"B2", o:max+16},
  {q:"What does 'innovative' mean in Spanish?", a:"innovador", d:'["sofisticado","eficiente","genuino"]', l:"B2", o:max+17},
  {q:"What does 'acknowledge' mean in Spanish?", a:"reconocer", d:'["anticipar","analizar","implementar"]', l:"B2", o:max+18},
  {q:"What does 'commitment' mean in Spanish?", a:"compromiso", d:'["prioridad","estrategia","tendencia"]', l:"B2", o:max+19},
  {q:"What does 'diversity' mean in Spanish?", a:"diversidad", d:'["innovacion","perspectiva","evidencia"]', l:"B2", o:max+20},
];

const stmt = db.prepare('INSERT INTO placement_questions (question,answer,distractors,cefr_level,language_pair_id,order_index,skill_area) VALUES (?,?,?,?,3,?,\'vocabulary\')');
questions.forEach(q => stmt.run(q.q, q.a, q.d, q.l, q.o));
console.log('20 soru eklendi! B1:10 B2:10');
