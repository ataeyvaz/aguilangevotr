const fs = require('fs');
let code = fs.readFileSync('./src/pages/Study.jsx', 'utf8');

code = code.replace(
  "import verbsData from '../data/verbs-a1.json'",
  "import verbsData from '../data/verbs-a1.json'\nimport b1Data from '../data/words-b1.json'\nimport b2Data from '../data/words-b2.json'"
);

code = code.replace(
  "const targetLang = PAIR_LANG[currentPair] ?? 'es'",
  "const targetLang = PAIR_LANG[currentPair] ?? 'es'\n  const [selectedLevel, setSelectedLevel] = useState('A1')"
);

code = code.replace(
  'getStudyWords(verbsData.words, targetLang, 10)',
  "getStudyWords(selectedLevel==='B1' ? b1Data.words : selectedLevel==='B2' ? b2Data.words : verbsData.words, targetLang, 10)"
);

fs.writeFileSync('./src/pages/Study.jsx', code, 'utf8');
console.log('Tamamlandi:', code.includes('b1Data') ? 'OK' : 'HATA');
