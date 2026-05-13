import asyncio
import json
import os
from edge_tts import Communicate

# JSON verisini oku
with open('data/words_b1.json', 'r', encoding='utf-8') as f:
    words_data = json.load(f)

# Dizinleri oluştur
os.makedirs('public/audio/en', exist_ok=True)
os.makedirs('public/audio/es', exist_ok=True)
os.makedirs('public/audio/pt', exist_ok=True)

# Seslendirme yapılandırması
VOICES = {
    'en': 'en-US-JennyNeural',
    'es': 'es-MX-DaliaNeural',
    'pt': 'pt-BR-FranciscaNeural'
}

async def generate_audio(text, output_path, voice):
    """Tek bir ses dosyası oluştur"""
    # Dosya varsa atla
    if os.path.exists(output_path):
        print(f"Atlandı: {output_path}")
        return False
    
    try:
        communicate = Communicate(text, voice)
        await communicate.save(output_path)
        print(f"Oluşturuldu: {output_path}")
        return True
    except Exception as e:
        print(f"Hata ({output_path}): {e}")
        return False

async def main():
    print(f"Toplam {len(words_data)} kelime işlenecek...\n")
    
    generated_count = 0
    skipped_count = 0
    
    for word_data in words_data:
        word = word_data['word']
        
        # EN ses dosyası
        en_path = f"public/audio/en/{word}.mp3"
        if os.path.exists(en_path):
            skipped_count += 1
        else:
            success = await generate_audio(word, en_path, VOICES['en'])
            if success:
                generated_count += 1
            else:
                skipped_count += 1
        
        # ES ses dosyası
        if word_data.get('translations', {}).get('es'):
            es_translation = word_data['translations']['es']['translation']
            # Dosya adı için güvenli karakterler
            safe_es_name = es_translation.replace(' ', '_').replace('/', '_')
            es_path = f"public/audio/es/{safe_es_name}.mp3"
            
            if os.path.exists(es_path):
                skipped_count += 1
            else:
                success = await generate_audio(es_translation, es_path, VOICES['es'])
                if success:
                    generated_count += 1
                else:
                    skipped_count += 1
        
        # PT ses dosyası
        if word_data.get('translations', {}).get('pt'):
            pt_translation = word_data['translations']['pt']['translation']
            # Dosya adı için güvenli karakterler
            safe_pt_name = pt_translation.replace(' ', '_').replace('/', '_')
            pt_path = f"public/audio/pt/{safe_pt_name}.mp3"
            
            if os.path.exists(pt_path):
                skipped_count += 1
            else:
                success = await generate_audio(pt_translation, pt_path, VOICES['pt'])
                if success:
                    generated_count += 1
                else:
                    skipped_count += 1
    
    print(f"\nTamamlandı!")
    print(f"Oluşturulan: {generated_count}")
    print(f"Atlanan (var olan): {skipped_count}")

if __name__ == '__main__':
    asyncio.run(main())