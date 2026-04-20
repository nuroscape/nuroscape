"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="5" cy="5" r="3" fill="currentColor" className="text-primary-foreground" />
              <circle cx="11" cy="11" r="3" fill="currentColor" className="text-primary-foreground opacity-60" />
              <path d="M5 8 Q8 6 11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary-foreground" fill="none" />
            </svg>
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Nuroscape
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="#comment-ca-marche" className="hover:text-foreground transition-colors">
            Comment ça marche
          </Link>
          <Link href="#tarifs" className="hover:text-foreground transition-colors">
            Tarifs
          </Link>
          <Link href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Se connecter
          </Link>
          <Button render={<Link href="/register" />} size="sm" className="rounded-full px-5">
            Commencer
          </Button>
        </div>
      </div>
    </header>
  );
}
