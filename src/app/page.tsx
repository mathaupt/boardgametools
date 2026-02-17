import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice6, Gamepad2, CalendarDays, Users, Vote, BarChart3 } from "lucide-react";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Dice6 className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">BoardGameTools</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost">Anmelden</Button>
          </Link>
          <Link href="/register">
            <Button>Registrieren</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Verwalte deine Brettspielsammlung
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Tracke deine Spiele, erfasse Partien, organisiere Spieleabende mit Voting 
            und analysiere deine Spielstatistiken.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Kostenlos starten
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Anmelden
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Gamepad2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Spielesammlung</CardTitle>
              <CardDescription>
                Verwalte deine Brettspiele mit allen Details. Import von BoardGameGeek möglich.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CalendarDays className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Session Tracking</CardTitle>
              <CardDescription>
                Erfasse gespielte Partien mit Ergebnissen, Punkten und Gewinnern.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Gruppen</CardTitle>
              <CardDescription>
                Organisiere deine Spielerunden in Gruppen und lade Freunde ein.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Vote className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Event Voting</CardTitle>
              <CardDescription>
                Plane Spieleabende und lass alle Teilnehmer über das Spiel abstimmen.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Statistiken</CardTitle>
              <CardDescription>
                Analysiere deine Spielhistorie mit detaillierten Auswertungen.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <Dice6 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>BGG Integration</CardTitle>
              <CardDescription>
                Importiere Spiele direkt von BoardGameGeek mit allen Daten.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-16 border-t text-center text-muted-foreground">
        <p>© 2024 BoardGameTools. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
}
