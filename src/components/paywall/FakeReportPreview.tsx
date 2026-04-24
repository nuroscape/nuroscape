const SECTIONS = [
  {
    title: "Votre profil d'attention",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.",
    ],
    bullets: [
      "Lorem ipsum dolor sit amet consectetur",
      "Adipiscing elit sed do eiusmod tempor",
      "Incididunt ut labore et dolore magna",
      "Aliqua ut enim ad minim veniam quis",
    ],
    highlight:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam quis nostrud.",
  },
  {
    title: "Vos patterns d'hyperactivité et d'énergie",
    paragraphs: [
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta.",
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    ],
    bullets: [
      "Neque porro quisquam est qui dolorem",
      "Ipsum quia dolor sit amet consectetur",
      "Adipisci velit sed quia non numquam",
    ],
    highlight:
      "Ut labore et dolore magnam aliquam quaerat voluptatem. Quis autem vel eum iure reprehenderit.",
  },
  {
    title: "Votre régulation émotionnelle",
    paragraphs: [
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    ],
    bullets: [
      "Similique sunt in culpa qui officia",
      "Deserunt mollitia animi id est laborum",
      "Et dolorum fuga et harum quidem rerum",
      "Facilis est et expedita distinctio nam",
    ],
    highlight:
      "Nam libero tempore cum soluta nobis eligendi optio cumque nihil impedit quo minus.",
  },
  {
    title: "Vos fonctions exécutives",
    paragraphs: [
      "Temporibus autem quibusdam et aut officiis debitis rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint molestiae non recusandae.",
      "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
    ],
    bullets: [
      "Quis autem vel eum iure reprehenderit",
      "Qui in ea voluptate velit esse quam",
      "Nihil molestiae consequatur vel illum",
    ],
    highlight:
      "Quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi.",
  },
  {
    title: "L'impact sur votre quotidien",
    paragraphs: [
      "Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit.",
      "Esse quam nihil molestiae consequatur vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus blanditiis praesentium.",
    ],
    bullets: [
      "Voluptatum deleniti atque corrupti quos",
      "Dolores et quas molestias excepturi sint",
      "Occaecati cupiditate non provident similique",
      "Sunt in culpa qui officia deserunt mollitia",
    ],
    highlight:
      "Animi id est laborum et dolorum fuga et harum quidem rerum facilis est et expedita distinctio.",
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
