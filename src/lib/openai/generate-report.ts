import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type QuizResponse = {
  questionId: string;
  questionText: string;
  value: number;
  category: "inattention" | "hyperactivity";
};

type GenerateReportInput = {
  responses: QuizResponse[];
  scoreInattention: number;
  scoreHyperactivity: number;
  scoreTotal: number;
  userFirstName?: string;
};

export async function generateReport(input: GenerateReportInput): Promise<string> {
  const { responses, scoreInattention, scoreHyperactivity, scoreTotal, userFirstName } = input;

  const responseSummary = responses
    .map((r) => `- [${r.category}] ${r.questionText}: ${scoreLabel(r.value)}`)
    .join("\n");

  const prompt = `Tu es un rédacteur spécialisé en neuropsychologie et santé mentale. Tu rédiges des rapports d'auto-évaluation TDAH bienveillants, nuancés et non-médicaux.

Données de l'évaluation${userFirstName ? ` pour ${userFirstName}` : ""} :
- Score inattention : ${scoreInattention}/27
- Score hyperactivité/impulsivité : ${scoreHyperactivity}/27
- Score total : ${scoreTotal}/54

Réponses détaillées :
${responseSummary}

Génère un rapport HTML complet avec les sections suivantes :
1. Introduction chaleureuse (2-3 phrases, bienveillante)
2. Synthèse des résultats (avec interprétation nuancée des scores)
3. Points de force observés
4. Axes d'attention (sans jugement)
5. Prochaines étapes recommandées (consultation professionnelle, ressources)
6. Note de clôture encourageante

Règles :
- Utilise des balises HTML sémantiques (h2, p, ul, li, strong)
- Ton : bienveillant, sérieux, professionnel — jamais alarmiste
- JAMAIS de diagnostic. Toujours recommander un professionnel de santé
- Maximum 600 mots
- Langue : français`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content ?? "";
}

function scoreLabel(value: number): string {
  const labels = ["Jamais", "Parfois", "Souvent", "Très souvent"];
  return labels[value] ?? "Non répondu";
}
