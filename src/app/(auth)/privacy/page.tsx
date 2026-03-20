import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dice6, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            <CardTitle className="text-2xl">Datenschutzerklärung</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Hinweis: BoardGameTools ist ein Prototyp-Projekt. Diese
                Datenschutzerklärung wird vor einem produktiven Einsatz
                entsprechend der DSGVO vollständig überarbeitet.
              </p>
            </div>

            <h3 className="text-lg font-semibold mt-6">1. Verantwortlicher</h3>
            <p className="text-sm text-muted-foreground">
              Verantwortlich für die Datenverarbeitung im Sinne der
              Datenschutz-Grundverordnung (DSGVO) ist der Betreiber dieses
              Prototyps.
            </p>

            <h3 className="text-lg font-semibold">2. Erhobene Daten</h3>
            <p className="text-sm text-muted-foreground">
              Bei der Nutzung von BoardGameTools werden folgende
              personenbezogene Daten erhoben und verarbeitet:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-6 space-y-1">
              <li>Name und E-Mail-Adresse (bei der Registrierung)</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Nutzungsdaten wie angelegte Spiele, Sessions, Gruppen und Events</li>
            </ul>

            <h3 className="text-lg font-semibold">3. Zweck der Datenverarbeitung</h3>
            <p className="text-sm text-muted-foreground">
              Die erhobenen Daten werden ausschließlich zur Bereitstellung der
              Funktionen von BoardGameTools verwendet. Eine Weitergabe an Dritte
              findet nicht statt.
            </p>

            <h3 className="text-lg font-semibold">4. Datenspeicherung</h3>
            <p className="text-sm text-muted-foreground">
              Alle Daten werden auf dem Server des Betreibers gespeichert.
              Es werden keine Daten an externe Dienste oder Cloud-Anbieter
              übermittelt. Als Prototyp erfolgt keine garantierte Datensicherung.
            </p>

            <h3 className="text-lg font-semibold">5. Ihre Rechte</h3>
            <p className="text-sm text-muted-foreground">
              Gemäß DSGVO haben Sie folgende Rechte bezüglich Ihrer
              personenbezogenen Daten:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-6 space-y-1">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
            </ul>

            <h3 className="text-lg font-semibold">6. Cookies</h3>
            <p className="text-sm text-muted-foreground">
              BoardGameTools verwendet ausschließlich technisch notwendige
              Cookies für die Sitzungsverwaltung (Session-Cookie). Es werden
              keine Tracking- oder Analyse-Cookies eingesetzt.
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
