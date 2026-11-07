// @ts-nocheck - CodeceptJS E2E tests
import { primaryButtonContrast } from "./helpers/button-contrast.mjs";

Feature("Club Programme navigation");

Before(({ I }) => {
  I.amOnPage("/login");
  I.fillField("email", "e2e@example.com");
  I.fillField("password", "E2ETest123!");
  I.click("Anmelden");
  I.waitForText("Der nächste Spieleabend wartet.", 5);
});

Scenario("Only the destination section is marked current", ({ I }) => {
  I.resizeWindow(1440, 900);
  I.amOnPage("/dashboard/events");
  I.seeElement('nav[aria-label="Hauptnavigation"] a[href="/dashboard/events"][aria-current="page"]');
  I.dontSeeElement('nav[aria-label="Hauptnavigation"] a[href="/dashboard"][aria-current="page"]');
});

Scenario("Mobile navigation exposes labels and closes on selection", ({ I }) => {
  I.resizeWindow(390, 844);
  I.amOnPage("/dashboard");
  I.click('button[aria-label="Menü öffnen"]');
  I.seeElement('button[aria-expanded="true"]');
  I.click('nav[aria-label="Hauptnavigation"] a[href="/dashboard/games"]');
  I.waitForText("Meine Spiele", 5);
  I.seeElement('button[aria-expanded="false"]');
});

Scenario("Profile leads to all badges and their unlock conditions on mobile", ({ I }) => {
  I.resizeWindow(390, 844);
  I.amOnPage("/dashboard/profile");
  I.click("Alle Abzeichen und ihre Freischaltbedingungen ansehen");
  I.waitForText("Meine Erfolge", 5);
  I.see("Freigeschaltet");
  I.see("Noch nicht freigeschaltet");
  I.see("Erste Spielrunde");
  I.see("Zehn gemeinsame Runden");
  I.see("Fünfzig Spielrunden");
  I.see("Fünf Spiele entdeckt");
  I.see("Sammlung auf dem Tisch");
  I.see("Reihe abgeschlossen");
  I.see("Freischaltbedingung");
});

Scenario("Achievement overview has no horizontal overflow at 200 percent zoom width", async ({ I }) => {
  I.resizeWindow(195, 844);
  I.amOnPage("/dashboard/achievements");
  const hasOverflow = await I.executeScript(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (hasOverflow) throw new Error("Achievement overview overflows horizontally at 200 percent zoom width");
});

Scenario("Dark primary buttons meet text contrast requirements", async ({ I }) => {
  I.amOnPage("/dashboard");
  I.executeScript(() => {
    const style = document.createElement("style");
    style.textContent = "* { transition: none !important; animation: none !important; }";
    document.head.append(style);
    document.documentElement.classList.add("dark");
  });
  const normal = await I.executeScript(primaryButtonContrast);
  I.moveCursorTo('[data-slot="button"][data-variant="default"]');
  const hover = await I.executeScript(primaryButtonContrast);
  for (const result of [...normal, ...hover]) {
    if (result.ratio < 4.5) throw new Error(`${result.text}: contrast ${result.ratio.toFixed(2)}:1`);
  }
});

Scenario("Collection search has an accessible mobile touch target", async ({ I }) => {
  I.resizeWindow(390, 844);
  I.amOnPage("/dashboard/games");
  const height = await I.executeScript(() => document.querySelector('input[aria-label="Spiele durchsuchen"]')?.getBoundingClientRect().height);
  if (height != null && height < 44) throw new Error(`Search target is only ${height}px tall`);
});
