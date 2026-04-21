"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="group">
          <span
            className="font-heading text-xl font-light tracking-[-0.01em] text-foreground group-hover:text-primary transition-colors duration-200"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            nuroscape
          </span>
        </Link>

        <Button
          render={<Link href="/quiz" />}
          size="sm"
          className="rounded-full px-5 font-medium"
        >
          Commencer
        </Button>
      </div>
    </header>
  );
}
