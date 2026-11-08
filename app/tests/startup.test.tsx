import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import App from "../src/App";
afterEach(cleanup);
it("renders the learning home with the actual wallet provider and no connected wallet", async () => {
  render(<App />);
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Understand Web3. Practice Solana. Spot the risk.",
    }),
  ).toBeTruthy();
});
