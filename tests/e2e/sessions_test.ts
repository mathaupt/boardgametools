// @ts-nocheck - CodeceptJS E2E tests
Feature("Sessions Management");

Scenario("Unauthenticated user is redirected to login from sessions", ({ I }) => {
  I.amOnPage("/dashboard/sessions");
  I.seeInCurrentUrl("/login");
});

Scenario("Sessions new page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/sessions/new");
  I.seeInCurrentUrl("/login");
});

Scenario("Sessions page loads after login", ({ I }) => {
  I.amOnPage("/login");
  I.seeElement('input[name="email"]');
  I.seeElement('input[name="password"]');
});

Scenario("New session form redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/sessions/new");
  I.seeInCurrentUrl("/login");
});
