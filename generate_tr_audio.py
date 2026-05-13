import asyncio
import edge_tts
import json
import os

async def generate():
    with open(r'C:\Users\Ata\Desktop\aguilangevotr\src\data\words-tr-a1.json', encoding='utf-8') as f:
        words = json.load(f)
    
    output_dir = r'C:\Users\Ata\Desktop\aguilangevotr\public\audio\tr'
    os.makedirs(output_dir, exist_ok=True)
    
    total = len(words)
    for i, word in enumerate(words, 1):
        tr_word = word['tr']
        filename = tr_word.lower().replace(' ', '_') + '.mp3'
        filepath = os.path.join(output_dir, filename)
        
        if os.path.exists(filepath):
            print(f'[{i}/{total}] Atlandı (mevcut): {tr_word}')
            continue
        
        try:
            tts = edge_tts.Communicate(tr_word, voice='tr-TR-EmelNeural')
            await tts.save(filepath)
            print(f'[{i}/{total}] OK: {tr_word} → {filename}')
        except Exception as e:
            print(f'[{i}/{total}] HATA: {tr_word} → {e}')
    
    print(f'\nTamamlandı! {output_dir}')

asyncio.run(generate())
