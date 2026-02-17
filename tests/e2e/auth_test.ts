Feature("Authentication");

Scenario("User can view login page", ({ I }) => {
  I.amOnPage("/login");
  I.see("BoardGameTools");
  I.see("Anmelden");
  I.seeElement('input[name="email"]');
  I.seeElement('input[name="password"]');
});

Scenario("User can view register page", ({ I }) => {
  I.amOnPage("/register");
  I.see("Konto erstellen");
  I.seeElement('input[name="name"]');
  I.seeElement('input[name="email"]');
  I.seeElement('input[name="password"]');
});

Scenario("User can navigate between login and register", ({ I }) => {
  I.amOnPage("/login");
  I.click("Registrieren");
  I.seeInCurrentUrl("/register");
  I.click("Anmelden");
  I.seeInCurrentUrl("/login");
});

Scenario("Login shows error for invalid credentials", ({ I }) => {
  I.amOnPage("/login");
  I.fillField("email", "invalid@test.com");
  I.fillField("password", "wrongpassword");
  I.click("Anmelden");
  I.waitForText("Ungültige Anmeldedaten", 5);
});
