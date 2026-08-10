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
