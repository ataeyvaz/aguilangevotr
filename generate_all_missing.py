# -*- coding: utf-8 -*-
"""
generate_all_missing.py — İçerikteki (src/content/words/*.json) TÜM kelime/ifadeler için
eksik MP3'leri edge-tts ile üretir. 5 dil: tr, en, es, pt, de.

- Dosya adı kuralı audioManager.js/toFileName ile BİREBİR aynı:
  küçük harf → noktalama at ([.!?¿¡,;:"'`]) → boşluk(lar) '_' → Unicode korunur.
- Mevcut dosyalar atlanır (resumable). Aynı isme düşen tekrarlar tek üretilir.
- Sesler mevcut kayıtlarla aynı (kalite tutarlı):
    tr=tr-TR-EmelNeural  en=en-US-JennyNeural  es=es-MX-DaliaNeural
    pt=pt-BR-FranciscaNeural  de=de-DE-KatjaNeural
"""
import asyncio, json, os, re, sys
import edge_tts

ROOT = r'C:\Users\Ata\Desktop\aguilangevotr'
CONTENT = os.path.join(ROOT, 'src', 'content', 'words')
AUDIO = os.path.join(ROOT, 'public', 'audio')
LEVELS = ['A1', 'A2', 'B1', 'B2']
VOICES = {
    'tr': 'tr-TR-EmelNeural',
    'en': 'en-US-JennyNeural',
    'es': 'es-MX-DaliaNeural',
    'pt': 'pt-BR-FranciscaNeural',
    'de': 'de-DE-KatjaNeural',
}
CONCURRENCY = 6
RETRIES = 3

_punct = re.compile(r'[.!?¿¡,;:"\'`<>|*]')
_space = re.compile(r'\s+')

def primary_term(text):
    # "yaşlı / eski" (ikili anlam) → "yaşlı" — hem dosya adı hem seslendirme için
    return re.split(r'[/\\]', text or '', maxsplit=1)[0]

def to_filename(text):
    t = primary_term(text).lower().strip()
    t = _punct.sub('', t)
    t = _space.sub('_', t)
    return t

def build_tasks():
    """(lang, text, filepath) — eksik ve tekilleştirilmiş."""
    seen = set()          # (lang, filename)
    tasks = []
    counts = {l: {'total': 0, 'missing': 0} for l in VOICES}
    for lv in LEVELS:
        p = os.path.join(CONTENT, lv + '.json')
        if not os.path.exists(p):
            continue
        with open(p, encoding='utf-8') as f:
            words = json.load(f)
        for w in words:
            for lang in VOICES:
                text = w.get(lang)
                if not text or not str(text).strip():
                    continue
                fn = to_filename(text)
                if not fn:
                    continue
                key = (lang, fn)
                if key in seen:
                    continue
                seen.add(key)
                counts[lang]['total'] += 1
                fp = os.path.join(AUDIO, lang, fn + '.mp3')
                if os.path.exists(fp):
                    continue
                counts[lang]['missing'] += 1
                tasks.append((lang, primary_term(str(text)).strip(), fp))
    return tasks, counts

async def gen_one(sem, lang, text, fp, idx, total, stats):
    async with sem:
        voice = VOICES[lang]
        for attempt in range(1, RETRIES + 1):
            try:
                await edge_tts.Communicate(text, voice=voice).save(fp)
                # boş/bozuk dosya kontrolü
                if os.path.getsize(fp) < 500:
                    raise RuntimeError('too small')
                stats['ok'] += 1
                if idx % 50 == 0 or idx == total:
                    print(f'[{idx}/{total}] OK {lang}: {text[:40]}', flush=True)
                return
            except Exception as e:
                if attempt == RETRIES:
                    stats['fail'] += 1
                    print(f'[{idx}/{total}] HATA {lang}: {text[:40]} -> {e}', flush=True)
                    try:
                        if os.path.exists(fp):
                            os.remove(fp)
                    except OSError:
                        pass
                else:
                    await asyncio.sleep(1.5 * attempt)

async def main():
    for lang in VOICES:
        os.makedirs(os.path.join(AUDIO, lang), exist_ok=True)
    tasks, counts = build_tasks()
    print('=== Kapsam (tekilleştirilmiş) ===')
    for lang in VOICES:
        c = counts[lang]
        have = c['total'] - c['missing']
        print(f"  {lang}: {have}/{c['total']} var, {c['missing']} üretilecek")
    total = len(tasks)
    print(f'\nToplam üretilecek: {total} dosya\n', flush=True)
    if total == 0:
        print('Eksik yok, çıkılıyor.')
        return
    sem = asyncio.Semaphore(CONCURRENCY)
    stats = {'ok': 0, 'fail': 0}
    coros = [gen_one(sem, lang, text, fp, i, total, stats)
             for i, (lang, text, fp) in enumerate(tasks, 1)]
    await asyncio.gather(*coros)
    print(f'\n=== BİTTİ === Üretilen: {stats["ok"]}, Başarısız: {stats["fail"]}')

if __name__ == '__main__':
    asyncio.run(main())
