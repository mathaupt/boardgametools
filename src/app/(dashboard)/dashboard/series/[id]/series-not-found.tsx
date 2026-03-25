import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Library } from "lucide-react";

export function SeriesNotFound() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/series">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Reihe nicht gefunden</h1>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Library className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Die gesuchte Reihe existiert nicht oder wurde gelöscht.</p>
          <Link href="/dashboard/series">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
