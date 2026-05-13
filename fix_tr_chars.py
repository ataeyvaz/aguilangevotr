import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

fixes = {
    "ui_translations_profile.json": {
        "lets get started":  "Başlayalım",
        "lets go":           "Başla",
        "i speak":           "Konuştuğum dil",
        "i want to learn":   "Öğrenmek istediğim dil",
        "choose your mode":  "Mod seç",
        "adult mode":        "Yetişkin modu",
        "child mode":        "Çocuk modu",
        "change interface language": "Arayüz dilini değiştir",
        "language settings": "Dil ayarları",
        "welcome to aguilangevo": "AguiLangEvoTR'ye hoş geldiniz",
        "your journey begins": "Yolculuğun başlıyor",
        "ready to learn":    "Öğrenmeye hazır",
        "continue setup":    "Kuruluma devam et",
        "almost done":       "Neredeyse bitti",
        "your profile is ready": "Profilin hazır",
        "start learning now": "Şimdi öğrenmeye başla",
        "i speak spanish":   "İspanyolca konuşuyorum",
        "i speak portuguese": "Portekizce konuşuyorum",
        "i want to learn english": "İngilizce öğrenmek istiyorum",
        "change language":   "Dili değiştir",
        "language changed successfully": "Dil başarıyla değiştirildi",
        "saved":             "Kaydedildi!",
    },
    "ui_translations.json": {
        "learn":             "Öğren",
        "grammar":           "Dilbilgisi",
        "search":            "Ara",
        "dashboard":         "Gösterge Paneli",
        "statistics":        "İstatistikler",
        "login":             "Giriş Yap",
        "logout":            "Çıkış Yap",
        "start learning":    "Öğrenmeye Başla",
        "study now":         "Şimdi Çalış",
        "show answer":       "Cevabı Göster",
        "start test":        "Testi Başlat",
        "mastered":          "Ustalaşıldı",
        "learning":          "Öğreniliyor",
        "what do you want to study": "Ne çalışmak istiyorsun?",
        "grammar lessons and exercises": "Dilbilgisi dersleri ve alıştırmalar",
        "select language":   "Dil Seç",
        "select age":        "Yaş Seç",
        "child":             "Çocuk",
        "english":           "İngilizce",
        "spanish":           "İspanyolca",
        "portuguese":        "Portekizce",
        "parent panel":      "Ebeveyn Paneli",
        "a1 beginner":       "A1 Başlangıç",
        "words learned":     "Öğrenilen Kelimeler",
        "correct answers":   "Doğru Cevaplar",
        "placement test":    "Seviye Testi",
        "choose the correct answer": "Doğru cevabı seçin",
        "goal completed":    "Hedef Tamamlandı!",
        "continue learning": "Öğrenmeye Devam Et →",
        "see all":           "Tümünü Gör →",
        "select category":   "Kategori Seç",
        "search categories": "Kategorilerde ara...",
        "complete n flash cards": "{n} kart tamamla",
        "tap to see meaning": "Anlamı görmek için dokun",
        "view visited words": "Gezilen kelimeleri gör",
        "i got it":          "Anladım ✓",
        "previous":          "← Önceki",
        "great job":         "Harika iş!",
        "words need review": "kelime tekrar bekliyor — hadi pratik yapalım! 💪",
        "come back tomorrow": "Seriyi sürdürmek için yarın geri gel! 🚀",
        "daily word cards and quiz": "Günlük kelime kartları ve test",
        "conversation scenarios": "Konuşma senaryoları",
        "categories":        "Kategoriler",
    },
}

base = r"C:\Users\Ata\Desktop\aguilangevotr"
for fname, kv in fixes.items():
    path = f"{base}\\{fname}"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    updated = 0
    for key, tr_val in kv.items():
        if key in data:
            data[key]["tr"] = tr_val
            updated += 1
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"{fname}: {updated} TR degeri duzeltildi")
print("Tamamlandi.")
