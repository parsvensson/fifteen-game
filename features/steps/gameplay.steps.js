import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I open the game", async ({ page }) => {
  await page.goto("/");
});

When("I slide tile {string}", async ({ page }, tileValue) => {
  await page.getByRole("button", { name: tileValue }).click();
});

When("I solve from the initial board with name {string}", async ({ page }, name) => {
  page.once("dialog", async (dialog) => {
    await dialog.accept(name);
  });
  await page.getByRole("button", { name: "15" }).click();
  await page.getByRole("button", { name: "15" }).click();
});

When("I click shuffle", async ({ page }) => {
  const shuffleButton = page.getByRole("button", { name: "Shuffle" });
  await shuffleButton.click();
  await expect(shuffleButton).toBeEnabled({ timeout: 8000 });
});

Then("move count should be {int}", async ({ page }, moves) => {
  await expect(page.getByText(`Moves: ${moves}`)).toBeVisible();
});

Then("timer should be {word}", async ({ page }, timer) => {
  await expect(page.getByText(`Time: ${timer}`)).toBeVisible();
});

Then("timer should advance from 0:00", async ({ page }) => {
  await expect(page.getByText("Time: 0:00")).toBeVisible();
  await expect.poll(async () => {
    const text = await page.getByText(/^Time:/).first().innerText();
    return text !== "Time: 0:00";
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
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(`${moves} moves`)).toBeVisible();
  }
);
