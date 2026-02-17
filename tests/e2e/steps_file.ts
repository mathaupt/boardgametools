// @ts-nocheck - CodeceptJS E2E tests
module.exports = function () {
  return actor({
    login: async function (email: string, password: string) {
      this.amOnPage("/login");
      this.fillField("email", email);
      this.fillField("password", password);
      this.click("Anmelden");
      this.waitForNavigation();
    },

    register: async function (name: string, email: string, password: string) {
      this.amOnPage("/register");
      this.fillField("name", name);
      this.fillField("email", email);
      this.fillField("password", password);
      this.fillField("confirmPassword", password);
      this.click("Registrieren");
      this.waitForNavigation();
    },

    // BGG Import specific steps
    searchBGGGame: async function (gameName: string) {
      this.amOnPage("/dashboard/games/import");
      this.fillField("search", gameName);
      this.click("Suchen");
      this.waitForElement(".search-results", 10);
    },

    selectBGGResult: async function (gameName: string) {
      this.click(gameName, ".search-result-item");
      this.waitForElement(".game-details", 5);
    },

    importBGGGame: async function () {
      this.click("Importieren", ".import-button");
      this.waitForText("Spiel wurde importiert", 5);
    },
  });
};
