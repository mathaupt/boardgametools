import { setHeadlessWhen, setCommonPlugins } from "@codeceptjs/configure";

setHeadlessWhen(process.env.HEADLESS);
setCommonPlugins();

export const config: CodeceptJS.MainConfig = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost:3000",
      show: false,
      waitForNavigation: "networkidle0",
    },
  },
  include: {
    I: "./steps_file",
  },
  name: "boardgametools-e2e",
};
