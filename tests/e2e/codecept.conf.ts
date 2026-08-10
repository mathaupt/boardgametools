// @ts-nocheck - CodeceptJS E2E tests
import pkg from "@codeceptjs/configure";
import bootstrap from "./bootstrap";
const { setHeadlessWhen } = pkg;

setHeadlessWhen(process.env.HEADLESS);

export const config = {
  tests: "./*_test.ts",
  output: "./output",
  bootstrap,
  require: ["tsx/cjs"],
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost:3000",
      show: false,
      waitForNavigation: "networkidle0",
    },
  },
  include: {
    I: "./steps_file.ts",
  },
  plugins: {
    retryFailedStep: { enabled: true },
    screenshot: { enabled: true },
  },
  name: "boardgametools-e2e",
};
