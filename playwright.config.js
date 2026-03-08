import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import path from "node:path";
import { pathToFileURL } from "node:url";

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: "features/steps/**/*.js",
});

const distBaseUrl = pathToFileURL(path.resolve("dist") + path.sep).href;

export default defineConfig({
  testDir,
  reporter: "list",
  use: {
    baseURL: distBaseUrl,
    launchOptions: {
      args: ["--allow-file-access-from-files"],
    },
  },
});
