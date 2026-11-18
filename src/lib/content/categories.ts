/**
 * Single source of truth for the 15 life categories and their questions.
 *
 * The database mirrors this file (tables `life_categories` and
 * `assessment_questions`) so answers can reference questions with foreign
 * keys. After editing this file run `npm run db:generate-seed` to regenerate
 * the seed migration, then apply it with `npx supabase db push` (or
 * `npx supabase db reset` locally).
 *
 * IDs are permanent: never rename an existing id, as historical answers
 * reference it. Adding or retiring questions is fine.
 */

export type Question = {
  id: string;
  prompt: string;
  guidance: string;
  /** Optional label for a score of 1 (defaults to "Completely dissatisfied"). */
  low?: string;
  /** Optional label for a score of 10 (defaults to "Completely satisfied"). */
  high?: string;
};

export type Category = {
  id: string;
  name: string;
  shortName: string;
  icon: string; // lucide icon name (see components/category-icon.tsx)
  tagline: string;
  description: string;
  questions: Question[];
};

export const DEFAULT_LOW = "Completely dissatisfied";
export const DEFAULT_MID = "Mixed / average";
export const DEFAULT_HIGH = "Completely satisfied";

export const CATEGORIES: Category[] = [
  {
    id: "living-situation",
    name: "Living Situation",
    shortName: "Home",
    icon: "Home",
    tagline: "The place you come home to.",
    description:
      "How satisfied you are with your home: the space, cost, quality, stability and how well it fits the life you want. Renting, owning or living with family are all equally valid. Only your satisfaction counts.",
    questions: [
      {
        id: "ls-overall",
        prompt: "Overall, how satisfied are you with where you currently live?",
        guidance:
          "Think about your home as a whole: does it feel like the right place for you at this stage of life?",
      },
      {
        id: "ls-tenure",
        prompt: "How satisfied are you with your housing arrangement?",
        guidance:
          "Renting, owning, a mortgage, living with family or sharing: consider whether the arrangement suits your needs and plans, not whether it matches what others have.",
      },
      {
        id: "ls-quality",
        prompt: "How satisfied are you with the quality and condition of your home?",
        guidance:
          "Consider repairs, warmth, comfort, furnishings and how well it's maintained.",
      },
      {
        id: "ls-space",
        prompt: "How satisfied are you with the space and privacy you have?",
        guidance:
          "Do you have enough room for how you live, and somewhere to be alone when you need it?",
      },
      {
        id: "ls-cost",
        prompt: "How comfortable are you with what your housing costs you?",
        guidance:
          "Rent, mortgage, bills and upkeep. Think about whether it feels manageable and worth it, not the absolute number.",
        low: "A constant strain",
        high: "Completely comfortable",
      },
      {
        id: "ls-access",
        prompt: "How satisfied are you with your commute and access to amenities?",
        guidance:
          "Travel to work or study, shops, healthcare, gyms and the places you go regularly.",
      },
      {
        id: "ls-stability",
        prompt: "How settled and stable does your accommodation feel?",
        guidance:
          "Do you feel you can stay as long as you want, or is there uncertainty hanging over it?",
        low: "Very unsettled",
        high: "Completely settled",
      },
    ],
  },
  {
    id: "employment-career",
    name: "Employment and Career",
    shortName: "Career",
    icon: "Briefcase",
    tagline: "What you do and where it's going.",
    description:
      "How you feel about your work, whether employed, self-employed, studying, caring, retired or between roles. A senior title doesn't mean a high score, and a modest role doesn't mean a low one.",
    questions: [
      {
        id: "ec-overall",
        prompt: "Overall, how satisfied are you with your current work situation?",
        guidance:
          "This includes being employed, self-employed, a student, a carer, retired or between roles. Score how you feel about where you are.",
      },
      {
        id: "ec-fulfilment",
        prompt: "How fulfilling do you find the work you do day to day?",
        guidance:
          "Does it feel worthwhile, interesting or meaningful to you? Skip if it doesn't apply right now.",
        low: "Not at all fulfilling",
        high: "Deeply fulfilling",
      },
      {
        id: "ec-pay",
        prompt: "How satisfied are you with what you're paid for your work?",
        guidance:
          "Judge it against your own expectations and the effort you put in, not what other people earn.",
      },
      {
        id: "ec-progression",
        prompt: "How satisfied are you with your career progression so far?",
        guidance:
          "Are you moving at a pace and in a direction you're happy with? Staying put can be a perfectly good choice.",
      },
      {
        id: "ec-security",
        prompt: "How secure does your work or income source feel?",
        guidance:
          "Consider how confident you are that your role, business or income will still be there.",
        low: "Very insecure",
        high: "Completely secure",
      },
      {
        id: "ec-environment",
        prompt: "How satisfied are you with your working environment and the people you work with?",
        guidance:
          "Culture, colleagues, management, clients and the physical or remote setup you work in.",
      },
      {
        id: "ec-hours",
        prompt: "How satisfied are you with your working hours and the demands of your work?",
        guidance:
          "Is the workload and schedule sustainable, and does it leave room for the rest of your life?",
      },
      {
        id: "ec-future",
        prompt: "How confident are you in your skills and future employability?",
        guidance:
          "If you needed or wanted a new role, how well placed would you feel? Think about skills, experience and reputation.",
        low: "Not confident at all",
        high: "Completely confident",
      },
    ],
  },
  {
    id: "financial-position",
    name: "Financial Position",
    shortName: "Finances",
    icon: "Wallet",
    tagline: "Money, security and freedom.",
    description:
      "How satisfied you are with your finances relative to your own needs and goals. Someone earning less can feel far more financially content than someone earning a lot. Your standards are the only ones that count.",
    questions: [
      {
        id: "fp-overall",
        prompt: "Overall, how satisfied are you with your financial position?",
        guidance:
          "Taking everything into account, how do you feel about your money situation right now?",
      },
      {
        id: "fp-income",
        prompt: "How satisfied are you with your income?",
        guidance:
          "Does it cover what you need and want? Think about your expectations, not other people's salaries.",
      },
      {
        id: "fp-disposable",
        prompt: "How comfortable are you with what's left after essential spending?",
        guidance:
          "Once bills and essentials are paid, does what remains feel like enough for you?",
        low: "Nothing left / stressful",
        high: "Very comfortable",
      },
      {
        id: "fp-savings",
        prompt: "How satisfied are you with your savings and emergency buffer?",
        guidance:
          "If something unexpected came up, how prepared would you feel?",
      },
      {
        id: "fp-debt",
        prompt: "How comfortable do you feel about any debts or liabilities?",
        guidance:
          "Mortgages, loans, credit cards or money owed. If you have none, score how that feels. If it's manageable and planned, that may still be a high score.",
        low: "Overwhelming",
        high: "Completely comfortable",
      },
      {
        id: "fp-investments",
        prompt: "How satisfied are you with your investments and long-term savings?",
        guidance:
          "Pensions, ISAs, property or other assets. Skip if it isn't something you think about.",
      },
      {
        id: "fp-control",
        prompt: "How in control of your money do you feel?",
        guidance:
          "Do you know where your money goes, and does it go where you want it to?",
        low: "No control",
        high: "Fully in control",
      },
      {
        id: "fp-independence",
        prompt: "How satisfied are you with your progress towards financial independence?",
        guidance:
          "Whatever financial freedom means to you, whether that's retiring early, working less or simply not worrying.",
      },
    ],
  },
  {
    id: "physical-health",
    name: "Physical Health",
    shortName: "Health",
    icon: "HeartPulse",
    tagline: "How your body feels to you.",
    description:
      "Your satisfaction with your physical health, fitness and energy. Nothing here uses weight, BMI or any other measurement. A very fit person can score low and someone who rarely exercises can score high. It's how you feel about your own body and lifestyle.",
    questions: [
      {
        id: "ph-overall",
        prompt: "Overall, how satisfied are you with your physical health?",
        guidance:
          "Taking everything into account, how do you feel about your body and health right now?",
      },
      {
        id: "ph-fitness",
        prompt: "How satisfied are you with your current physical fitness?",
        guidance:
          "Consider how you feel physically, your energy levels, fitness, strength and whether you're where you personally want to be. This isn't about how you compare to anyone else.",
      },
      {
        id: "ph-energy",
        prompt: "How satisfied are you with your day-to-day energy levels?",
        guidance:
          "Do you generally have the energy to do what you want to do?",
      },
      {
        id: "ph-sleep",
        prompt: "How satisfied are you with the quality of your sleep?",
        guidance:
          "Think about how rested you feel, not just the number of hours.",
      },
      {
        id: "ph-nutrition",
        prompt: "How satisfied are you with your diet and eating habits?",
        guidance:
          "Does the way you eat feel right for you and the way you want to live?",
      },
      {
        id: "ph-body",
        prompt: "How comfortable and satisfied are you with your body?",
        guidance:
          "Your own sense of how you look and feel in your body. There's no right answer and no target.",
      },
      {
        id: "ph-conditions",
        prompt: "How satisfied are you with how any health conditions are managed?",
        guidance:
          "Including access to healthcare and treatment. Skip if this doesn't apply to you.",
      },
      {
        id: "ph-mobility",
        prompt: "How satisfied are you with your mobility and freedom from pain?",
        guidance:
          "Can you move through your day the way you'd like to?",
      },
    ],
  },
  {
    id: "mental-health",
    name: "Mental Health and Wellbeing",
    shortName: "Wellbeing",
    icon: "Brain",
    tagline: "How you feel on the inside.",
    description:
      "A personal check-in on your emotional wellbeing. This is not a diagnostic tool. If you're struggling, please talk to someone you trust or a professional.",
    questions: [
      {
        id: "mh-happiness",
        prompt: "How happy have you generally felt recently?",
        guidance:
          "Think about the last few weeks overall, not just today.",
        low: "Very unhappy",
        high: "Very happy",
      },
      {
        id: "mh-stress",
        prompt: "How well are you managing the level of stress in your life?",
        guidance:
          "Some stress is normal. Consider whether it feels manageable for you.",
        low: "Overwhelmed",
        high: "Managing very well",
      },
      {
        id: "mh-calm",
        prompt: "How calm and at ease do you usually feel?",
        guidance:
          "How often are you free from worry or anxiety getting in the way?",
        low: "Rarely at ease",
        high: "Almost always at ease",
      },
      {
        id: "mh-self-esteem",
        prompt: "How satisfied are you with your self-esteem and confidence?",
        guidance:
          "How do you feel about yourself and your ability to handle things?",
      },
      {
        id: "mh-resilience",
        prompt: "How well do you feel you bounce back from setbacks?",
        guidance:
          "When things go wrong, how able do you feel to recover and move on?",
        low: "Not at all",
        high: "Very well",
      },
      {
        id: "mh-stability",
        prompt: "How emotionally steady have you felt?",
        guidance:
          "Consider how balanced your moods have felt to you recently.",
        low: "Very unsteady",
        high: "Very steady",
      },
      {
        id: "mh-purpose",
        prompt: "How strong is your sense of purpose and direction?",
        guidance:
          "Does it feel like your life is heading somewhere that matters to you?",
        low: "No sense of purpose",
        high: "Strong sense of purpose",
      },
    ],
  },
  {
    id: "relationships-family",
    name: "Relationships and Family",
    shortName: "Relationships",
    icon: "Users",
    tagline: "The people in your life.",
    description:
      "Your satisfaction with the relationships that matter to you, whatever shape they take. Being single, child-free, or having a non-traditional family is never a lower score. Skip anything that doesn't apply.",
    questions: [
      {
        id: "rf-overall",
        prompt: "Overall, how satisfied are you with the relationships in your life?",
        guidance:
          "Think about the people who matter to you, whoever they are.",
      },
      {
        id: "rf-romantic",
        prompt: "How satisfied are you with your romantic life?",
        guidance:
          "Whether you're in a relationship, single, dating or not looking. Score how content you are with your situation, not whether you have a partner.",
      },
      {
        id: "rf-family",
        prompt: "How satisfied are you with your relationships with family?",
        guidance:
          "Parents, siblings, extended or chosen family: whoever you consider family. Skip if you prefer.",
      },
      {
        id: "rf-children",
        prompt: "How satisfied are you with family life with children?",
        guidance:
          "Only if relevant: parenting, step-parenting or being involved in children's lives. Skip otherwise; skipping has no effect on your score.",
      },
      {
        id: "rf-friendships",
        prompt: "How satisfied are you with your friendships?",
        guidance:
          "Quality matters more than quantity. Do you have the friendships you want?",
      },
      {
        id: "rf-support",
        prompt: "How supported do you feel by the people around you?",
        guidance:
          "If you needed help, practical or emotional, would there be someone there?",
        low: "Not at all supported",
        high: "Completely supported",
      },
      {
        id: "rf-social",
        prompt: "How satisfied are you with your social life and how connected you feel?",
        guidance:
          "Consider how often you see people and whether that feels like the right amount for you.",
      },
      {
        id: "rf-giving",
        prompt: "How satisfied are you with how you show up for the people you care about?",
        guidance:
          "Are you the friend, partner, family member or parent you want to be?",
      },
    ],
  },
  {
    id: "time-lifestyle",
    name: "Time and Lifestyle",
    shortName: "Time",
    icon: "Clock",
    tagline: "How your days actually feel.",
    description:
      "Your satisfaction with how you spend your time: routine, free time, hobbies and balance. More free time isn't automatically better. What matters is whether your time feels like yours.",
    questions: [
      {
        id: "tl-free-time",
        prompt: "How satisfied are you with the amount of free time you have?",
        guidance:
          "Time that's genuinely yours, after work, chores and obligations.",
      },
      {
        id: "tl-balance",
        prompt: "How satisfied are you with the balance between work and the rest of your life?",
        guidance:
          "Does the split feel right for you at this stage of life?",
      },
      {
        id: "tl-routine",
        prompt: "How satisfied are you with your daily routine?",
        guidance:
          "Does a typical day flow the way you'd like it to?",
      },
      {
        id: "tl-hobbies",
        prompt: "How satisfied are you with the time you spend on hobbies and interests?",
        guidance:
          "Whatever you enjoy doing for its own sake.",
      },
      {
        id: "tl-control",
        prompt: "How much control do you feel you have over your time?",
        guidance:
          "Can you choose how to spend most of your days?",
        low: "No control",
        high: "Complete control",
      },
      {
        id: "tl-breaks",
        prompt: "How satisfied are you with your holidays and time away from routine?",
        guidance:
          "Annual leave, breaks, travel or simply days off to recharge.",
      },
    ],
  },
  {
    id: "education-development",
    name: "Education and Personal Development",
    shortName: "Growth",
    icon: "GraduationCap",
    tagline: "Learning, skills and growth.",
    description:
      "Your satisfaction with your knowledge, skills and personal growth. Formal qualifications are optional. If you're happy with how you learn and grow, that's a high score.",
    questions: [
      {
        id: "ed-education",
        prompt: "How satisfied are you with your education and qualifications?",
        guidance:
          "Formal or informal. Judge it against what you want for yourself; lacking a degree isn't a lower score if you're content.",
      },
      {
        id: "ed-skills",
        prompt: "How satisfied are you with your practical and professional skills?",
        guidance:
          "The things you can do, from trades and crafts to technical and people skills.",
      },
      {
        id: "ed-learning",
        prompt: "How satisfied are you with how much you're learning right now?",
        guidance:
          "Books, courses, experiences, conversations, or anything that stretches you.",
      },
      {
        id: "ed-growth",
        prompt: "How satisfied are you with your personal growth over the past year?",
        guidance:
          "Do you feel you're becoming more of the person you want to be?",
      },
      {
        id: "ed-adaptability",
        prompt: "How confident are you in your ability to adapt and learn new things?",
        guidance:
          "If life changed direction, how ready would you feel to pick up what you need?",
        low: "Not confident",
        high: "Very confident",
      },
    ],
  },
  {
    id: "geographic-location",
    name: "Geographic Location",
    shortName: "Location",
    icon: "MapPin",
    tagline: "Your country, city and region.",
    description:
      "Your satisfaction with where you live on the map: the country, city or region, and the opportunities and lifestyle it offers you.",
    questions: [
      {
        id: "gl-overall",
        prompt: "How satisfied are you with the town, city or region you live in?",
        guidance:
          "Does it feel like a good place for you to be right now?",
      },
      {
        id: "gl-country",
        prompt: "How satisfied are you with living in your current country?",
        guidance:
          "Consider stability, economy, culture and how it suits the life you want.",
      },
      {
        id: "gl-opportunities",
        prompt: "How satisfied are you with the opportunities available where you live?",
        guidance:
          "Work, social life, dating, culture and activities: whatever matters to you.",
      },
      {
        id: "gl-climate-nature",
        prompt: "How satisfied are you with the climate and access to nature?",
        guidance:
          "Weather, seasons, countryside, coast and green space within reach.",
      },
      {
        id: "gl-transport",
        prompt: "How satisfied are you with transport and getting around?",
        guidance:
          "Public transport, roads, cycling and connections to other places.",
      },
      {
        id: "gl-proximity",
        prompt: "How satisfied are you with how close you are to the people who matter?",
        guidance:
          "Distance to family and friends, whether near or far suits you.",
      },
    ],
  },
  {
    id: "freedom-autonomy",
    name: "Personal Freedom and Autonomy",
    shortName: "Freedom",
    icon: "Feather",
    tagline: "Living life on your terms.",
    description:
      "How free you feel to make your own choices about your life, time, money and direction.",
    questions: [
      {
        id: "fa-decisions",
        prompt: "How free do you feel to make your own decisions about your life?",
        guidance:
          "Big and small choices: do they feel like yours to make?",
        low: "Not free at all",
        high: "Completely free",
      },
      {
        id: "fa-independence",
        prompt: "How satisfied are you with your level of independence?",
        guidance:
          "Practically, financially and emotionally, as much as you want it.",
      },
      {
        id: "fa-flexibility",
        prompt: "How free do you feel to change direction, such as a new job or location, if you wanted to?",
        guidance:
          "Consider what would hold you back, and whether that's a choice you're happy with.",
        low: "Completely stuck",
        high: "Completely free",
      },
      {
        id: "fa-obligations",
        prompt: "How satisfied are you with the balance between obligations you've chosen and ones imposed on you?",
        guidance:
          "Commitments you value can be freeing. Think about the ones you'd rather not have.",
      },
      {
        id: "fa-expression",
        prompt: "How free do you feel to be yourself and live the way you want?",
        guidance:
          "Without feeling you have to hide or conform.",
        low: "Not free at all",
        high: "Completely free",
      },
    ],
  },
  {
    id: "security-stability",
    name: "Security and Stability",
    shortName: "Security",
    icon: "ShieldCheck",
    tagline: "Feeling safe and on solid ground.",
    description:
      "How secure and stable your life feels overall. This looks at your overall sense of safety and predictability rather than repeating the detail from other categories.",
    questions: [
      {
        id: "ss-overall",
        prompt: "Overall, how secure does your life feel right now?",
        guidance:
          "Taking everything into account, do you feel on solid ground?",
        low: "Very insecure",
        high: "Completely secure",
      },
      {
        id: "ss-safety",
        prompt: "How physically safe do you feel in your daily life?",
        guidance:
          "At home, out and about, and travelling.",
        low: "Very unsafe",
        high: "Completely safe",
      },
      {
        id: "ss-protection",
        prompt: "How protected do you feel against the unexpected?",
        guidance:
          "Illness, job loss, accidents or emergencies. Think insurance, savings, support networks and plans.",
        low: "Not protected",
        high: "Very well protected",
      },
      {
        id: "ss-predictability",
        prompt: "How satisfied are you with how predictable the next year feels?",
        guidance:
          "Some people like certainty, others enjoy change. Score how comfortable the level of uncertainty feels for you.",
      },
      {
        id: "ss-loved-ones",
        prompt: "How secure do you feel about the wellbeing of the people you care about?",
        guidance:
          "Skip if you'd rather not answer.",
        low: "Very worried",
        high: "Completely at ease",
      },
    ],
  },
  {
    id: "recreation-experiences",
    name: "Recreation and Experiences",
    shortName: "Experiences",
    icon: "Sparkles",
    tagline: "Joy outside of responsibility.",
    description:
      "Your satisfaction with the fun, adventure and enjoyment in your life: whatever that looks like for you.",
    questions: [
      {
        id: "re-enjoyment",
        prompt: "How much are you enjoying life outside of your responsibilities?",
        guidance:
          "The bits of life that are just for you.",
        low: "Not at all",
        high: "Thoroughly",
      },
      {
        id: "re-travel",
        prompt: "How satisfied are you with your holidays and travel?",
        guidance:
          "Near or far, frequent or rare: does it feel like enough for you?",
      },
      {
        id: "re-activities",
        prompt: "How satisfied are you with your sports, outdoor and physical activities?",
        guidance:
          "Doing or watching, competitive or casual. Skip if it isn't your thing.",
      },
      {
        id: "re-culture",
        prompt: "How satisfied are you with your cultural and social experiences?",
        guidance:
          "Gigs, films, food, events, nights out, nights in: whatever you value.",
      },
      {
        id: "re-new",
        prompt: "How satisfied are you with how often you try new things?",
        guidance:
          "New places, experiences, adventures or challenges.",
      },
    ],
  },
  {
    id: "identity-values",
    name: "Personal Identity and Values",
    shortName: "Values",
    icon: "Compass",
    tagline: "Who you are and what you stand for.",
    description:
      "How aligned your life feels with who you are and what you believe. No particular beliefs, faith, identity or lifestyle are assumed or preferred.",
    questions: [
      {
        id: "iv-alignment",
        prompt: "How well does the way you live match your personal values?",
        guidance:
          "Whatever matters most to you. Are your daily choices in line with it?",
        low: "Not at all",
        high: "Completely",
      },
      {
        id: "iv-identity",
        prompt: "How comfortable are you with who you are?",
        guidance:
          "Your sense of identity and being at peace with yourself.",
        low: "Very uncomfortable",
        high: "Completely comfortable",
      },
      {
        id: "iv-belonging",
        prompt: "How satisfied are you with your sense of belonging?",
        guidance:
          "To a community, culture, group, faith, place or people. Whatever belonging means to you.",
      },
      {
        id: "iv-meaning",
        prompt: "How satisfied are you with the role of meaning, beliefs or spirituality in your life?",
        guidance:
          "Religious, spiritual, philosophical or none at all. Skip if it isn't relevant to you.",
      },
      {
        id: "iv-ambitions",
        prompt: "How satisfied are you with how you're living up to your own standards and ambitions?",
        guidance:
          "Your standards, not anyone else's.",
      },
    ],
  },
  {
    id: "environment-surroundings",
    name: "Environment and Surroundings",
    shortName: "Surroundings",
    icon: "Trees",
    tagline: "The world right outside your door.",
    description:
      "Your satisfaction with your immediate surroundings: neighbourhood, community, cleanliness, noise and green space.",
    questions: [
      {
        id: "es-neighbourhood",
        prompt: "How satisfied are you with your neighbourhood?",
        guidance:
          "Its feel, upkeep, safety and character.",
      },
      {
        id: "es-quiet-clean",
        prompt: "How satisfied are you with noise, air quality and cleanliness around you?",
        guidance:
          "Traffic, neighbours, litter, pollution: how does it feel day to day?",
      },
      {
        id: "es-green",
        prompt: "How satisfied are you with access to green space and nature nearby?",
        guidance:
          "Parks, gardens, trees, water: anything within easy reach.",
      },
      {
        id: "es-community",
        prompt: "How satisfied are you with your local community and services?",
        guidance:
          "Neighbours, local shops, cafés, facilities and services.",
      },
    ],
  },
  {
    id: "long-term-prospects",
    name: "Long-Term Prospects",
    shortName: "Future",
    icon: "TrendingUp",
    tagline: "Where your life is heading.",
    description:
      "How confident and satisfied you feel about the direction your life is heading over the long term.",
    questions: [
      {
        id: "lt-direction",
        prompt: "How satisfied are you with the overall direction your life is heading?",
        guidance:
          "If things carry on as they are, how do you feel about where you'll end up?",
      },
      {
        id: "lt-finances",
        prompt: "How confident are you about your long-term financial future?",
        guidance:
          "Future earnings, wealth building and financial independence, measured against your own goals.",
        low: "Not confident",
        high: "Completely confident",
      },
      {
        id: "lt-retirement",
        prompt: "How satisfied are you with your plans for later life and retirement?",
        guidance:
          "Pension, housing and lifestyle in older age. Skip if it feels too far away to judge.",
      },
      {
        id: "lt-health",
        prompt: "How confident are you about your future health?",
        guidance:
          "Do you feel your habits and circumstances set you up well?",
        low: "Not confident",
        high: "Completely confident",
      },
      {
        id: "lt-family",
        prompt: "How satisfied are you with your future plans around family and relationships?",
        guidance:
          "Whatever you hope for, including children, partnership, or neither. Skip if not relevant.",
      },
      {
        id: "lt-legacy",
        prompt: "How satisfied are you with the plans you've made for the people who depend on you?",
        guidance:
          "Wills, estate planning, opportunities for others. Skip if it doesn't apply.",
      },
    ],
  },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export const TOTAL_QUESTIONS = CATEGORIES.reduce(
  (sum, c) => sum + c.questions.length,
  0,
);

export function getCategory(id: string | null | undefined): Category | undefined {
  return id ? CATEGORY_BY_ID[id] : undefined;
}
