import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-card text-card-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-6 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} BoardGameTools</p>
        <div className="flex min-w-0 flex-col items-center gap-2 sm:items-end">
          <p className="text-sm text-muted-foreground">Spieldaten von BoardGameGeek</p>
          <a
            href="https://boardgamegeek.com/"
            className="inline-flex min-h-11 max-w-full items-center rounded-md bg-white px-3 py-2 outline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Image
              src="/images/bgg/powered-by-bgg.png"
              alt="Powered by BGG"
              width={736}
              height={216}
              className="h-auto w-[200px] max-w-full"
              unoptimized
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
