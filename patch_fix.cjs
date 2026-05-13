const fs = require('fs');
let code = fs.readFileSync('./src/pages/Study.jsx', 'utf8');

const broken = "className={px-4 py-1 rounded-full text-sm font-bold border transition-colors \\}>";

const fixed = 'className={px-4 py-1 rounded-full text-sm font-bold border transition-colors }>';

code = code.replace(broken, fixed);
fs.writeFileSync('./src/pages/Study.jsx', code, 'utf8');
console.log('Fix:', code.includes('bg-cyan-600 text-white border-cyan-600') ? 'OK' : 'HATA');
