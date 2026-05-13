import re

with open('src/pages/Study.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Level Selector bloğunu tamamen yeniden yaz
old = re.search(r'\{/\* Level Selector \*/\}.*?\{/\* Progress bar \*/\}', code, re.DOTALL)
if old:
    new_block = '''{/* Level Selector */}
        <div className="flex gap-2 justify-center mb-4">
          {['A1','B1','B2'].map(l => (
            <button key={l}
              onClick={() => { setSelectedLevel(l); setIdx(0); setPhase('front'); }}
              className={[
                'px-4 py-1 rounded-full text-sm font-bold border transition-colors',
                selectedLevel === l ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-500 border-slate-300'
              ].join(' ')}>
              {l}
            </button>
          ))}
        </div>

        {/* Progress bar */}'''
    code = code[:old.start()] + new_block + code[old.end():]
    with open('src/pages/Study.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print('OK')
else:
    print('HATA - blok bulunamadi')
