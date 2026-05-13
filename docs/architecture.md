# AguiLang — Mimari Kararlar

## Neden localStorage?
Sıfır backend maliyeti. İki çocuk için yeterli.
İleride Firebase eklenebilir ama şimdi gereksiz.

## Neden React Router yok?
Faz 1'de useState ile basit ekran geçişi yeterli.
Faz 3-4'te React Router eklenecek (URL bazlı navigasyon).

## Ekran akışı
ProfileSelect → LanguageSelect → FlashCards → QuizScreen → QuizSummary
                                            ↘ Oyunlar (Faz 3)
                                            
## Veri dosyası yapısı kararı
Dil bazlı klasörler (en/de/es) yerine kategori bazlı tek dosya seçildi.
Sebep: Bir kelime eklenince üç dil aynı anda güncellenir, tutarsızlık olmaz.
Yeni dosya formatı: `src/data/{kategori}-{seviye}.json`
Bu yapıyı DEĞIŞTIRME.

## Profil veri yapısı (localStorage)
```json
{
  "profiles": [
    {
      "id": "kartal",
      "name": "Kartal",
      "points": 0,
      "streak": 0,
      "lastActive": "2025-01-01",
      "progress": {
        "en": { "animals-a1": { "known": ["dog","cat"], "repeat": [] } }
      }
    }
  ]
}
```

## DialogueScreen — İki Cihaz Modu (ileride)

Şu an yalnızca **MOD 1 (Aynı Cihaz)** uygulandı: "Telefonu uzat" handoff sistemi.

**MOD 2 (İki Cihaz) — henüz implement edilmedi:**
DialogueScreen ileride WebSocket veya Firebase Realtime ile iki cihaz arasında
senkronize edilecek. Her kullanıcı sadece kendi rolünü görür.

Altyapı hazırlığı için gözetilmesi gerekenler:
- `dialogue.roles[0]` → Cihaz A'nın rolü (örn. "Kartal")
- `dialogue.roles[1]` → Cihaz B'nin rolü (örn. "Emir")
- Her cihaz yalnızca kendi `speaker` alanıyla eşleşen satırları input olarak görür
- Karşı tarafın satırları TTS ile seslendirilir, baloncuk olarak gösterilir
- Senkronizasyon: `lineIndex` + `score` ortak bir oda state'inde tutulur
- Firebase seçilirse: Faz 1'deki "sıfır backend" kararıyla çelişir;
  sadece multiplayer aktifken bağlantı aç, oturum bitince kapat

## Bot mimarisi (Faz 2 sonrası)
Kural tabanlı, sıfır AI maliyeti.
Şablon havuzu → kullanıcı girdisini anahtar kelimeyle eşle → yanıt seç.
```

---

## 📌 Adım 5 — `.gitignore` güncellemesi

Projedeki `.gitignore` dosyasına şunu ekle:
```
# Claude Code kişisel notlar (paylaşma)
CLAUDE.local.md
.claude/
```

---

## Claude Code ile çalışma akışı

Oturuma özgü bilgileri `docs/` klasöründe tut, ihtiyaç duyduğunda `@docs/roadmap.md` gibi referans ver — her şeyi CLAUDE.md'ye doldurmaya çalışma, token israfı olur. 

Tipik bir çalışma seansı şöyle görünür:
```
# Terminal'de:
claude

# Claude Code'a söylersin:
"@docs/roadmap.md dosyasına bak, sıradaki görev ne?
 QuizScreen sayfasını yap."

# İş bitince yeni görev için:
/clear
```

Her yeni görev için `/clear` kullan. Eski bağlamı taşıma — performansı düşürür. 

Ve harika bir özellik: oturum içinde `#` ile başlayan bir mesaj yazarsan, Claude Code seni hangi belleğe kaydetmek istediğini sorar — proje CLAUDE.md'ye mi, kişisel belleğe mi. 
```
# Mesela:
# Yeni JSON dosyaları eklerken her zaman src/data/ altına koy