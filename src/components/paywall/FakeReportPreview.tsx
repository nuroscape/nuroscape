const SECTIONS = [
  {
    title: "Votre profil d'attention",
    paragraphs: [
      "Votre capacité à maintenir l'attention sur des tâches répétitives ou peu stimulantes présente des variations notables selon les contextes. Ces fluctuations reflètent des mécanismes neurobiologiques spécifiques qui influencent votre quotidien professionnel et personnel de façon significative.",
      "Les environnements riches en distractions impactent de façon mesurable votre performance cognitive, notamment lors de tâches longues. Vos réponses indiquent des stratégies d'adaptation partiellement développées au fil des années.",
    ],
    bullets: [
      "Difficulté à maintenir l'attention sur des tâches longues",
      "Hyperfocalisation sur les sujets passionnants",
      "Sensibilité accrue aux distractions environnementales",
      "Tendance à perdre le fil dans les conversations complexes",
    ],
    highlight:
      "Votre profil d'attention révèle des forces importantes dans les situations de nouveauté et de défi cognitif élevé.",
  },
  {
    title: "Vos patterns d'hyperactivité et d'énergie",
    paragraphs: [
      "Votre niveau d'activation cognitive et physique montre des patterns caractéristiques qui se manifestent différemment selon les périodes de la journée et les types d'activités.",
      "Cette énergie, lorsqu'elle est bien canalisée, constitue un atout considérable dans les environnements stimulants. Vos réponses suggèrent une conscience croissante de vos cycles naturels d'activation.",
    ],
    bullets: [
      "Agitation interne même en apparence calme",
      "Recherche active de stimulation et de nouveauté",
      "Difficultés à déconnecter en fin de journée",
    ],
    highlight:
      "Les patterns identifiés sont cohérents avec un profil d'énergie atypique porteur d'un potentiel créatif significatif.",
  },
  {
    title: "Votre régulation émotionnelle",
    paragraphs: [
      "La gestion des émotions représente l'une des dimensions les moins connues du profil TDAH, pourtant centrale dans le vécu quotidien. Vos réponses éclairent des mécanismes de régulation émotionnelle spécifiques à votre profil personnel.",
    ],
    bullets: [
      "Intensité émotionnelle plus élevée que la moyenne",
      "Temps de récupération variable après une frustration",
      "Sensibilité au rejet ou à la critique perçue",
      "Enthousiasme intense pour les nouveaux projets",
    ],
    highlight:
      "Votre profil émotionnel inclut une empathie profonde et une sensibilité qui, dans les bons contextes, sont des atouts relationnels importants.",
  },
  {
    title: "Vos fonctions exécutives",
    paragraphs: [
      "Les fonctions exécutives — planification, inhibition, mémoire de travail — constituent le socle de l'organisation quotidienne. Les patterns observés dessinent un profil précis de vos forces et de vos défis organisationnels.",
      "Des stratégies de compensation ont visiblement été développées au fil du temps, témoignant d'une capacité d'adaptation remarquable face aux défis rencontrés dans ce domaine.",
    ],
    bullets: [
      "Démarrage difficile sur les tâches non urgentes",
      "Perception du temps subjective différente de l'horloge",
      "Mémoire de travail sollicitée de façon intensive",
    ],
    highlight:
      "Des compensations efficaces ont été développées qui masquent partiellement les difficultés — signe de résilience cognitive réelle.",
  },
  {
    title: "L'impact sur votre quotidien",
    paragraphs: [
      "L'évaluation de l'impact fonctionnel permet de comprendre comment ces patterns se traduisent concrètement dans votre vie professionnelle, relationnelle et personnelle.",
      "Les données de votre évaluation indiquent des zones d'impact spécifiques qui méritent une attention particulière et des stratégies d'adaptation ciblées sur vos besoins réels.",
    ],
    bullets: [
      "Impact professionnel sur la gestion des délais et priorités",
      "Relations personnelles : communication et incompréhensions",
      "Bien-être : fatigue liée à l'effort de compensation permanent",
      "Potentiel sous-exploité dans certains domaines clés",
    ],
    highlight:
      "L'impact identifié est réel mais modulable avec les bonnes stratégies adaptées à votre profil spécifique.",
  },
] as const;

export function FakeReportPreview() {
  return (
    <div className="space-y-8 pointer-events-none select-none" aria-hidden>
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3
            className="font-heading font-light text-xl text-foreground tracking-[-0.01em]"
            style={{
              fontVariationSettings: '"SOFT" 100, "WONK" 0',
              filter: "blur(4px)",
            }}
          >
            {section.title}
          </h3>

          <div className="space-y-2" style={{ filter: "blur(5px)" }}>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          <ul className="space-y-1.5" style={{ filter: "blur(5px)" }}>
            {section.bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/75">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
                />
                {item}
              </li>
            ))}
          </ul>

          <div
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: "oklch(0.96 0.012 168)",
              filter: "blur(5px)",
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.08 168)" }}>
              {section.highlight}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
