import { Card, CardContent } from "@/components/ui/card";

export function SeriesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        <div>
          <div className="h-7 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-32 mt-2 animate-pulse" />
        </div>
      </div>
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-3 bg-muted rounded-full w-full" />
        </CardContent>
      </Card>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="h-14 w-14 bg-muted rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4 mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
