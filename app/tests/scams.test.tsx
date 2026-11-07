import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCAM_SCENARIOS, EXTRA_SCAM_SCENARIOS } from "../src/content/scams";
import { ScamSimulator } from "../src/components/ScamSimulator";
import { ScamPractice } from "../src/components/ScamPractice";
import {
  STEPS,
  STORAGE_PREFIX,
  normalizeProgress,
} from "../src/engine/progress";
const wallet = vi.hoisted(() => ({
  useWallet: vi.fn(() => {
    throw new Error("A simulation must never access a wallet");
  }),
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: wallet.useWallet,
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(window, "open").mockImplementation(() => null);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each(SCAM_SCENARIOS)("$id training actions", (scenario) => {
  it("explains both choices without signing, sending, navigating, or collecting secrets", () => {
    const { container } = render(<ScamSimulator scenarioId={scenario.id} />);
    expect(screen.getByText("TRAINING SIMULATION")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Review simulated request" }),
    );
    expect(screen.getAllByText(scenario.request.origin).length).toBeGreaterThan(
      0,
    );
    for (const choice of scenario.request.choices) {
      fireEvent.click(
        screen.getByRole("button", { name: choice.label, exact: true }),
      );
      expect(
        within(screen.getByRole("status")).getByText(choice.feedback),
      ).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("button", { name: "Show the clues" }));
    for (const clue of scenario.request.clues)
      expect(screen.getByText(clue)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset simulation" }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(
      container.querySelector("input, textarea, a, iframe, form"),
    ).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(wallet.useWallet).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });
});
it("compares a suspicious message with an expected login, while allowing either to be declined", () => {
  render(<ScamSimulator scenarioId="scam.message" />);
  fireEvent.click(
    screen.getByRole("button", { name: "Review simulated request" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Expected login comparison" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Approve simulation" }));
  expect(screen.getByRole("status").textContent).toContain(
    "authenticate a website session",
  );
  expect(screen.getByRole("status").textContent).toContain(
    "would not itself transfer SOL",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Reject simulated request" }),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "Declining is always acceptable",
  );
  expect(fetch).not.toHaveBeenCalled();
});
it("distinguishes an unwanted token permission from recovery-phrase exposure", () => {
  render(<ScamSimulator scenarioId="scam.response" />);
  fireEvent.click(
    screen.getByRole("button", { name: "Review simulated request" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Token permission comparison" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Reject simulated request" }),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "does not revoke the token-account delegate",
  );
  expect(fetch).not.toHaveBeenCalled();
});
it("offers all scenarios without changing a learner's saved course position", () => {
  const saved = JSON.stringify({
    stepIndex: 1,
    completed: [STEPS[0].id],
    signature: null,
  });
  localStorage.setItem(STORAGE_PREFIX + "anon", saved);
  render(<ScamPractice heading={{ current: null }} />);
  const picker = screen.getByRole("combobox", { name: "Choose a scenario" });
  expect(within(picker).getAllByRole("option")).toHaveLength(14);
  fireEvent.change(picker, { target: { value: "scam.delegate" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Review simulated request" }),
  );
  expect(screen.getByText("Approve delegate")).toBeTruthy();
  expect(localStorage.getItem(STORAGE_PREFIX + "anon")).toBe(saved);
  expect(wallet.useWallet).not.toHaveBeenCalled();
});
it("preserves the previous course completion and receipt while exposing the new lab", () => {
  const newIds = new Set(EXTRA_SCAM_SCENARIOS.map((s) => s.id));
  const previous = STEPS.filter((step) => !newIds.has(step.id));
  expect(previous).toHaveLength(19);
  expect(STEPS).toHaveLength(30);
  const completed = previous.slice(0, -1).map((step) => step.id);
  const saved = {
    stepIndex: previous.length - 1,
    completed,
    signature: "5".repeat(88),
  };
  const restored = normalizeProgress(saved)!;
  expect(restored).toEqual(saved);
  expect(STEPS[restored.stepIndex].id).toBe(EXTRA_SCAM_SCENARIOS[0].id);
  expect(restored.completed).not.toContain(EXTRA_SCAM_SCENARIOS[0].id);
  expect(restored.signature).toBe(saved.signature);
});
it("has unique, referenced scenarios and a valid learning check for every new lesson", () => {
  expect(new Set(SCAM_SCENARIOS.map((s) => s.id)).size).toBe(14);
  for (const scenario of SCAM_SCENARIOS) {
    const lesson = STEPS.find((step) => step.scamScenario === scenario.id)!;
    expect(lesson).toBeTruthy();
    expect(lesson.id).toBe(scenario.id);
    expect(
      scenario.request.choices.some(
        (c) => c.id === scenario.request.recommended,
      ),
    ).toBe(true);
    expect(scenario.correct).toBeGreaterThanOrEqual(0);
    expect(scenario.correct).toBeLessThan(scenario.answers.length);
  }
});
