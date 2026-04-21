import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Votre rapport est prêt | Nuroscape" };

export default function PaywallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-5 flex justify-center">
        <Link
          href="/"
          className="font-heading font-light text-lg tracking-[-0.01em] text-foreground"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          nuroscape
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
