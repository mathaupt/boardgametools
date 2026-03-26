// @ts-nocheck - CodeceptJS E2E tests
Feature("Groups Management");

Scenario("Unauthenticated user is redirected to login from groups", ({ I }) => {
  I.amOnPage("/dashboard/groups");
  I.seeInCurrentUrl("/login");
});

Scenario("Groups new page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/groups/new");
  I.seeInCurrentUrl("/login");
});

Scenario("Group detail page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/groups/test-id");
  I.seeInCurrentUrl("/login");
});

Scenario("Group statistics page redirects unauthenticated", ({ I }) => {
  I.amOnPage("/dashboard/groups/test-id/statistics");
  I.seeInCurrentUrl("/login");
});

Scenario("Public group page is accessible without auth", ({ I }) => {
  I.amOnPage("/public/group/nonexistent");
  I.dontSeeInCurrentUrl("/login");
});
