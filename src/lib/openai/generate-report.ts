import OpenAI from "openai";
import type { ScoresWithContext } from "@/data/questions";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ReportSection = {
  title: string;
  content: string;
};

export type ReportJSON = {
  intro: string;
  sections: ReportSection[];
  strengths: { title: string; items: string[] };
  recommendations: { title: string; items: string[] };
  next_steps: { title: string; items: string[] };
};

export const DISCLAIMER =
  "Ce rapport est une auto-évaluation basée sur des critères issus du DSM-5 et de la littérature clinique sur le TDAH. Il ne constitue pas un diagnostic médical et ne remplace en aucun cas une consultation avec un professionnel de santé qualifié (psychiatre, neuropsychologue ou médecin généraliste formé au TDAH).";

const SCORE_LABELS = ["Jamais", "Parfois", "Souvent", "Très souvent"];

const SYSTEM_PROMPT = `Tu es un rédacteur spécialisé en psychologie cognitive et éducation à la santé mentale.
Tu rédiges des rapports d'auto-évaluation bienveillants, précis et non-médicaux pour des adultes francophones explorant si le TDAH fait partie de leur histoire.

RÈGLES ABSOLUES :
1. Ne pose JAMAIS de diagnostic. Ce rapport est une auto-évaluation, pas un avis médical.
2. Utilise UNIQUEMENT les informations des réponses fournies. N'invente pas de symptômes non rapportés.
3. Pour chaque catégorie dont le score est inférieur à 20 %, génère une seule phrase neutre : "Ce domaine ne ressort pas de façon significative dans votre évaluation."
4. Si le score global est ≥ 70 %, le dernier item de next_steps doit recommander explicitement une consultation professionnelle (psychiatre ou neuropsychologue) — formulé de façon positive et bienveillante, jamais alarmiste.
5. Chaque item de recommendations doit être action-oriented : commence par "Essayez de…", "Commencez par…", "Identifiez…", "Pratiquez…" — jamais de langue passive ou de vague espoir.
6. Longueurs cibles : intro ~80 mots, chaque section ~100–150 mots, strengths 3–4 items, recommendations 4–5 items, next_steps 3–4 items.

FORMAT DE SORTIE :
Retourne UNIQUEMENT un objet JSON valide respectant exactement cette structure (sans markdown, sans commentaires) :
{
  "intro": "string",
  "sections": [
    { "title": "Votre profil d'inattention", "content": "string" },
    { "title": "Votre profil d'hyperactivité et impulsivité", "content": "string" },
    { "title": "Régulation émotionnelle", "content": "string" },
    { "title": "Fonctions exécutives", "content": "string" },
    { "title": "Impact sur votre quotidien", "content": "string" },
    { "title": "Patterns clés identifiés", "content": "string" }
  ],
  "strengths": { "title": "Vos points de force", "items": ["string"] },
  "recommendations": { "title": "Recommandations personnalisées", "items": ["string"] },
  "next_steps": { "title": "Prochaines étapes", "items": ["string"] }
}

Langue : français. Ton : bienveillant, direct, sans condescendance ni jargon médical lourd.`;

export async function generateReport(ctx: ScoresWithContext): Promise<ReportJSON> {
  const { scores, responses, questions } = ctx;

  const lines = questions.map((q) => {
    const val = responses[q.id] ?? 0;
    return `[${q.category}] ${q.text} → ${SCORE_LABELS[val]} (${val}/3)`;
  });

  const userMessage = `Résultats de l'évaluation :

Score global : ${scores.global.raw}/${scores.global.max} (${scores.global.percent} %)

Scores par catégorie :
- Inattention : ${scores.inattention.raw}/${scores.inattention.max} (${scores.inattention.percent} %)
- Hyperactivité / Impulsivité : ${scores.hyperactivity.raw}/${scores.hyperactivity.max} (${scores.hyperactivity.percent} %)
- Régulation émotionnelle : ${scores.emotional_regulation.raw}/${scores.emotional_regulation.max} (${scores.emotional_regulation.percent} %)
- Fonctions exécutives : ${scores.executive_functions.raw}/${scores.executive_functions.max} (${scores.executive_functions.percent} %)
- Impact quotidien : ${scores.daily_impact.raw}/${scores.daily_impact.max} (${scores.daily_impact.percent} %)

Réponses détaillées (0=Jamais, 1=Parfois, 2=Souvent, 3=Très souvent) :
${lines.join("\n")}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    max_tokens: 3000,
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as ReportJSON;
}
