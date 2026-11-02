import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { SiteFooter } from "@/components/layout/site-footer";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/font/google", () => ({ Barlow: () => ({variable:"barlow"}), Geist_Mono: () => ({variable:"mono"}) }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => null }));
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => null }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({push:vi.fn(),refresh:vi.fn()}), redirect:vi.fn() }));
import RootLayout from "@/app/layout";
import Home from "@/app/page";
import LoginPage from "@/app/(auth)/login/page";

function documentFor(children: React.ReactNode) {
  return new DOMParser().parseFromString(renderToStaticMarkup(<RootLayout>{children}</RootLayout>), "text/html");
}
describe("global BoardGameGeek attribution", () => {
  it("exposes a keyboard accessible source link without accessibility violations", async () => {
    const user = userEvent.setup();
    const {container} = render(<SiteFooter/>);
    await user.tab();
    expect(screen.getByRole("link", {name:"Powered by BGG"})).toHaveFocus();
    expect((await axe(container)).violations).toEqual([]);
  });
  it.each(["login", "landing", "dashboard"])("renders exactly one accessible credit on %s", async page => {
    const child = page === "login" ? <LoginPage/> : page === "landing" ? await Home() : <main>Übersicht</main>;
    const doc = documentFor(child);
    expect(doc.querySelectorAll("footer")).toHaveLength(1);
    const footer = doc.querySelector("footer")!;
    expect(footer.textContent).toContain("Spieldaten von BoardGameGeek");
    const link = footer.querySelector('a[href="https://boardgamegeek.com/"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute("target")).not.toBe("_blank");
    const logo = link!.querySelector("img")!;
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("alt")).toBe("Powered by BGG");
    expect(logo.getAttribute("src")).toMatch(/^\/(?:_next\/image|images\/bgg\/)/);
    expect(footer.textContent).toContain("BoardGameTools");
    if(page === "login") expect(doc.querySelector('form[data-testid="login-form"]')).not.toBeNull();
  });
  it("allows the login title to wrap instead of widening the mobile page at large text sizes", () => {
    const doc = documentFor(<LoginPage/>);
    expect(doc.querySelector("h1")?.className).toContain("[overflow-wrap:anywhere]");
  });
  it("uses single link controls on the landing page", async () => {
    const doc = documentFor(await Home());
    expect(doc.querySelectorAll("a button")).toHaveLength(0);
    expect(doc.querySelector("header")?.className).toContain("flex-wrap");
  });
  it("keeps the shared footer after growing content in normal document flow", () => {
    const doc = documentFor(<main id="content">Lange Seite</main>);
    const footer = doc.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(doc.querySelector("#content")!.compareDocumentPosition(footer!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(footer?.className).not.toMatch(/\b(fixed|absolute|sticky)\b/);
    expect(doc.body.className).toContain("min-h-screen");
  });
});
