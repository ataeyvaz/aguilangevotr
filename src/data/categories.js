import animalsData     from './animals-a1.json'
import colorsData      from './colors-a1.json'
import numbersData     from './numbers-a1.json'
import fruitsData      from './fruits-a1.json'
import bodyData        from './body-a1.json'
import familyData      from './family-a1.json'
import schoolData      from './school-a1.json'
import foodData        from './food-a1.json'
import greetingsData   from './greetings-a1.json'
import questionsData   from './questions-a1.json'
import vegetablesData  from './vegetables-a1.json'
import clothingData    from './clothing-a1.json'
import homeData        from './home-a1.json'
import transportData   from './transport-a1.json'
import timeData        from './time-a1.json'
import jobsData        from './jobs-a1.json'
import sportsData      from './sports-a1.json'
import placesData      from './places-a1.json'
import adjectivesData  from './adjectives-a1.json'
import verbsData       from './verbs-a1.json'

export const CATEGORIES = [
  {
    id: 'animals', icon: '🐾', label: 'Hayvanlar', color: 'bg-green-100 border-green-400', data: animalsData,
    grammarNote: {
      sentences: {
        en: ['I have a dog.', 'I see a cat.'],
        de: ['Ich habe einen Hund.', 'Ich sehe eine Katze.'],
        es: ['Tengo un perro.', 'Veo un gato.'],
      },
      tip: {
        en: '"I have" ile sahipliğini, "I see" ile gördüğünü ifade edersin.',
        de: '"Ich habe" ile sahipliğini, "Ich sehe" ile gördüğünü ifade edersin.',
        es: '"Tengo" ile sahipliğini, "Veo" ile gördüğünü ifade edersin.',
      },
    },
  },
  {
    id: 'colors', icon: '🎨', label: 'Renkler', color: 'bg-pink-100 border-pink-400', data: colorsData,
    grammarNote: {
      sentences: {
        en: ['The sky is blue.', 'My bag is red.'],
        de: ['Der Himmel ist blau.', 'Meine Tasche ist rot.'],
        es: ['El cielo es azul.', 'Mi bolsa es roja.'],
      },
      tip: {
        en: '"The/My ... is + renk" kalıbıyla renk tanımlaması yaparsın.',
        de: '"Der/Die/Das ... ist + renk" kalıbıyla renk tanımlaması yaparsın.',
        es: '"El/La ... es + renk" kalıbıyla renk tanımlaması yaparsın.',
      },
    },
  },
  {
    id: 'numbers', icon: '🔢', label: 'Sayılar', color: 'bg-blue-100 border-blue-400', data: numbersData,
    grammarNote: {
      sentences: {
        en: ['I have two cats.', 'There are five books.'],
        de: ['Ich habe zwei Katzen.', 'Es gibt fünf Bücher.'],
        es: ['Tengo dos gatos.', 'Hay cinco libros.'],
      },
      tip: {
        en: '"I have + sayı" ile kaç tane olduğunu, "There are + sayı" ile sayı belirtirsin.',
        de: '"Ich habe + sayı" ile kaç tane olduğunu, "Es gibt + sayı" ile sayı belirtirsin.',
        es: '"Tengo + sayı" ile kaç tane olduğunu, "Hay + sayı" ile sayı belirtirsin.',
      },
    },
  },
  {
    id: 'fruits', icon: '🍎', label: 'Meyveler', color: 'bg-red-100 border-red-400', data: fruitsData,
    grammarNote: {
      sentences: {
        en: ['I eat an apple.', 'She likes oranges.'],
        de: ['Ich esse einen Apfel.', 'Sie mag Orangen.'],
        es: ['Como una manzana.', 'A ella le gustan las naranjas.'],
      },
      tip: {
        en: 'Tekil meyve için "a/an", çoğul için "-s" ekini kullanırsın.',
        de: 'Tekil için belirsiz artikel "ein/eine", çoğul için "-n/-en" ekini kullanırsın.',
        es: 'Tekil için "un/una", çoğul için "-s" ekini kullanırsın.',
      },
    },
  },
  {
    id: 'vegetables', icon: '🥕', label: 'Sebzeler', color: 'bg-lime-100 border-lime-400', data: vegetablesData,
    grammarNote: {
      sentences: {
        en: ['I like carrots.', 'We eat vegetables every day.'],
        de: ['Ich mag Karotten.', 'Wir essen jeden Tag Gemüse.'],
        es: ['Me gustan las zanahorias.', 'Comemos verduras todos los días.'],
      },
        tip: {
          en: 'Use "I like + plural noun" to express what you like.',
          de: 'Use "Ich mag + plural noun" to express what you like.',
          es: 'Use "Me gustan + plural noun" to express what you like.',
        },
    },
  },
  {
    id: 'body', icon: '🫀', label: 'Vücut', color: 'bg-orange-100 border-orange-400', data: bodyData,
    grammarNote: {
      sentences: {
        en: ['I have two eyes.', 'My hands are small.'],
        de: ['Ich habe zwei Augen.', 'Meine Hände sind klein.'],
        es: ['Tengo dos ojos.', 'Mis manos son pequeñas.'],
      },
      tip: {
        en: '"I have" ile vücudunu tanımla, "My ... is/are" ile özellik belirt.',
        de: '"Ich habe" ile vücudunu tanımla, "Meine ... ist/sind" ile özellik belirt.',
        es: '"Tengo" ile vücudunu tanımla, "Mis ... son" ile özellik belirt.',
      },
    },
  },
  {
    id: 'family', icon: '👨‍👩‍👧', label: 'Aile', color: 'bg-purple-100 border-purple-400', data: familyData,
    grammarNote: {
      sentences: {
        en: ['I have a sister.', 'My mother is kind.'],
        de: ['Ich habe eine Schwester.', 'Meine Mutter ist freundlich.'],
        es: ['Tengo una hermana.', 'Mi madre es amable.'],
      },
      tip: {
        en: '"My + aile üyesi + is" kalıbıyla aile bireylerini tanıtırsın.',
        de: '"Mein/Meine + aile üyesi + ist" kalıbıyla aile bireylerini tanıtırsın.',
        es: '"Mi + aile üyesi + es" kalıbıyla aile bireylerini tanıtırsın.',
      },
    },
  },
  {
    id: 'school', icon: '🏫', label: 'Okul', color: 'bg-yellow-100 border-yellow-400', data: schoolData,
    grammarNote: {
      sentences: {
        en: ['I go to school every day.', 'I have a pencil.'],
        de: ['Ich gehe jeden Tag zur Schule.', 'Ich habe einen Bleistift.'],
        es: ['Voy a la escuela todos los días.', 'Tengo un lápiz.'],
      },
      tip: {
        en: '"I go to + yer" ile nereye gittiğini, "I have" ile ne taşıdığını söylersin.',
        de: '"Ich gehe + in die/zur + yer" ile nereye gittiğini, "Ich habe" ile ne taşıdığını söylersin.',
        es: '"Voy a + yer" ile nereye gittiğini, "Tengo" ile ne taşıdığını söylersin.',
      },
    },
  },
  {
    id: 'food', icon: '🍕', label: 'Yiyecekler', color: 'bg-amber-100 border-amber-400', data: foodData,
    grammarNote: {
      sentences: {
        en: ['I eat pizza for lunch.', 'She drinks water.'],
        de: ['Ich esse Pizza zum Mittagessen.', 'Sie trinkt Wasser.'],
        es: ['Como pizza para el almuerzo.', 'Ella bebe agua.'],
      },
      tip: {
        en: '"I eat / I drink" kalıplarıyla ne yiyip içtiğini anlatırsın.',
        de: '"Ich esse / Ich trinke" kalıplarıyla ne yiyip içtiğini anlatırsın.',
        es: '"Como / Bebo" kalıplarıyla ne yiyip içtiğini anlatırsın.',
      },
    },
  },
  {
    id: 'greetings', icon: '👋', label: 'Greetings', color: 'bg-teal-100 border-teal-400', data: greetingsData,
    grammarNote: {
      sentences: {
        en: ['Hello! How are you?', 'I am fine, thank you.'],
        de: ['Hallo! Wie geht es dir?', 'Mir geht es gut, danke.'],
        es: ['¡Hola! ¿Cómo estás?', 'Estoy bien, gracias.'],
      },
      tip: {
        en: '"How are you?" sorusuna "I am fine / I am good" ile yanıt verirsin.',
        de: '"Wie geht es dir?" sorusuna "Mir geht es gut" ile yanıt verirsin.',
        es: '"¿Cómo estás?" sorusuna "Estoy bien" ile yanıt verirsin.',
      },
    },
  },
  {
    id: 'questions', icon: '❓', label: 'Sorular', color: 'bg-indigo-100 border-indigo-400', data: questionsData,
    grammarNote: {
      sentences: {
        en: ['What is this?', 'Where are you?'],
        de: ['Was ist das?', 'Wo bist du?'],
        es: ['¿Qué es esto?', '¿Dónde estás?'],
      },
      tip: {
        en: 'Soru kelimeleri (What, Where, Who) cümlenin başına gelir.',
        de: 'Soru kelimeleri (Was, Wo, Wer) cümlenin başına gelir.',
        es: 'Soru kelimeleri (¿Qué?, ¿Dónde?, ¿Quién?) cümlenin başına gelir.',
      },
    },
  },
  {
    id: 'clothing', icon: '👗', label: 'Kıyafetler', color: 'bg-violet-100 border-violet-400', data: clothingData,
    grammarNote: {
      sentences: {
        en: ['I wear a blue shirt.', 'She has a red dress.'],
        de: ['Ich trage ein blaues Hemd.', 'Sie hat ein rotes Kleid.'],
        es: ['Llevo una camisa azul.', 'Ella tiene un vestido rojo.'],
      },
      tip: {
        en: '"I wear" ile ne giydiğini, "I have" ile ne sahip olduğunu söylersin.',
        de: '"Ich trage" ile ne giydiğini, "Ich habe" ile ne sahip olduğunu söylersin.',
        es: '"Llevo" ile ne giydiğini, "Tengo" ile ne sahip olduğunu söylersin.',
      },
    },
  },
  {
    id: 'home', icon: '🏠', label: 'Ev', color: 'bg-stone-100 border-stone-400', data: homeData,
    grammarNote: {
      sentences: {
        en: ['I live in a house.', 'There is a table in the kitchen.'],
        de: ['Ich wohne in einem Haus.', 'In der Küche steht ein Tisch.'],
        es: ['Vivo en una casa.', 'Hay una mesa en la cocina.'],
      },
      tip: {
        en: '"There is/are" kalıbıyla bir yerde ne olduğunu anlatırsın.',
        de: '"Es gibt" kalıbıyla bir yerde ne olduğunu anlatırsın.',
        es: '"Hay" kalıbıyla bir yerde ne olduğunu anlatırsın.',
      },
    },
  },
  {
    id: 'transport', icon: '🚗', label: 'Ulaşım', color: 'bg-sky-100 border-sky-400', data: transportData,
    grammarNote: {
      sentences: {
        en: ['I take the bus to school.', 'She drives a car.'],
        de: ['Ich nehme den Bus zur Schule.', 'Sie fährt ein Auto.'],
        es: ['Tomo el autobús para ir al colegio.', 'Ella conduce un coche.'],
      },
      tip: {
        en: '"I take the + taşıt" ile toplu taşıma, "I drive" ile araç kullanmayı ifade edersin.',
        de: '"Ich nehme den/die + taşıt" ile toplu taşıma, "Ich fahre" ile araç kullanmayı ifade edersin.',
        es: '"Tomo el/la + taşıt" ile toplu taşıma, "Conduzco" ile araç kullanmayı ifade edersin.',
      },
    },
  },
  {
    id: 'time', icon: '⏰', label: 'Zaman', color: 'bg-cyan-100 border-cyan-400', data: timeData,
    grammarNote: {
      sentences: {
        en: ["It is seven o'clock.", 'Today is Monday.'],
        de: ['Es ist sieben Uhr.', 'Heute ist Montag.'],
        es: ['Son las siete.', 'Hoy es lunes.'],
      },
      tip: {
        en: '"It is + saat" ile saati, "Today is + gün" ile günü söylersin.',
        de: '"Es ist + saat Uhr" ile saati, "Heute ist + gün" ile günü söylersin.',
        es: '"Son las + saat" ile saati, "Hoy es + gün" ile günü söylersin.',
      },
    },
  },
  {
    id: 'jobs', icon: '👷', label: 'Meslekler', color: 'bg-emerald-100 border-emerald-400', data: jobsData,
    grammarNote: {
      sentences: {
        en: ['He is a doctor.', 'She is a teacher.'],
        de: ['Er ist Arzt.', 'Sie ist Lehrerin.'],
        es: ['Él es médico.', 'Ella es profesora.'],
      },
      tip: {
        en: '"He/She is a + meslek" kalıbıyla başkasının mesleğini anlatırsın.',
        de: '"Er/Sie ist + meslek" kalıbıyla başkasının mesleğini anlatırsın (artikel kullanılmaz).',
        es: '"Él/Ella es + meslek" kalıbıyla başkasının mesleğini anlatırsın (artikel kullanılmaz).',
      },
    },
  },
  {
    id: 'sports', icon: '⚽', label: 'Sporlar', color: 'bg-rose-100 border-rose-400', data: sportsData,
    grammarNote: {
      sentences: {
        en: ['I play football.', 'She swims every day.'],
        de: ['Ich spiele Fußball.', 'Sie schwimmt jeden Tag.'],
        es: ['Juego al fútbol.', 'Ella nada todos los días.'],
      },
      tip: {
        en: '"I play + spor" ile takım sporları, "I swim/run" ile bireysel sporları ifade edersin.',
        de: '"Ich spiele + spor" ile takım sporları, "Ich schwimme/laufe" ile bireysel sporları ifade edersin.',
        es: '"Juego al + spor" ile takım sporları, "Nado/Corro" ile bireysel sporları ifade edersin.',
      },
    },
  },
  {
    id: 'places', icon: '🏙️', label: 'Yerler', color: 'bg-fuchsia-100 border-fuchsia-400', data: placesData,
    grammarNote: {
      sentences: {
        en: ['I go to the park.', 'She is at school.'],
        de: ['Ich gehe in den Park.', 'Sie ist in der Schule.'],
        es: ['Voy al parque.', 'Ella está en la escuela.'],
      },
      tip: {
        en: '"I go to the + yer" ile gidişi, "I am at the + yer" ile bulunduğun yeri söylersin.',
        de: '"Ich gehe in + yer" ile gidişi, "Ich bin in + yer" ile bulunduğun yeri söylersin.',
        es: '"Voy a + yer" ile gidişi, "Estoy en + yer" ile bulunduğun yeri söylersin.',
      },
    },
  },
  {
    id: 'adjectives', icon: '🌈', label: 'Sıfatlar', color: 'bg-orange-100 border-orange-400', data: adjectivesData,
    grammarNote: {
      sentences: {
        en: ['The cat is small.', 'My room is clean and bright.'],
        de: ['Die Katze ist klein.', 'Mein Zimmer ist sauber und hell.'],
        es: ['El gato es pequeño.', 'Mi habitación es limpia y luminosa.'],
      },
      tip: {
        en: 'Sıfatlar isimden önce veya "is/are" sonrası gelir: "a small cat" ya da "the cat is small".',
        de: 'Sıfatlar isimden önce çekimlenir (kleiner Hund) veya "ist" sonrası gelir (der Hund ist klein).',
        es: 'Sıfatlar genellikle isimden sonra gelir: "un gato pequeño" ya da "el gato es pequeño".',
      },
    },
  },
  {
    id: 'verbs', icon: '⚡', label: 'Fiiller', color: 'bg-red-100 border-red-400', data: verbsData,
    grammarNote: {
      sentences: {
        en: ['I run fast every morning.', 'She reads a book at night.'],
        de: ['Ich laufe jeden Morgen schnell.', 'Sie liest nachts ein Buch.'],
        es: ['Corro rápido todas las mañanas.', 'Ella lee un libro por la noche.'],
      },
      tip: {
        en: 'Simple Present\'ta "I/You/We/They + fiil", "He/She/It + fiil + s" kullanırsın.',
        de: 'Geniş zamanda "ich laufe / du läufst / er läuft" gibi fiil çekimleri değişir.',
        es: 'Geniş zamanda "yo corro / tú corres / él corre" gibi fiil çekimleri değişir.',
      },
    },
  },
]

export function getCategoryData(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId)?.data ?? animalsData
}
