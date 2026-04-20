import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Créer un compte",
};

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-sm shadow-lg border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-heading text-2xl">Créer un compte</CardTitle>
        <CardDescription>
          Commencez votre évaluation TDAH en toute confidentialité
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Prénom</Label>
          <Input id="name" type="text" placeholder="Votre prénom" autoComplete="given-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="vous@exemple.fr" autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" autoComplete="new-password" />
        </div>
        <Button className="w-full rounded-full" size="lg">
          Créer mon compte
        </Button>
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/cgu" className="underline hover:text-foreground">conditions</Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className="underline hover:text-foreground">politique de confidentialité</Link>.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
