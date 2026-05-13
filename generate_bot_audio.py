import asyncio
import edge_tts
import sqlite3
import hashlib
import os
import sys

# Veritabanı yolu
DB_PATH = 'data/aguilangevo.db'

# Dil -> Ses eşleştirmeleri
VOICES = {
    'es': 'es-MX-DaliaNeural',
    'pt': 'pt-BR-FranciscaNeural',
}

# Çıktı dizini
OUT_BASE = 'public/audio/bot'

def get_md5(text):
    """Metnin MD5 hash'ini hesapla"""
    return hashlib.md5(text.encode('utf-8')).hexdigest()

def get_bot_messages(db_path):
    """Veritabanından tüm distinct bot_message ve bot_language çiftlerini çek"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    query = """
    SELECT DISTINCT ce.bot_message, cp.bot_language
    FROM conversation_exchanges ce
    JOIN conversation_packs cp ON cp.id = ce.pack_id
    WHERE ce.bot_message IS NOT NULL
      AND ce.bot_message != ''
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    return [{'message': row[0], 'language': row[1]} for row in rows]

async def generate_audio(text, voice, output_path):
    """edge-tts kullanarak ses dosyası üret"""
    if os.path.exists(output_path):
        return 'skip'

    try:
        # Dizinin var olduğundan emin ol
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        communicate = edge_tts.Communicate(text, voice=voice)
        await communicate.save(output_path)
        return 'success'
    except Exception as e:
        print(f'    [HATA] {e}')
        return 'error'

async def main():
    print('[BILGI] Veritabanindan bot mesajlari cekiliyor...')
    messages = get_bot_messages(DB_PATH)

    if not messages:
        print('[HATA] Hic bot mesaji bulunamadi!')
        return

    print(f'[BILGI] Toplam {len(messages)} benzersiz bot mesaji bulundu.\n')

    # Dile göre grupla
    by_language = {}
    for item in messages:
        lang = item['language']
        if lang not in by_language:
            by_language[lang] = []
        by_language[lang].append(item['message'])

    # İstatistikler
    stats = {
        'generated': 0,
        'skipped': 0,
        'errors': 0
    }

    # Her dil için sesleri üret
    for lang, texts in by_language.items():
        if lang not in VOICES:
            print(f'[UYARI] {lang} dili icin ses tanimlanmamis, atlaniyor...')
            continue

        voice = VOICES[lang]
        out_dir = os.path.join(OUT_BASE, lang)
        os.makedirs(out_dir, exist_ok=True)

        print(f'[SES] {lang} dili icin sesler uretiliyor... ({len(texts)} mesaj)')
        print(f'       Ses: {voice}')

        # Görevleri oluştur
        tasks = []
        task_info = []

        for text in texts:
            text_hash = get_md5(text)
            output_path = os.path.join(out_dir, f'{text_hash}.mp3')
            tasks.append(generate_audio(text, voice, output_path))
            task_info.append({'hash': text_hash, 'text': text[:50]})

        # 20'şerli gruplar halinde çalıştır
        for i in range(0, len(tasks), 20):
            batch = tasks[i:i+20]
            batch_info = task_info[i:i+20]

            print(f'[ILERLEME] {i+1}-{min(i+20, len(tasks))}/{len(tasks)}')

            results = await asyncio.gather(*batch)

            for j, result in enumerate(results):
                if result == 'success':
                    stats['generated'] += 1
                elif result == 'skip':
                    stats['skipped'] += 1
                else:
                    stats['errors'] += 1

        print(f'[TAMAM] {lang} tamamlandi!\n')

    # Özet yazdır
    print('=' * 50)
    print('OZET')
    print('=' * 50)
    print(f'Uretilen: {stats["generated"]} dosya')
    print(f'Atlanan:  {stats["skipped"]} dosya (zaten var)')
    print(f'Hata:     {stats["errors"]} dosya')
    print(f'Toplam:   {stats["generated"] + stats["skipped"] + stats["errors"]} dosya')
    print('=' * 50)

if __name__ == '__main__':
    # edge-tts yüklü mü kontrol et
    try:
        import edge_tts
    except ImportError:
        print('[HATA] edge-tts yuklu degil! Yuklemek icin:')
        print('        pip install edge-tts')
        sys.exit(1)

    asyncio.run(main())