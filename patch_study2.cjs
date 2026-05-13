const fs = require('fs');
let code = fs.readFileSync('./src/pages/Study.jsx', 'utf8');

// useMemo dependency fix
code = code.replace(
  '// eslint-disable-next-line react-hooks/exhaustive-deps\n    []\n  )',
  '// eslint-disable-next-line react-hooks/exhaustive-deps\n    [selectedLevel]\n  )'
);

// Level butonları - progress bar üstüne
code = code.replace(
  '{/* Progress bar */}',
  '{/* Level Selector */}\n        <div className="flex gap-2 justify-center mb-4">\n          {[\'A1\',\'B1\',\'B2\'].map(l => (\n            <button key={l}\n              onClick={() => { setSelectedLevel(l); setIdx(0); setPhase(\'front\'); }}\n              className={\px-4 py-1 rounded-full text-sm font-bold border transition-colors \\}>\n              {l}\n            </button>\n          ))}\n        </div>\n\n        {/* Progress bar */}'
);

fs.writeFileSync('./src/pages/Study.jsx', code, 'utf8');
console.log('UI patch:', code.includes('Level Selector') ? 'OK' : 'HATA');
