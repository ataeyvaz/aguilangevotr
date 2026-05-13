import json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

SRC = r"C:\Users\Ata\Desktop\aguilang2\src\data"

def load(fname):
    with open(os.path.join(SRC, fname), encoding="utf-8") as f:
        return json.load(f)

def words_by_id(data, lang):
    return {w["id"]: w for w in data["translations"].get(lang, {}).get("words", [])}

# PT çevirileri (sözlük)
PT = {
    # food
    "bread":"pão","milk":"leite","egg":"ovo","cheese":"queijo","pizza":"pizza",
    "rice":"arroz","soup":"sopa","cake":"bolo","cookie":"biscoito","icecream":"sorvete",
    "sandwich":"sanduíche","pasta":"macarrão","butter":"manteiga","chicken":"frango",
    "chocolate":"chocolate","coffee":"café","juice":"suco","meat":"carne",
    "salad":"salada","salt":"sal","sugar":"açúcar","tea":"chá",
    # animals
    "cat":"gato","dog":"cachorro","fish":"peixe","bird":"pássaro","rabbit":"coelho",
    "horse":"cavalo","cow":"vaca","sheep":"ovelha","pig":"porco","duck":"pato",
    "frog":"sapo","lion":"leão","elephant":"elefante","monkey":"macaco","snake":"cobra",
    # colors
    "red":"vermelho","blue":"azul","green":"verde","yellow":"amarelo","orange":"laranja",
    "purple":"roxo","pink":"rosa","white":"branco","black":"preto","brown":"marrom",
    "gray":"cinza","gold":"dourado",
    # numbers
    "one":"um","two":"dois","three":"três","four":"quatro","five":"cinco",
    "six":"seis","seven":"sete","eight":"oito","nine":"nove","ten":"dez",
    "eleven":"onze","twelve":"doze","thirteen":"treze","fourteen":"catorze",
    "fifteen":"quinze","sixteen":"dezesseis","seventeen":"dezessete",
    "eighteen":"dezoito","nineteen":"dezenove","twenty":"vinte",
    "thirty":"trinta","forty":"quarenta","fifty":"cinquenta","sixty":"sessenta",
    "seventy":"setenta","eighty":"oitenta","ninety":"noventa",
    "hundred":"cem","thousand":"mil",
    # family
    "mother":"mãe","father":"pai","brother":"irmão","sister":"irmã",
    "grandmother":"avó","grandfather":"avô","aunt":"tia","uncle":"tio",
    "baby":"bebê","family":"família","son":"filho","daughter":"filha",
    "husband":"marido","wife":"esposa","cousin":"primo","dad":"pai","mum":"mãe",
    # body
    "head":"cabeça","eye":"olho","ear":"orelha","nose":"nariz","mouth":"boca",
    "hand":"mão","foot":"pé","arm":"braço","leg":"perna","hair":"cabelo",
    "teeth":"dentes","shoulder":"ombro","face":"rosto","finger":"dedo",
    "back":"costas","knee":"joelho","stomach":"estômago","chest":"peito",
    "neck":"pescoço","tongue":"língua",
    # home
    "bath":"banheira","bathroom":"banheiro","bedroom":"quarto","ceiling":"teto",
    "chair":"cadeira","door":"porta","floor":"chão","garden":"jardim","gate":"portão",
    "kitchen":"cozinha","lamp":"lâmpada","mirror":"espelho","oven":"forno",
    "roof":"telhado","shelf":"prateleira","shower":"chuveiro","sofa":"sofá",
    "stairs":"escada","wall":"parede","window":"janela","yard":"quintal","bed":"cama",
    "blanket":"cobertor","brush":"escova","bucket":"balde","carpet":"tapete",
    "curtain":"cortina","cushion":"almofada","drawer":"gaveta","fridge":"geladeira",
    "freezer":"freezer","kettle":"chaleira","pillow":"travesseiro",
    "sink":"pia","tap":"torneira","toilet":"vaso sanitário",
    # transport
    "bicycle":"bicicleta","boat":"barco","bus":"ônibus","car":"carro","plane":"avião",
    "ship":"navio","taxi":"táxi","train":"trem","truck":"caminhão",
    "ambulance":"ambulância","ferry":"balsa","helicopter":"helicóptero",
    "lorry":"caminhão","motorcycle":"moto","underground":"metrô","van":"van",
    # fruits
    "apple":"maçã","banana":"banana","strawberry":"morango","grape":"uva",
    "lemon":"limão","watermelon":"melancia","pineapple":"abacaxi","mango":"manga",
    "peach":"pêssego","cherry":"cereja","pear":"pera","coconut":"coco","kiwi":"kiwi",
    "blueberry":"mirtilo","raspberry":"framboesa","melon":"melão",
    # school
    "book":"livro","pen":"caneta","pencil":"lápis","ruler":"régua","bag":"mochila",
    "desk":"carteira","teacher":"professor","student":"aluno","class":"aula",
    "notebook":"caderno","eraser":"borracha","board":"lousa","school":"escola",
    "homework":"tarefa","test":"prova","lesson":"lição","map":"mapa",
    "calculator":"calculadora","library":"biblioteca","classroom":"sala de aula",
}

# Kategori tanımları: (dosya, kategori, seçilecek id listesi, max)
CATEGORIES = [
    ("food-a1.json",      "food",      ["bread","milk","egg","cheese","rice","soup","cake","coffee","tea","chicken"], 10),
    ("animals-a1.json",   "animals",   ["cat","dog","fish","bird","rabbit","horse","cow","lion","elephant","monkey"], 10),
    ("colors-a1.json",    "colors",    ["red","blue","green","yellow","orange","purple","pink","white","black","brown"], 10),
    ("numbers-a1.json",   "numbers",   ["one","two","three","four","five","six","seven","eight","nine","ten"], 10),
    ("family-a1.json",    "family",    ["mother","father","brother","sister","grandmother","grandfather","baby","family","son","daughter"], 10),
    ("body-a1.json",      "body",      ["head","eye","ear","nose","mouth","hand","foot","arm","leg","hair"], 10),
    ("home-a1.json",      "home",      ["bedroom","kitchen","door","window","chair","sofa","bed","bathroom","lamp","mirror"], 10),
    ("transport-a1.json", "transport", ["bicycle","boat","bus","car","plane","ship","taxi","train","truck"], 9),
    ("fruits-a1.json",    "fruits",    ["apple","banana","orange","strawberry","grape","lemon","watermelon","pineapple","mango","peach"], 10),
    ("school-a1.json",    "school",    ["book","pen","pencil","ruler","bag","desk","teacher","student","class","notebook","eraser"], 11),
]

result = []
uid = 1

for fname, cat, id_list, _ in CATEGORIES:
    data = load(fname)
    en_words = words_by_id(data, "en")
    es_words = words_by_id(data, "es")

    for wid in id_list:
        en_w = en_words.get(wid)
        if not en_w:
            print(f"  UYARI: {cat}/{wid} bulunamadi")
            continue
        es_w = es_words.get(wid, {})
        entry = {
            "id":       uid,
            "tr":       en_w.get("tr", ""),
            "en":       en_w.get("word", wid),
            "es":       es_w.get("word", ""),
            "pt":       PT.get(wid, ""),
            "level":    "A1",
            "category": cat,
            "emoji":    en_w.get("emoji", ""),
        }
        result.append(entry)
        uid += 1

out = r"C:\Users\Ata\Desktop\aguilangevotr\src\data\words-tr-a1.json"
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Toplam {len(result)} kelime yazildi -> {out}")
for fname, cat, ids, _ in CATEGORIES:
    count = sum(1 for r in result if r["category"] == cat)
    print(f"  {cat:<12}: {count} kelime")
