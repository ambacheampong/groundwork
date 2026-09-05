// Dynamic, language-aware notification greetings.

export type AppLanguage = "en" | "fr" | "es" | "pt" | "sw" | "ar" | "tw";

export const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "sw", label: "Kiswahili" },
  { code: "ar", label: "العربية" },
  { code: "tw", label: "Twi" },
];

type Slots = { morning: string; afternoon: string; evening: string; night: string };

const GREETINGS: Record<AppLanguage, Slots> = {
  en: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Still up",
  },
  fr: {
    morning: "Bonjour",
    afternoon: "Bon après-midi",
    evening: "Bonsoir",
    night: "Encore debout",
  },
  es: {
    morning: "Buenos días",
    afternoon: "Buenas tardes",
    evening: "Buenas noches",
    night: "Aún despierto",
  },
  pt: {
    morning: "Bom dia",
    afternoon: "Boa tarde",
    evening: "Boa noite",
    night: "Ainda acordado",
  },
  sw: {
    morning: "Habari ya asubuhi",
    afternoon: "Habari ya mchana",
    evening: "Habari ya jioni",
    night: "Bado macho",
  },
  ar: {
    morning: "صباح الخير",
    afternoon: "مساء الخير",
    evening: "مساء الخير",
    night: "ما زلت مستيقظًا",
  },
  tw: {
    morning: "Maakye",
    afternoon: "Maaha",
    evening: "Maadwo",
    night: "Wo nnae",
  },
};

const CLOSERS: Record<AppLanguage, string[]> = {
  en: [
    "What are you working on today?",
    "New opportunities just dropped.",
    "Guess who's back.",
    "Something opened that fits you.",
    "Deadlines don't wait. You know this.",
    "Two minutes of scrolling, possibly a whole year changed.",
    "Your feed refreshed while you weren't looking.",
    "A quiet nudge, nothing more.",
  ],
  fr: [
    "Sur quoi travaillez-vous aujourd'hui ?",
    "De nouvelles opportunités viennent d'arriver.",
    "Devinez qui est de retour.",
    "Quelque chose s'est ouvert pour vous.",
    "Les délais n'attendent pas.",
    "Votre fil s'est actualisé.",
  ],
  es: [
    "¿En qué trabajas hoy?",
    "Acaban de llegar nuevas oportunidades.",
    "Adivina quién ha vuelto.",
    "Se abrió algo que te encaja.",
    "Los plazos no esperan.",
    "Tu feed se actualizó.",
  ],
  pt: [
    "No que está a trabalhar hoje?",
    "Chegaram novas oportunidades.",
    "Adivinhe quem voltou.",
    "Abriu algo com a sua cara.",
    "Os prazos não esperam.",
    "O seu feed foi atualizado.",
  ],
  sw: [
    "Unafanya nini leo?",
    "Fursa mpya zimeingia.",
    "Nani amerudi?",
    "Kuna nafasi inayokufaa.",
    "Muda wa mwisho hausubiri.",
    "Feed yako imesasishwa.",
  ],
  ar: [
    "على ماذا تعمل اليوم؟",
    "وصلت فرص جديدة.",
    "خمّن من عاد.",
    "هناك فرصة تناسبك.",
    "المواعيد النهائية لا تنتظر.",
    "تم تحديث خلاصتك.",
  ],
  tw: [
    "Ɛdeɛn na woreyɛ ɛnnɛ?",
    "Akwannya foforɔ aba.",
    "Hwan na wasan aba?",
    "Biribi a ɛfata wo abue.",
    "Berɛ nntwɛn obiara.",
    "Wo feed no asesa.",
  ],
};

export function timeSlot(date = new Date(), offsetHours = 0): keyof Slots {
  const h = (date.getUTCHours() + offsetHours + 24) % 24;
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 22) return "evening";
  return "night";
}

export function pickFrom<T>(list: T[], seed?: number): T {
  const i =
    seed === undefined
      ? Math.floor(Math.random() * list.length)
      : Math.abs(seed) % list.length;
  return list[i]!;
}

export function buildGreeting(opts: {
  language?: string | null;
  name?: string | null;
  date?: Date;
  offsetHours?: number;
  seed?: number;
}): { title: string; body: string } {
  const lang = (
    opts.language && opts.language in GREETINGS ? opts.language : "en"
  ) as AppLanguage;
  const slot = timeSlot(opts.date ?? new Date(), opts.offsetHours ?? 0);
  const hello = GREETINGS[lang][slot];
  const name = (opts.name ?? "").trim();
  const title = name ? `${hello}, ${name}` : hello;
  const body = pickFrom(CLOSERS[lang], opts.seed);
  return { title, body };
}

const WELCOME: Record<string, string> = {
  en: "Welcome to Groundwork. Your feed is set up — go and find something worth applying to.",
  fr: "Bienvenue sur Groundwork. Votre fil est prêt.",
  es: "Bienvenido a Groundwork. Tu feed está listo.",
  pt: "Bem-vindo ao Groundwork. O seu feed está pronto.",
  sw: "Karibu Groundwork. Feed yako iko tayari.",
  ar: "مرحبًا بك في Groundwork. خلاصتك جاهزة.",
  tw: "Akwaaba Groundwork. Wo feed no asiesie.",
};

export function welcomeBody(language?: string | null): string {
  return WELCOME[language ?? "en"] ?? WELCOME["en"]!;
}
