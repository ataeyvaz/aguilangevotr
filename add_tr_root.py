import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BASE_TR = {
    "learn":"Ogren","words":"Kelimeler","grammar":"Dilbilgisi","dialogues":"Diyaloglar",
    "quiz":"Test","games":"Oyunlar","dictionary":"Sozluk","searchWord":"Kelime ara...",
    "search":"Ara","levels":"Seviyeler","profile":"Profil","settings":"Ayarlar",
    "dashboard":"Gosterge Paneli","statistics":"Istatistikler","my words":"Kelimelerim",
    "login":"Giris Yap","logout":"Cikis Yap","start":"Basla","continue":"Devam Et",
    "next":"Sonraki","back":"Geri","finish":"Bitir","correct":"Dogru","wrong":"Yanlis",
    "skip":"Atla","easy":"Kolay","hard":"Zor","study now":"Simdi Calis",
    "show answer":"Cevabi Goster","start learning":"Ogrenmeye Basla",
    "start test":"Testi Baslat","well done":"Aferin!","keep going":"Devam Et!",
    "daily goal":"Gunluk Hedef","streak":"Seri","points":"Puan","level":"Seviye",
    "progress":"Ilerleme","mastered":"Ustalasildi","learning":"Ogreniyor",
    "review":"Tekrar","new":"Yeni",
    "what do you want to study":"Ne calismak istiyorsun?",
    "daily word cards and quiz":"Gunluk kelime kartlari ve test",
    "grammar lessons and exercises":"Dilbilgisi dersleri ve alistirmalar",
    "conversation scenarios":"Konusma senaryolari",
    "test your knowledge":"Bilgini test et","select language":"Dil Sec",
    "select age":"Yas Sec","child":"Cocuk","adult":"Yetiskin",
    "english":"Ingilizce","spanish":"Ispanyolca","portuguese":"Portekizce",
    "parent panel":"Ebeveyn Paneli","pin code":"PIN Kodu",
    "default pin":"Varsayilan PIN","a1 beginner":"A1 Baslangic",
    "a2 elementary":"A2 Temel","your level is":"Seviyeniz:",
    "words learned":"Ogrenilen Kelimeler","days streak":"Gunluk Seri",
    "correct answers":"Dogru Cevaplar","placement test":"Seviye Testi",
    "question of":"Soru","choose the correct answer":"Dogru cevabi secin",
    "goal completed":"Hedef Tamamlandi!","continue learning":"Ogrenmeye Devam Et ->",
    "categories":"Kategoriler","see all":"Tumunu Gor ->","select category":"Kategori Sec",
    "search categories":"Kategorilerde ara...","complete n flash cards":"{n} kart tamamla",
    "listen":"Dinle","tap to see meaning":"Anlami gormek icin dokun","say it":"Soyle",
    "view visited words":"Gezilen kelimeleri gor","i got it":"Anladim",
    "previous":"<- Onceki","last 7 days":"Son 7 Gun","great job":"Harika is!",
    "due today":"bekliyor",
    "words need review":"kelime tekrar bekliyor - hadi pratik yapalim!",
    "come back tomorrow":"Seriyi surdurmek icin yarin geri gel!",
}

PROFILE_TR = {
    "i speak":"Konustuğum dil","i want to learn":"Oğrenmek istediğim dil",
    "select your language":"Dilini sec","select your native language":"Ana dilini sec",
    "native language":"Ana dil","learning language":"Oğrenilen dil",
    "interface language":"Arayuz dili","change interface language":"Arayuz dilini degistir",
    "language settings":"Dil ayarlari","how old are you":"Kac yasındasın?",
    "i am a child":"Ben bir cocuğum","i am an adult":"Ben bir yetiskinim",
    "welcome to aguilangevo":"AguiLangEvoTR'ye hos geldiniz",
    "lets get started":"Baslayalim","choose your mode":"Mod sec",
    "learning mode":"Ogrenme modu","child mode":"Cocuk modu","adult mode":"Yetiskin modu",
    "your journey begins":"Yolculuğun basliyor","ready to learn":"Ogrenmeye hazir",
    "what is your name":"Adin ne?","enter your name":"Adini gir",
    "hello":"Merhaba","good morning":"Gunaydin",
    "good afternoon":"Iyi ogleden sonralar","good evening":"Iyi aksamlar",
    "lets go":"Basla","continue setup":"Kuruluma devam et",
    "almost done":"Neredeyse bitti","your profile is ready":"Profilin hazir",
    "start learning now":"Simdi ogrenmeye basla",
    "i speak spanish":"Ispanyolca konusuyorum","i speak portuguese":"Portekizce konusuyorum",
    "i want to learn english":"Ingilizce ogrenmek istiyorum",
    "espanol":"Ispanyolca","portugues":"Portekizce","english":"Ingilizce",
    "change language":"Dili degistir","interface set to":"Arayuz dili:",
    "language changed successfully":"Dil basariyla degistirildi",
    "save":"Kaydet","saved":"Kaydedildi!",
}

base = r"C:\Users\Ata\Desktop\aguilangevotr"
files = [
    (f"{base}\\ui_translations.json", BASE_TR),
    (f"{base}\\ui_translations_profile.json", PROFILE_TR),
]
for path, tr_map in files:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    added = 0
    for key, val in data.items():
        if "tr" not in val:
            val["tr"] = tr_map.get(key, val.get("en", key))
            added += 1
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"{path.split(chr(92))[-1]}: {added} TR anahtari eklendi")

print("Tamamlandi.")
