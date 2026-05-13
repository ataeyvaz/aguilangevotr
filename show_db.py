import sqlite3, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

db_path = r'C:\Users\Ata\Desktop\aguilangevotr\data\aguilangevo.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print('=== languages tablosu ===')
cur.execute('SELECT * FROM languages')
rows = cur.fetchall()
if rows:
    print(' | '.join(rows[0].keys()))
    print('-' * 70)
    for r in rows:
        print(' | '.join(str(v) for v in r))
else:
    print('(bos)')

print()
print('=== language_pairs tablosu ===')
cur.execute('SELECT * FROM language_pairs')
rows = cur.fetchall()
if rows:
    print(' | '.join(rows[0].keys()))
    print('-' * 70)
    for r in rows:
        print(' | '.join(str(v) for v in r))
else:
    print('(bos)')

conn.close()
