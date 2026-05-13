const fs = require('fs');

if(!fs.existsSync('./_source_data')) fs.mkdirSync('./_source_data');

// Bunlari tasima
const skip = [
  'package.json',
  'package-lock.json',
  'capacitor.config.json',
  'tsconfig.json',
  'vite.config.js',
  'tailwind.config.js',
  'postcss.config.js'
];

const jsons = fs.readdirSync('.').filter(f => 
  f.endsWith('.json') && !skip.includes(f)
);

jsons.forEach(f => {
  fs.renameSync(f, '_source_data/' + f);
  console.log('Tasindi:', f);
});

console.log('Toplam:', jsons.length, 'dosya tasindi.');
