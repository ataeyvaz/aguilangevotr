const fs = require('fs');

if(!fs.existsSync('./scripts')) fs.mkdirSync('./scripts');

const mjs = fs.readdirSync('.').filter(f => f.endsWith('.mjs'));

mjs.forEach(f => {
  fs.renameSync(f, 'scripts/' + f);
  console.log('Tasindi:', f);
});

console.log('Toplam:', mjs.length, '.mjs tasindi.');
