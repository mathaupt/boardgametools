import type { Metadata } from "next";
import localFont from "next/font/local";
import { Barlow, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = localFont({
  src: [
    { path: "./fonts/barlow-condensed-500.woff2", weight: "500" },
    { path: "./fonts/barlow-condensed-600.woff2", weight: "600" },
    { path: "./fonts/barlow-condensed-700.woff2", weight: "700" },
  ],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BoardGameTools",
  description: "Verwalte deine Brettspiele, Sessions und Events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${barlow.variable} ${barlowCondensed.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        <SiteFooter />
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
