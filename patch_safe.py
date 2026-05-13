with open('src/pages/Study.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

result = []
for i, line in enumerate(lines):

    # 1. Import ekle
    if "import verbsData from '../data/verbs-a1.json'" in line:
        result.append(line)
        result.append("import b1Data from '../data/words-b1.json'\n")
        result.append("import b2Data from '../data/words-b2.json'\n")
        continue

    # 2. State ekle
    if "const targetLang = PAIR_LANG[currentPair]" in line:
        result.append(line)
        result.append("  const [selectedLevel, setSelectedLevel] = useState('A1')\n")
        continue

    # 3. getStudyWords guncelle
    if "getStudyWords(verbsData.words, targetLang, 10)" in line:
        result.append("    () => getStudyWords(selectedLevel==='B1' ? b1Data.words : selectedLevel==='B2' ? b2Data.words : verbsData.words, targetLang, 10),\n")
        continue

    # 4. useMemo bos dependency fix
    if line.strip() == '[]':
        result.append("    [selectedLevel]\n")
        continue

    # 5. Progress bar oncesine buton ekle
    if '{/* Progress bar */}' in line:
        result.append("        <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'16px'}}>\n")
        result.append("          {['A1','B1','B2'].map(l => (\n")
        result.append("            <button key={l} onClick={() => { setSelectedLevel(l); setIdx(0); setPhase('front'); }}\n")
        result.append("              style={{padding:'2px 16px',borderRadius:'999px',fontSize:'14px',fontWeight:'bold',border:'1px solid',\n")
        result.append("                borderColor: selectedLevel===l ? '#0891b2' : '#cbd5e1',\n")
        result.append("                background: selectedLevel===l ? '#0891b2' : 'white',\n")
        result.append("                color: selectedLevel===l ? 'white' : '#64748b'}}>{l}</button>\n")
        result.append("          ))}\n")
        result.append("        </div>\n")

    result.append(line)

with open('src/pages/Study.jsx', 'w', encoding='utf-8') as f:
    f.writelines(result)

print('OK - kontrol:', sum(1 for l in result if 'b1Data' in l), 'b1Data satiri bulundu')
