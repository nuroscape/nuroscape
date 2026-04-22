// ─── Types ────────────────────────────────────────────────────────────────

export type QuestionCategory =
  | "inattention"
  | "hyperactivity"
  | "emotional_regulation"
  | "executive_functions"
  | "daily_impact";

export type Question = {
  id: string;
  text: string;
  category: QuestionCategory;
  /** Multiplier applied to the raw response value (0–3). Default 1. */
  weight: number;
  /** Display order in the quiz (1–28). */
  order: number;
};

export type CategoryScores = {
  inattention: number;
  hyperactivity: number;
  emotional_regulation: number;
  executive_functions: number;
  daily_impact: number;
  global: number;
};

export type ScoresWithContext = {
  scores: {
    inattention:          { raw: number; max: number; percent: number };
    hyperactivity:        { raw: number; max: number; percent: number };
    emotional_regulation: { raw: number; max: number; percent: number };
    executive_functions:  { raw: number; max: number; percent: number };
    daily_impact:         { raw: number; max: number; percent: number };
    global:               { raw: number; max: number; percent: number };
  };
  responses: Record<string, number>;
  questions: Question[];
};

export type ScoresJson = ScoresWithContext["scores"];

// ─── Metadata ─────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  inattention:          "Inattention",
  hyperactivity:        "Hyperactivité · Impulsivité",
  emotional_regulation: "Régulation émotionnelle",
  executive_functions:  "Fonctions exécutives",
  daily_impact:         "Impact quotidien",
};

/** Maximum raw score per category (questions × 3). */
export const CATEGORY_MAX: Record<QuestionCategory, number> = {
  inattention:          27, // 9 × 3
  hyperactivity:        27, // 9 × 3
  emotional_regulation:  9, // 3 × 3
  executive_functions:   9, // 3 × 3
  daily_impact:         12, // 4 × 3
};

export const GLOBAL_MAX = Object.values(CATEGORY_MAX).reduce((a, b) => a + b, 0); // 84

// ─── Questions ────────────────────────────────────────────────────────────
//
// Ordering strategy:
//   Phase 1 (1–8)   — ASRS warm-up: short, concrete, high identification rate
//   Phase 2 (9–22)  — Mixed ASRS + complémentaires (emotion, exec, alternated)
//   Phase 3 (23–28) — Impact quotidien + introspective (peak resonance before paywall)

export const QUESTIONS: Question[] = [
  // ── INATTENTION (9) ───────────────────────────────────────────────────
  // Phase 1
  { id: "ia_1", order: 1,  category: "inattention", weight: 1,
    text: "Vous avez du mal à prêter attention aux détails ou vous faites des erreurs par inattention dans vos tâches." },
  { id: "ia_2", order: 3,  category: "inattention", weight: 1,
    text: "Vous avez du mal à maintenir votre attention sur une tâche ou une activité." },
  { id: "ia_3", order: 5,  category: "inattention", weight: 1,
    text: "Vous perdez souvent des objets nécessaires à votre travail ou à vos activités." },
  { id: "ia_4", order: 7,  category: "inattention", weight: 1,
    text: "Vous êtes facilement distrait(e) par des stimuli sans lien avec ce que vous faites." },
  // Phase 2
  { id: "ia_5", order: 9,  category: "inattention", weight: 1,
    text: "Vous semblez ne pas écouter quand on vous parle directement, même sans distraction évidente." },
  { id: "ia_6", order: 12, category: "inattention", weight: 1,
    text: "Vous ne terminez pas ce que vous commencez : tâches, projets ou obligations professionnelles." },
  { id: "ia_7", order: 15, category: "inattention", weight: 1,
    text: "Vous avez du mal à organiser vos tâches et activités dans le temps." },
  { id: "ia_8", order: 18, category: "inattention", weight: 1,
    text: "Vous évitez ou remettez à plus tard les tâches qui demandent un effort mental soutenu." },
  { id: "ia_9", order: 21, category: "inattention", weight: 1,
    text: "Vous oubliez régulièrement des rendez-vous, des engagements ou des tâches du quotidien." },

  // ── HYPERACTIVITÉ / IMPULSIVITÉ (9) ───────────────────────────────────
  // Phase 1
  { id: "ha_1", order: 2,  category: "hyperactivity", weight: 1,
    text: "Vous remuez les mains ou les pieds, ou vous frétillez sur votre siège." },
  { id: "ha_2", order: 4,  category: "hyperactivity", weight: 1,
    text: "Vous parlez beaucoup, parfois sans pouvoir vous arrêter même quand ce n'est pas le bon moment." },
  { id: "ha_3", order: 6,  category: "hyperactivity", weight: 1,
    text: "Vous avez du mal à attendre votre tour dans une conversation ou une file d'attente." },
  { id: "ha_4", order: 8,  category: "hyperactivity", weight: 1,
    text: "Vous répondez avant que les questions soient entièrement posées." },
  // Phase 2
  { id: "ha_5", order: 10, category: "hyperactivity", weight: 1,
    text: "Vous vous levez de votre siège dans des situations où vous devriez rester assis(e)." },
  { id: "ha_6", order: 13, category: "hyperactivity", weight: 1,
    text: "Vous avez du mal à vous adonner à des activités de loisir dans le calme." },
  { id: "ha_7", order: 16, category: "hyperactivity", weight: 1,
    text: "Vous interrompez les autres ou vous vous immiscez dans leurs conversations ou activités." },
  { id: "ha_8", order: 19, category: "hyperactivity", weight: 1,
    text: "Vous êtes souvent agité(e) intérieurement, comme mu(e) par un moteur que vous ne contrôlez pas." },
  { id: "ha_9", order: 22, category: "hyperactivity", weight: 1,
    text: "Vous ressentez un besoin intense de bouger ou d'agir dans des situations où cela est inapproprié." },

  // ── RÉGULATION ÉMOTIONNELLE (3) ───────────────────────────────────────
  // Phase 2 (interspersed)
  { id: "er_1", order: 11, category: "emotional_regulation", weight: 1,
    text: "Vos émotions changent rapidement et avec une intensité qui vous dépasse, même pour des événements qui semblent mineurs de l'extérieur." },
  { id: "er_2", order: 14, category: "emotional_regulation", weight: 1,
    text: "Une petite contrariété peut déclencher une réaction forte — irritation, découragement ou colère — que vous peinez à contenir ou que vous regrettez ensuite." },
  { id: "er_3", order: 17, category: "emotional_regulation", weight: 1,
    text: "Après une montée d'énergie émotionnelle, vous avez du mal à redescendre et à retrouver votre calme, même une fois la situation passée." },

  // ── FONCTIONS EXÉCUTIVES (3) ──────────────────────────────────────────
  // Phase 2 → 3 transition
  { id: "ef_1", order: 20, category: "executive_functions", weight: 1,
    text: "Vous avez du mal à démarrer une tâche, même quand elle est urgente et importante — comme si un frein interne vous bloquait avant même de commencer." },
  { id: "ef_2", order: 23, category: "executive_functions", weight: 1,
    text: "Vous passez d'une tâche à l'autre sans en finir aucune, même quand vous aimeriez vraiment vous concentrer sur une seule." },
  { id: "ef_3", order: 24, category: "executive_functions", weight: 1,
    text: "Un changement imprévu dans votre planning ou votre environnement vous désorganise de façon disproportionnée, même quand l'adaptation reste objectivement simple." },

  // ── IMPACT QUOTIDIEN (4) ──────────────────────────────────────────────
  // Phase 3
  { id: "di_1", order: 25, category: "daily_impact", weight: 1,
    text: "Au travail ou dans vos études, vous fournissez souvent bien plus d'efforts que les autres pour des résultats équivalents, et cela vous épuise durablement." },
  { id: "di_2", order: 26, category: "daily_impact", weight: 1,
    text: "Dans vos relations proches, vous vous êtes souvent senti(e) incompris(e), « trop intense » ou différent(e) des autres, sans réussir à expliquer clairement pourquoi." },
  { id: "di_3", order: 27, category: "daily_impact", weight: 1,
    text: "Votre rythme de sommeil est perturbé — difficulté à vous endormir, à vous lever, ou les deux — indépendamment de votre fatigue réelle." },
  { id: "di_4", order: 28, category: "daily_impact", weight: 1,
    text: "Vous avez le sentiment chronique de ne pas atteindre votre potentiel, d'être en-dessous de ce que vous pourriez accomplir, malgré tous vos efforts." },
];

/** Questions sorted by display order — use this in the quiz component. */
export const SORTED_QUESTIONS = [...QUESTIONS].sort((a, b) => a.order - b.order);

// ─── Scoring ──────────────────────────────────────────────────────────────

export function computeScores(responses: Record<string, number>): CategoryScores {
  const sums: Record<QuestionCategory, number> = {
    inattention: 0,
    hyperactivity: 0,
    emotional_regulation: 0,
    executive_functions: 0,
    daily_impact: 0,
  };

  for (const q of QUESTIONS) {
    sums[q.category] += (responses[q.id] ?? 0) * q.weight;
  }

  return { ...sums, global: Object.values(sums).reduce((a, b) => a + b, 0) };
}

/**
 * Full scoring context passed to OpenAI for report generation.
 * Includes raw scores, percentages, responses, and question metadata.
 */
export function computeScoresWithContext(
  responses: Record<string, number>
): ScoresWithContext {
  const raw = computeScores(responses);

  const pct = (score: number, max: number) => Math.round((score / max) * 100);

  return {
    scores: {
      inattention:          { raw: raw.inattention,          max: CATEGORY_MAX.inattention,          percent: pct(raw.inattention,          CATEGORY_MAX.inattention) },
      hyperactivity:        { raw: raw.hyperactivity,        max: CATEGORY_MAX.hyperactivity,        percent: pct(raw.hyperactivity,        CATEGORY_MAX.hyperactivity) },
      emotional_regulation: { raw: raw.emotional_regulation, max: CATEGORY_MAX.emotional_regulation, percent: pct(raw.emotional_regulation, CATEGORY_MAX.emotional_regulation) },
      executive_functions:  { raw: raw.executive_functions,  max: CATEGORY_MAX.executive_functions,  percent: pct(raw.executive_functions,  CATEGORY_MAX.executive_functions) },
      daily_impact:         { raw: raw.daily_impact,         max: CATEGORY_MAX.daily_impact,         percent: pct(raw.daily_impact,         CATEGORY_MAX.daily_impact) },
      global:               { raw: raw.global,               max: GLOBAL_MAX,                        percent: pct(raw.global,               GLOBAL_MAX) },
    },
    responses,
    questions: QUESTIONS,
  };
}
