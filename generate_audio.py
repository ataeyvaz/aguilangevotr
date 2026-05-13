"""
AguiLangEvo · MP3 Üretici (edge-tts)
=====================================
DB'deki tüm kelimeler için EN/ES/PT ses dosyası üretir.

Çıktı dizini:
  public/audio/en/{word}.mp3       — en-US-JennyNeural
  public/audio/es/{es_word}.mp3    — es-MX-DaliaNeural
  public/audio/pt/{pt_word}.mp3    — pt-BR-FranciscaNeural

Çalıştır: python generate_audio.py
"""

import asyncio
import os
import re
import sqlite3
import sys

import edge_tts

# Windows terminali UTF-8 olarak zorla
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ── Ayarlar ──────────────────────────────────────────────
DB_PATH    = os.path.join("data", "aguilangevo.db")
AUDIO_ROOT = os.path.join("public", "audio")

VOICES = {
    "en": "en-US-JennyNeural",
    "es": "es-MX-DaliaNeural",
    "pt": "pt-BR-FranciscaNeural",
}

# ── Dosya adı temizleme ───────────────────────────────────
def safe_filename(text: str) -> str:
    """'pedir prestado' → 'pedir_prestado', özel karakterler kaldırılır."""
    text = text.strip().lower()
    text = re.sub(r"[^\w\s\-]", "", text, flags=re.UNICODE)  # noktalama kaldır
    text = re.sub(r"\s+", "_", text)                          # boşluk → _
    return text or "unknown"

# ── Tek MP3 üret ─────────────────────────────────────────
async def generate_mp3(text: str, voice: str, path: str) -> bool:
    """Dosyayı üretir. Başarılıysa True, hata varsa False döner."""
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(path)
        return True
    except Exception as e:
        print(f"    ⚠ HATA [{text}]: {e}")
        return False

# ── Ana fonksiyon ─────────────────────────────────────────
async def main():
    # DB kontrolü
    if not os.path.exists(DB_PATH):
        print(f"❌ DB bulunamadı: {DB_PATH}")
        sys.exit(1)

    # Klasörleri oluştur
    for lang in VOICES:
        os.makedirs(os.path.join(AUDIO_ROOT, lang), exist_ok=True)
    print(f"Çıktı dizini  : {AUDIO_ROOT}/{{en,es,pt}}/")

    # DB'den kelimeleri çek
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute("""
        SELECT
            w.word,
            wt_es.translation AS es_word,
            wt_pt.translation AS pt_word
        FROM words w
        LEFT JOIN word_translations wt_es
            ON wt_es.word_id = w.id AND wt_es.target_lang = 'es'
        LEFT JOIN word_translations wt_pt
            ON wt_pt.word_id = w.id AND wt_pt.target_lang = 'pt'
        ORDER BY w.id
    """).fetchall()
    con.close()

    total   = len(rows)
    produced = 0
    skipped  = 0
    errors   = 0

    print(f"Toplam kelime : {total}")
    print(f"Sesler        : EN={VOICES['en']} | ES={VOICES['es']} | PT={VOICES['pt']}")
    print("─" * 60)

    for i, row in enumerate(rows, 1):
        en_word = row["word"]
        es_word = row["es_word"] or ""
        pt_word = row["pt_word"] or ""

        log_parts = []

        # ── EN ──────────────────────────────────────────
        en_file = os.path.join(AUDIO_ROOT, "en", f"{safe_filename(en_word)}.mp3")
        if os.path.exists(en_file):
            skipped += 1
            log_parts.append(f"EN:{en_word} ⏭")
        else:
            ok = await generate_mp3(en_word, VOICES["en"], en_file)
            if ok:
                produced += 1
                log_parts.append(f"EN:{en_word} ✅")
            else:
                errors += 1
                log_parts.append(f"EN:{en_word} ❌")

        # ── ES ──────────────────────────────────────────
        if es_word:
            es_file = os.path.join(AUDIO_ROOT, "es", f"{safe_filename(es_word)}.mp3")
            if os.path.exists(es_file):
                skipped += 1
                log_parts.append(f"ES:{es_word} ⏭")
            else:
                ok = await generate_mp3(es_word, VOICES["es"], es_file)
                if ok:
                    produced += 1
                    log_parts.append(f"ES:{es_word} ✅")
                else:
                    errors += 1
                    log_parts.append(f"ES:{es_word} ❌")
        else:
            log_parts.append("ES:— ⏩")

        # ── PT ──────────────────────────────────────────
        if pt_word:
            pt_file = os.path.join(AUDIO_ROOT, "pt", f"{safe_filename(pt_word)}.mp3")
            if os.path.exists(pt_file):
                skipped += 1
                log_parts.append(f"PT:{pt_word} ⏭")
            else:
                ok = await generate_mp3(pt_word, VOICES["pt"], pt_file)
                if ok:
                    produced += 1
                    log_parts.append(f"PT:{pt_word} ✅")
                else:
                    errors += 1
                    log_parts.append(f"PT:{pt_word} ❌")
        else:
            log_parts.append("PT:— ⏩")

        # Her 10 kelimede bir ilerleme logu
        if i % 10 == 0 or i == total:
            print(f"[{i:3}/{total}] {' | '.join(log_parts)}")

    # ── Özet ────────────────────────────────────────────
    print("─" * 60)
    print(f"Üretilen : {produced}")
    print(f"Atlanan  : {skipped}  (zaten vardı)")
    print(f"Hata     : {errors}")
    print("─" * 60)
    print("✅ Tamamlandı.")

if __name__ == "__main__":
    asyncio.run(main())
