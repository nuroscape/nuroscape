import Link from "next/link";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-6 flex justify-between items-center">
        <Link
          href="/"
          className="font-heading text-base font-semibold text-foreground"
        >
          Nuroscape
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Tableau de bord
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start px-6 py-8 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
