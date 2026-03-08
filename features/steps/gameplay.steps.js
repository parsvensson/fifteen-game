import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I open the game", async ({ page }) => {
  await page.goto("./index.html");
});

When("I slide tile {string}", async ({ page }, tileValue) => {
  await page.getByRole("button", { name: tileValue }).click();
});

When("I solve from the initial board with name {string}", async ({ page }, name) => {
  await page.getByRole("button", { name: "15" }).click();
  await page.getByRole("button", { name: "15" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Save score" }).click();
});

When("I solve from the initial board and skip name", async ({ page }) => {
  await page.getByRole("button", { name: "15" }).click();
  await page.getByRole("button", { name: "15" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
});

When("I click shuffle", async ({ page }) => {
  const shuffleButton = page.getByRole("button", { name: "Shuffle" });
  await shuffleButton.click();
  await expect(shuffleButton).toBeEnabled({ timeout: 8000 });
});

When("I click robot solve", async ({ page }) => {
  await page.getByRole("button", { name: "Robot" }).click();
});

Then("move count should be {int}", async ({ page }, moves) => {
  await expect(page.locator(`[aria-label="Moves: ${moves}"]`)).toBeVisible();
});

Then("timer should be {word}", async ({ page }, timer) => {
  await expect(page.locator(`[aria-label="Time: ${timer}"]`)).toBeVisible();
});

Then("timer should advance from 0:00", async ({ page }) => {
  await expect(page.locator('[aria-label="Time: 0:00"]')).toBeVisible();
  await expect.poll(async () => {
    const text = await page
      .locator(".score-strip__cell")
      .nth(1)
      .locator(".score-strip__value")
      .innerText();
    return text !== "0:00";
  }).toBeTruthy();
});

Then("I should see solved status", async ({ page }) => {
  await expect(page.getByText("Solved!")).toBeVisible();
});

Then("I should see the Fifteen title", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Fifteen" })).toBeVisible();
});

Then("I should see fireworks", async ({ page }) => {
  await expect(page.getByTestId("fireworks")).toBeVisible();
});

Then(
  "I should see highscore {string} with {int} moves",
  async ({ page }, name, moves) => {
    await page.getByRole("tab", { name: "Highscores" }).click();
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(`${moves} moves`)).toBeVisible();
  }
);
