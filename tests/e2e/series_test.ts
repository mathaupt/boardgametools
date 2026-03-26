// @ts-nocheck - CodeceptJS E2E tests
Feature("Game Series & Navigation");

Scenario("Unauthenticated user is redirected to login from series", ({ I }) => {
  I.amOnPage("/dashboard/series");
  I.seeInCurrentUrl("/login");
});

Scenario("Series new page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/series/new");
  I.seeInCurrentUrl("/login");
});

Scenario("Series detail page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/series/test-id");
  I.seeInCurrentUrl("/login");
});

Scenario("Statistics page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/statistics");
  I.seeInCurrentUrl("/login");
});

Scenario("FAQ page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/faq");
  I.seeInCurrentUrl("/login");
});

Scenario("Changelog page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/changelog");
  I.seeInCurrentUrl("/login");
});
