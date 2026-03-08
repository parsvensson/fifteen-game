import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

Given("I open the game", async ({ page }) => {
  await page.goto("/");
});

Then("I should see the Fifteen title", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Fifteen" })).toBeVisible();
});
