// @ts-nocheck - CodeceptJS E2E tests
Feature("Games Management & BGG Integration");

const TEST_EMAIL = "e2e@example.com";
const TEST_PASSWORD = "E2ETest123!";

Before(({ I }) => {
  I.amOnPage("/login");
  I.fillField("email", TEST_EMAIL);
  I.fillField("password", TEST_PASSWORD);
  I.click("Anmelden");
  I.waitForText("Willkommen zurück", 5);
});

Scenario("Authenticated user sees empty games list", ({ I }) => {
  I.amOnPage("/dashboard/games");
  I.see("Du hast noch keine Spiele in deiner Sammlung.");
});

Scenario("User can navigate to add game form", ({ I }) => {
  I.amOnPage("/dashboard/games/new");
  I.seeElement("input[name='name']");
  I.see("Spiel speichern");
});

Scenario("manual game text is normalized, searchable and rendered as text", ({ I }) => {
  const gameName = "FEAT009 Dungeons & Dragons";
  I.amOnPage("/dashboard/games/new");
  I.fillField("name", "FEAT009 Dungeons &amp;amp; Dragons");
  I.fillField("description", "&lt;script&gt;alert(1)&lt;/script&gt; &#x1F3B2;");
  I.click("Spiel speichern");
  I.waitForText(gameName, 5);
  I.see("<script>alert(1)</script> 🎲");
  I.dontSeeElement('img[src="x"]');
  I.amOnPage("/dashboard/games");
  I.fillField('input[placeholder="Spiele durchsuchen…"]', "FEAT009 Dungeons &amp; Dragons");
  I.see(gameName);
  I.click(gameName);
  I.click("Löschen");
  I.waitForText("Spiel löschen?", 3);
  I.click("Löschen", ".bg-destructive");
  I.dontSee(gameName);
});

Scenario("BGG import page loads correctly", ({ I }) => {
  I.amOnPage("/dashboard/games/import");
  I.see("Von BGG importieren");
  I.seeElement('input[aria-label="Spiel suchen"]');
  I.seeElement('button[type="submit"]');
});

xScenario("BGG search shows results", ({ I }) => {
  // Pending: requires live BGG API and stable search results in CI.
  I.amOnPage("/dashboard/games/import");
  I.fillField('input[aria-label="Spiel suchen"]', "Catan");
  I.click("Suchen");
  I.see("Catan", ".search-results");
});

xScenario("BGG game details can be loaded", ({ I }) => {
  // Pending: requires live BGG API and stable search results in CI.
  I.amOnPage("/dashboard/games/import");
  I.fillField('input[aria-label="Spiel suchen"]', "Catan");
  I.click("Suchen");
  I.click("Catan", ".search-result-item");
  I.see("Spiel-Details", ".game-details");
  I.see("Importieren", ".import-button");
});
