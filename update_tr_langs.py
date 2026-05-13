import sqlite3, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

db_path = r'C:\Users\Ata\Desktop\aguilangevotr\data\aguilangevo.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. TR dilini ekle (zaten varsa atla)
cur.execute("""
    INSERT OR IGNORE INTO languages (id, name, native_name, flag, created_at)
    VALUES ('tr', 'Turkish', 'Türkçe', '🇹🇷', datetime('now'))
""")
print(f'languages: TR eklendi (affected={cur.rowcount})')

# 2. TR->EN, TR->ES, TR->PT pair ekle
pairs_to_add = [
    (5, 'tr', 'en'),
    (6, 'tr', 'es'),
    (7, 'tr', 'pt'),
]
for pid, src, tgt in pairs_to_add:
    cur.execute("""
        INSERT OR IGNORE INTO language_pairs (id, source_lang, target_lang, is_active)
        VALUES (?, ?, ?, 1)
    """, (pid, src, tgt))
    print(f'language_pairs: {src}->{tgt} eklendi (affected={cur.rowcount})')

# 3. EN kaynak dilli pair'leri deaktif et (en->es, en->pt)
cur.execute("UPDATE language_pairs SET is_active = 0 WHERE source_lang = 'en'")
print(f'language_pairs: EN kaynak pair deaktif edildi (affected={cur.rowcount})')

conn.commit()

# --- Sonucu göster ---
conn.row_factory = sqlite3.Row
cur2 = conn.cursor()

print()
print('=== languages (GÜNCEL) ===')
cur2.execute('SELECT * FROM languages')
rows = cur2.fetchall()
print(' | '.join(rows[0].keys()))
print('-' * 70)
for r in rows:
    print(' | '.join(str(v) for v in r))

print()
print('=== language_pairs (GÜNCEL) ===')
cur2.execute('SELECT * FROM language_pairs ORDER BY id')
rows = cur2.fetchall()
print(' | '.join(rows[0].keys()))
print('-' * 70)
for r in rows:
    print(' | '.join(str(v) for v in r))

conn.close()
print()
print('Tamamlandi.')
