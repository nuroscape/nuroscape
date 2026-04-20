import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm shadow-lg border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-heading text-2xl">Bon retour</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte Nuroscape
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.fr"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
          />
        </div>
        <Button className="w-full rounded-full" size="lg">
          Se connecter
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            S&apos;inscrire
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
