import asyncio
import edge_tts
import json
import os

async def generate():
    with open(r'C:\Users\Ata\Desktop\aguilangevotr\src\data\words-tr-a1.json', encoding='utf-8') as f:
        words = json.load(f)
    
    voices = {
        'en': 'en-US-JennyNeural',
        'es': 'es-MX-DaliaNeural',
        'pt': 'pt-BR-FranciscaNeural'
    }
    
    base = r'C:\Users\Ata\Desktop\aguilangevotr\public\audio'
    
    for lang, voice in voices.items():
        out_dir = os.path.join(base, lang)
        os.makedirs(out_dir, exist_ok=True)
        total = len(words)
        
        for i, word in enumerate(words, 1):
            text = word[lang]
            filename = text.lower().replace(' ', '_') + '.mp3'
            filepath = os.path.join(out_dir, filename)
            
            if os.path.exists(filepath):
                print(f'[{lang}][{i}/{total}] Atlandı: {text}')
                continue
            
            try:
                tts = edge_tts.Communicate(text, voice=voice)
                await tts.save(filepath)
                print(f'[{lang}][{i}/{total}] OK: {text}')
            except Exception as e:
                print(f'[{lang}][{i}/{total}] HATA: {text} → {e}')
    
    print('Tamamlandı!')

asyncio.run(generate())
