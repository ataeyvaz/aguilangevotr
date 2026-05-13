import json

words = [
    "be", "have", "do", "say", "get", "make", "know", "think", "see", "come",
    "want", "look", "use", "find", "tell", "call", "try", "ask", "need", "feel",
    "become", "leave", "put", "mean", "keep", "let", "begin", "show", "hear",
    "believe", "hold", "bring", "write", "sit", "stand", "lose", "pay", "meet"
]

spanish_verbs = {
    "be": "ser/estar", "have": "tener", "do": "hacer", "say": "decir", "get": "obtener",
    "make": "hacer", "know": "saber/conocer", "think": "pensar", "see": "ver", "come": "venir",
    "want": "querer", "look": "mirar", "use": "usar", "find": "encontrar", "tell": "contar",
    "call": "llamar", "try": "intentar", "ask": "preguntar", "need": "necesitar", "feel": "sentir",
    "become": "llegar a ser", "leave": "salir/dejar", "put": "poner", "mean": "significar", "keep": "mantener",
    "let": "dejar (permitir)", "begin": "empezar", "show": "mostrar", "hear": "oír", "believe": "creer",
    "hold": "sostener", "bring": "traer", "write": "escribir", "sit": "sentarse", "stand": "estar de pie",
    "lose": "perder", "pay": "pagar", "meet": "conocer/encontrar"
}

spanish_tu = {
    "be": "eres/estás", "have": "tienes", "do": "haces", "say": "dices", "get": "obtienes",
    "make": "haces", "know": "sabes/conoces", "think": "piensas", "see": "ves", "come": "vienes",
    "want": "quieres", "look": "miras", "use": "usas", "find": "encuentras", "tell": "cuentas",
    "call": "llamas", "try": "intentas", "ask": "preguntas", "need": "necesitas", "feel": "sientes",
    "become": "llegas a ser", "leave": "sales/dejas", "put": "pones", "mean": "significas", "keep": "mantienes",
    "let": "dejas (permites)", "begin": "empiezas", "show": "muestras", "hear": "oyes", "believe": "crees",
    "hold": "sostienes", "bring": "traes", "write": "escribes", "sit": "te sientas", "stand": "estás de pie",
    "lose": "pierdes", "pay": "pagas", "meet": "conoces/encontrás"
}

easy_correct = {
    "be": "Yes, I am happy.", "have": "Yes, I have a car.", "do": "Yes, I do my homework.",
    "say": "Yes, I say hello.", "get": "Yes, I get gifts.", "make": "Yes, I make friends.",
    "know": "Yes, I know the answer.", "think": "Yes, I think about school.", "see": "Yes, I see movies.",
    "come": "Yes, I come to parties.", "want": "Yes, I want toys.", "look": "Yes, I look at photos.",
    "use": "Yes, I use a pencil.", "find": "Yes, I find keys.", "tell": "Yes, I tell stories.",
    "call": "Yes, I call friends.", "try": "Yes, I try new food.", "ask": "Yes, I ask questions.",
    "need": "Yes, I need help.", "feel": "Yes, I feel happy.", "become": "Yes, I become a student.",
    "leave": "Yes, I leave home.", "put": "Yes, I put books away.", "mean": "Yes, I know the meaning.",
    "keep": "Yes, I keep secrets.", "let": "Yes, I let friends in.", "begin": "Yes, I begin class.",
    "show": "Yes, I show photos.", "hear": "Yes, I hear music.", "believe": "Yes, I believe in myself.",
    "hold": "Yes, I hold a book.", "bring": "Yes, I bring lunch.", "write": "Yes, I write a letter.",
    "sit": "Yes, I sit in class.", "stand": "Yes, I stand in line.", "lose": "Yes, I lose a toy.",
    "pay": "Yes, I pay for food.", "meet": "Yes, I meet new people."
}

def generate_easy(w):
    s_inf = spanish_verbs[w]
    s_tu = spanish_tu[w]
    c = easy_correct[w]
    return {
        "word": w, "level": "a1", "difficulty": "easy", "context": f"{w.capitalize()} basics", "bot_language": "es",
        "exchanges": [
            {
                "bot": f"¿{s_tu.capitalize()} tú?",
                "options": [c, "No, I prefer sleeping.", f"I {w} on the moon.", f"I eat {w}."],
                "correct": 0, "points": 10,
                "feedback_correct": f"¡Muy bien! '{w}' means {s_inf}.",
                "feedback_wrong": f"The answer is: {c}"
            },
            {
                "bot": f"What do you {w}?",
                "options": [f"I {w} every day.", f"I {w} every day in the refrigerator.", f"I {w} every day when I sleep.", f"I {w} every day with my car."],
                "correct": 0, "points": 10,
                "feedback_correct": "¡Perfecto! Every day es todos los días.",
                "feedback_wrong": f"The answer is: I {w} every day."
            },
            {
                "bot": f"¿A qué hora {s_tu}?",
                "options": [f"I {w} in the morning.", f"I {w} in the morning inside the oven.", f"I {w} in the morning in my sleep.", f"I {w} in the morning on the ceiling."],
                "correct": 0, "points": 10,
                "feedback_correct": "¡Excelente! In the morning es por la mañana.",
                "feedback_wrong": f"The answer is: I {w} in the morning."
            }
        ]
    }

def generate_medium(w):
    s_inf = spanish_verbs[w]
    s_tu = spanish_tu[w]
    past_tense = {
        "be": "was", "have": "had", "do": "did", "say": "said", "get": "got",
        "make": "made", "know": "knew", "think": "thought", "see": "saw", "come": "came",
        "want": "wanted", "look": "looked", "use": "used", "find": "found", "tell": "told",
        "call": "called", "try": "tried", "ask": "asked", "need": "needed", "feel": "felt",
        "become": "became", "leave": "left", "put": "put", "mean": "meant", "keep": "kept",
        "let": "let", "begin": "began", "show": "showed", "hear": "heard", "believe": "believed",
        "hold": "held", "bring": "brought", "write": "wrote", "sit": "sat", "stand": "stood",
        "lose": "lost", "pay": "paid", "meet": "met"
    }[w]
    return {
        "word": w, "level": "a2", "difficulty": "medium", "context": f"Past {w} experiences", "bot_language": "es",
        "exchanges": [
            {
                "bot": f"¿Cuándo {s_tu} ayer?",
                "options": [f"I {past_tense} yesterday.", f"I {w} yesterday.", f"I have {past_tense} yesterday.", f"I am {w}ing yesterday."],
                "correct": 0, "points": 10,
                "feedback_correct": f"¡Correcto! '{past_tense}' es el pasado de '{w}'.",
                "feedback_wrong": f"The answer is: I {past_tense} yesterday."
            },
            {
                "bot": f"Have you ever {past_tense} something?",
                "options": [f"Yes, I have {past_tense} something.", f"Yes, I {past_tense} yesterday.", f"No, I never {w}ing.", f"No, I don't like it because I sleep."],
                "correct": 0, "points": 10,
                "feedback_correct": "¡Genial! Present perfect para experiencias.",
                "feedback_wrong": f"The answer is: Yes, I have {past_tense} something."
            },
            {
                "bot": f"¿Qué hacías cuando {s_tu}?",
                "options": [f"I played when I {past_tense}.", "I sleep when I did it.", "I eat a big meal when I did it.", "I watch TV when I did it."],
                "correct": 0, "points": 10,
                "feedback_correct": "¡Muy bien! Played es jugaba.",
                "feedback_wrong": f"The answer is: I played when I {past_tense}."
            }
        ]
    }

def generate_hard(w):
    idioms = {
        "be": ("be on cloud nine", "estar en las nubes (muy feliz)"),
        "have": ("have a lot on my plate", "tener mucho trabajo"),
        "do": ("do it yourself", "hazlo tú mismo"),
        "say": ("say what's on your mind", "di lo que piensas"),
        "get": ("get cold feet", "ponerse nervioso"),
        "make": ("make a difference", "marcar la diferencia"),
        "know": ("know the ropes", "saber cómo funciona"),
        "think": ("think outside the box", "pensar de forma creativa"),
        "see": ("see eye to eye", "estar de acuerdo"),
        "come": ("come to terms with", "aceptar"),
        "want": ("want it all", "quererlo todo"),
        "look": ("look on the bright side", "ver el lado positivo"),
        "use": ("use your head", "usa la cabeza"),
        "find": ("find your feet", "adaptarse"),
        "tell": ("tell it like it is", "decir las cosas como son"),
        "call": ("call it a day", "terminar el trabajo"),
        "try": ("try your luck", "probar suerte"),
        "ask": ("ask for the moon", "pedir imposibles"),
        "need": ("needless to say", "sobra decir"),
        "feel": ("feel under the weather", "sentirse mal"),
        "become": ("become second nature", "ser algo natural"),
        "leave": ("leave no stone unturned", "no dejar piedra sin mover"),
        "put": ("put your foot in it", "meter la pata"),
        "mean": ("mean what you say", "decir lo que se siente"),
        "keep": ("keep your chin up", "mantener la moral alta"),
        "let": ("let the cat out of the bag", "revelar un secreto"),
        "begin": ("beginner's luck", "suerte de principiante"),
        "show": ("show your true colors", "mostrar tu verdadera cara"),
        "hear": ("hear it through the grapevine", "oír rumores"),
        "believe": ("believe it or not", "créelo o no"),
        "hold": ("hold your horses", "ten paciencia"),
        "bring": ("bring home the bacon", "ganar el pan"),
        "write": ("write it off", "descartarlo"),
        "sit": ("sit on the fence", "no decidirse"),
        "stand": ("stand your ground", "mantener tu posición"),
        "lose": ("lose your mind", "volverse loco"),
        "pay": ("pay through the nose", "pagar caro"),
        "meet": ("meet halfway", "llegar a un acuerdo")
    }
    idiom, idiom_es = idioms[w]
    return {
        "word": w, "level": "b1", "difficulty": "hard", "context": f"Idioms with '{w}'", "bot_language": "es",
        "exchanges": [
            {
                "bot": f"I {idiom}, but I have problems. What should I do?",
                "options": ["You should solve the problems.", f"You should {idiom} on the moon.", "You should stop and start sleeping.", "You should eat it."],
                "correct": 0, "points": 10,
                "feedback_correct": f"¡Excelente! '{idiom}' means {idiom_es}.",
                "feedback_wrong": "The answer is: You should solve the problems."
            },
            {
                "bot": f"¿Has oído '{idiom}'?",
                "options": [f"Yes, it means {idiom_es}.", f"Yes, it means {idiom} literally.", "No, but I know another idiom.", "No, I prefer action."],
                "correct": 0, "points": 10,
                "feedback_correct": "¡Perfecto! Es una expresión común.",
                "feedback_wrong": f"The answer is: Yes, it means {idiom_es}."
            },
            {
                "bot": f"The team {w}s it, but we need to work hard.",
                "options": [f"That means the team does it.", "That means the team is doing us.", "That means the team is sleeping.", "That means we should eat it."],
                "correct": 0, "points": 10,
                "feedback_correct": f"¡Increíble! '{w}' en este contexto significa lo mismo.",
                "feedback_wrong": "The answer is: That means the team does it."
            }
        ]
    }

all_entries = []
for w in words:
    all_entries.append(generate_easy(w))
    all_entries.append(generate_medium(w))
    all_entries.append(generate_hard(w))

with open("conversation_pack_missing.json", "w", encoding="utf-8") as f:
    json.dump(all_entries, f, ensure_ascii=False, indent=2)

print("Generated conversation_pack_missing.json")