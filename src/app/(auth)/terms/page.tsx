import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dice6, ArrowLeft } from "lucide-react";

export const revalidate = false; // Fully static – no data dependencies

export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Dice6 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">BoardGameTools</h1>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">Nutzungsbedingungen</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Hinweis: BoardGameTools ist ein Prototyp-Projekt. Die folgenden
                Nutzungsbedingungen dienen als Platzhalter und werden vor einem
                produktiven Einsatz entsprechend angepasst.
              </p>
            </div>

            <h3 className="text-lg font-semibold mt-6">1. Geltungsbereich</h3>
            <p className="text-sm text-muted-foreground">
              Diese Nutzungsbedingungen gelten für die Nutzung der Webanwendung
              BoardGameTools (nachfolgend &quot;Dienst&quot;). Mit der Registrierung
              erklärt sich der Nutzer mit diesen Bedingungen einverstanden.
            </p>

            <h3 className="text-lg font-semibold">2. Leistungsbeschreibung</h3>
            <p className="text-sm text-muted-foreground">
              BoardGameTools ermöglicht die digitale Verwaltung von
              Brettspiel-Sammlungen, das Planen von Spieleabenden sowie die
              Organisation von Gruppen und Events mit Abstimmungsfunktion.
            </p>

            <h3 className="text-lg font-semibold">3. Registrierung und Konto</h3>
            <p className="text-sm text-muted-foreground">
              Für die Nutzung des Dienstes ist eine Registrierung erforderlich.
              Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und
              seine Zugangsdaten vertraulich zu behandeln.
            </p>

            <h3 className="text-lg font-semibold">4. Prototyp-Hinweis</h3>
            <p className="text-sm text-muted-foreground">
              Dieser Dienst befindet sich im Prototyp-Stadium. Es besteht kein
              Anspruch auf Verfügbarkeit, Datensicherung oder Funktionsumfang.
              Der Betreiber behält sich vor, den Dienst jederzeit ohne
              Vorankündigung zu ändern oder einzustellen.
            </p>

            <h3 className="text-lg font-semibold">5. Haftungsausschluss</h3>
            <p className="text-sm text-muted-foreground">
              Die Nutzung erfolgt auf eigene Gefahr. Der Betreiber übernimmt
              keine Haftung für Datenverlust, Ausfallzeiten oder sonstige
              Schäden, die durch die Nutzung des Dienstes entstehen.
            </p>

            <div className="pt-4">
              <Link href="/register">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Registrierung
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
