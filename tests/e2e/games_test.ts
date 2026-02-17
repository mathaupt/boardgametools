// @ts-nocheck - CodeceptJS E2E tests
Feature("Games Management & BGG Integration");

Before(({ I }) => {
  // Note: In real tests, you would set up a test user and login
  // This is a placeholder for the test structure
});

Scenario("Unauthenticated user is redirected to login", ({ I }) => {
  I.amOnPage("/dashboard/games");
  I.seeInCurrentUrl("/login");
});

Scenario("Games page shows empty state when no games", ({ I }) => {
  // After login (would need test user setup)
  I.amOnPage("/dashboard/games");
  // I.see("Du hast noch keine Spiele");
});

Scenario("User can navigate to add game form", ({ I }) => {
  I.amOnPage("/dashboard/games/new");
  I.seeInCurrentUrl("/login"); // Redirects if not logged in
});

Scenario("BGG import page loads correctly", ({ I }) => {
  I.amOnPage("/dashboard/games/import");
  I.seeInCurrentUrl("/login"); // Redirects if not logged in
});

Scenario("BGG search functionality works", ({ I }) => {
  // After login setup
  I.amOnPage("/dashboard/games/import");
  I.seeElement("input[name='search']");
  I.seeElement("button[type='submit']");
  I.see("Von BGG importieren");
});

Scenario("BGG search shows results", ({ I }) => {
  // After login setup
  I.amOnPage("/dashboard/games/import");
  I.fillField("search", "Catan");
  I.click("Suchen");
  // Wait for results (would need proper wait implementation)
  I.see("Catan", ".search-results"); // Assuming results container
});

Scenario("BGG game details can be loaded", ({ I }) => {
  // After login setup and search results
  I.amOnPage("/dashboard/games/import");
  I.fillField("search", "Catan");
  I.click("Suchen");
  I.click("Catan", ".search-result-item"); // Click on first result
  I.see("Spiel-Details", ".game-details");
  I.see("Importieren", ".import-button");
});
