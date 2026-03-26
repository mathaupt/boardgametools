// @ts-nocheck - CodeceptJS E2E tests
Feature("Events & Voting");

Scenario("Unauthenticated user is redirected to login from events", ({ I }) => {
  I.amOnPage("/dashboard/events");
  I.seeInCurrentUrl("/login");
});

Scenario("Events new page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/events/new");
  I.seeInCurrentUrl("/login");
});

Scenario("Public event page is accessible without auth", ({ I }) => {
  I.amOnPage("/public/event/nonexistent");
  I.dontSeeInCurrentUrl("/login");
});

Scenario("Event detail page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/events/test-id");
  I.seeInCurrentUrl("/login");
});
