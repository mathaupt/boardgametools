import { faqSections } from "@/lib/faq";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Rocket,
  Gamepad2,
  CalendarDays,
  Users,
  Clock,
  Share2,
  Wrench,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { FaqAccordion } from "./faq-accordion";

export const revalidate = 3600; // ISR: 1 hour – data from static TS file, only changes on deploy

const iconMap: Record<string, React.ElementType> = {
  rocket: Rocket,
  gamepad: Gamepad2,
  calendar: CalendarDays,
  users: Users,
  clock: Clock,
  share: Share2,
  wrench: Wrench,
};

export default function FaqPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              FAQ & Anleitung
            </h1>
            <p className="text-muted-foreground">
              Häufige Fragen und Schritt-für-Schritt-Anleitungen zu allen
              Features.
            </p>
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Direkt zu:
          </p>
          <div className="flex flex-wrap gap-2">
            {faqSections.map((section) => {
              const Icon = iconMap[section.icon] || HelpCircle;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {section.title}
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Sections */}
      <div className="space-y-6">
        {faqSections.map((section) => {
          const Icon = iconMap[section.icon] || HelpCircle;
          return (
            <Card
              key={section.id}
              id={section.id}
              className="border-border bg-card scroll-mt-20"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      {section.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FaqAccordion items={section.items} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
