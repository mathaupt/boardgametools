import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="text-6xl">🎲</div>
      <h1 className="text-3xl font-bold text-foreground">404</h1>
      <h2 className="text-xl text-muted-foreground">Seite nicht gefunden</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link href="/">
        <Button>
          <Home className="h-4 w-4 mr-2" />
          Zur Startseite
        </Button>
      </Link>
    </div>
  );
}
