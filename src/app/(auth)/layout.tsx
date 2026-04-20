import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
          <span className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="5" cy="5" r="3" fill="currentColor" className="text-primary-foreground" />
              <circle cx="11" cy="11" r="3" fill="currentColor" className="text-primary-foreground opacity-60" />
              <path d="M5 8 Q8 6 11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary-foreground" fill="none" />
            </svg>
          </span>
          Nuroscape
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
