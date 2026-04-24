type Step = {
  n: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    n: "1",
    title: "Activez votre essai",
    description: "1,99€ pour 7 jours d'accès complet.",
  },
  {
    n: "2",
    title: "Accédez à votre rapport",
    description: "Généré en quelques secondes après activation.",
  },
  {
    n: "3",
    title: "Explorez et agissez",
    description: "Lisez, téléchargez, appliquez à votre rythme.",
  },
];

export function HowItWorks() {
  return (
    <div className="space-y-4">
      <p
        className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Comment ça marche
      </p>

      <div className="flex flex-col sm:flex-row gap-5">
        {STEPS.map(({ n, title, description }) => (
          <div key={n} className="flex-1 flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm text-primary-foreground font-medium"
              style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
            >
              {n}
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
