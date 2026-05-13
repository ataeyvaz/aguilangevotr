"""
ES senaryo paketlerini conversation_pack_scenarios_es.json'a ekle.
Travel zaten mevcut — sadece 8 yeni senaryo eklenir.
"""
import json, random, sys, os
sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.dirname(os.path.abspath(__file__))

CONTEXT_MAP = {
    'hospital':     'Hospital',
    'bank':         'Bank',
    'postoffice':   'Post Office',
    'gym':          'Gym',
    'movietheater': 'Movie Theater',
    'hairsalon':    'Hair Salon',
    'gasstation':   'Gas Station',
    'pharmacy':     'Pharmacy',
}

# travel zaten mevcut, atla
NEW_FILES = [
    'es_hospital.json', 'es_bank.json', 'es_postoffice.json',
    'es_gym.json', 'es_movietheater.json', 'es_hairsalon.json',
    'es_gasstation.json', 'es_pharmacy.json',
]


def convert_pack(raw: dict) -> dict:
    """es_*.json formatını conversation pack formatına çevir."""
    scenario   = raw['scenario']          # e.g. 'hospital'
    language   = raw['language']          # 'es'
    difficulty = raw.get('difficulty', 'easy')
    exchanges  = raw['exchanges']

    hints = [ex['hint'] for ex in exchanges]  # EN doğru cevaplar

    converted_exchanges = []
    for i, ex in enumerate(exchanges):
        correct_hint = hints[i]

        # Distractors: aynı paktaki diğer hint'lerden 2 tane
        others = [h for j, h in enumerate(hints) if j != i]
        random.seed(i)                      # tekrarlanabilir seçim
        distractors = random.sample(others, min(2, len(others)))

        # 3 seçeneği karıştır, doğru index'i takip et
        opts = [correct_hint] + distractors
        random.shuffle(opts)
        correct_idx = opts.index(correct_hint)

        converted_exchanges.append({
            'bot':     ex['bot'],
            'options': opts,
            'correct': correct_idx,
            'points':  10,
        })

    return {
        'word':         scenario,
        'level':        'a1',
        'difficulty':   difficulty,
        'context':      CONTEXT_MAP.get(scenario, scenario.title()),
        'bot_language': language,
        'exchanges':    converted_exchanges,
    }


def main():
    out_path = os.path.join(BASE, 'conversation_pack_scenarios_es.json')
    existing = json.load(open(out_path, encoding='utf-8'))
    existing_words = {p['word'] for p in existing}
    print(f'Mevcut ES paketleri: {sorted(existing_words)}')

    added = []
    for fname in NEW_FILES:
        path = os.path.join(BASE, fname)
        raw  = json.load(open(path, encoding='utf-8'))
        scenario = raw['scenario']

        if scenario in existing_words:
            print(f'  SKIP  {fname}  ({scenario} zaten mevcut)')
            continue

        pack = convert_pack(raw)
        existing.append(pack)
        existing_words.add(scenario)
        added.append(scenario)
        print(f'  ADD   {fname}  → word={scenario}, exchanges={len(pack["exchanges"])}')

    if not added:
        print('Eklenecek yeni paket yok.')
        return

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f'\nToplam ES paketi: {len(existing)}  (eklenen: {len(added)})')
    print(f'Eklenenler: {added}')
    print(f'\nDosya güncellendi: {out_path}')


if __name__ == '__main__':
    main()
