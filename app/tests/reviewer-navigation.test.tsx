import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Stage } from "../src/components/Stage";
import { MISSIONS } from "../src/content/missions";
import { EXTRA_SCAM_SCENARIOS } from "../src/content/scams";
import { useMissionEngine } from "../src/engine/useMissionEngine";
import {
  STEPS,
  emptyProgress,
  introductoryProgress,
  mergeIntroductoryProgress,
  normalizeProgress,
  readProgress,
} from "../src/engine/progress";
const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({ connected: false, publicKey: null }),
  useConnection: () => ({ connection: {} }),
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletMultiButton: () => <button>Connect wallet</button>,
}));
vi.mock("../src/engine/checks", () => ({
  castSpell: (...args: unknown[]) => mocks.send(...args),
  checkFlag: vi.fn(),
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline test")));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("explains the platform on arrival and exposes useful demo shortcuts", () => {
  render(<Stage />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "Understand Web3. Practice Solana.",
  );
  expect(
    screen.getByRole("heading", {
      name: "From understanding an idea to checking what you approve.",
    }),
  ).toBeTruthy();
  expect(screen.getByText("9 open modules")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Try a scam simulation" }),
  );
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "Practice the pause before approval.",
  );
  expect(mocks.send).not.toHaveBeenCalled();
  expect(readProgress("anon")?.completed).toEqual([]);
});
it("opens every module and the final summary without marking them complete", () => {
  render(<Stage />);
  for (const mission of MISSIONS) {
    const card = screen.getByRole("button", {
      name: new RegExp("MODULE.*" + mission.name),
    });
    expect((card as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(card);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      mission.steps[0].title,
    );
    expect(readProgress("anon")?.completed).toEqual([]);
    expect(
      screen
        .getByRole("progressbar", { name: "Course progress" })
        .getAttribute("value"),
    ).toBe("0");
    if (mission.steps[0].action === "summary")
      expect(
        screen.queryByText("You’ve completed the walkthrough."),
      ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
  }
  expect(mocks.send).not.toHaveBeenCalled();
});
it("lets a reviewer click any lesson inside a later module", () => {
  render(<Stage />);
  fireEvent.click(
    screen.getByRole("button", { name: /MODULE.*Scam practice lab/ }),
  );
  for (const scenario of [...EXTRA_SCAM_SCENARIOS].reverse()) {
    const button = screen
      .getAllByRole("button")
      .find((item) => item.textContent?.includes(scenario.title))!;
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      scenario.title,
    );
  }
  expect(readProgress("anon")?.completed).toEqual([]);
});
it("saves an out-of-order quiz and restores its location after remount", () => {
  const index = STEPS.findIndex((step) => step.id === "scam.delegate");
  const first = renderHook(() => useMissionEngine("anon"));
  act(() => first.result.current.navigate(index));
  act(() => first.result.current.checkAnswer(STEPS[index].quiz!.correct));
  expect(first.result.current.passed).toBe(true);
  expect(first.result.current.completed).toEqual(["scam.delegate"]);
  expect(first.result.current.stepIndex).toBe(index);
  first.unmount();
  const second = renderHook(() => useMissionEngine("anon"));
  expect(second.result.current.stepIndex).toBe(index);
  expect(second.result.current.completed).toEqual(["scam.delegate"]);
});
it("can skip an unchecked lesson without awarding completion", () => {
  const { result } = renderHook(() => useMissionEngine("anon"));
  act(() => result.current.goNext());
  expect(result.current.stepIndex).toBe(1);
  expect(result.current.completed).toEqual([]);
});
it("preserves independent introductory checks when merging a browser transfer", () => {
  const local = { stepIndex: 1, completed: [STEPS[0].id], signature: null };
  const incoming = { stepIndex: 2, completed: [STEPS[1].id], signature: null };
  expect(mergeIntroductoryProgress(local, incoming).completed).toEqual([
    STEPS[0].id,
    STEPS[1].id,
  ]);
  const projected = introductoryProgress({
    stepIndex: 22,
    completed: [STEPS[1].id, "scam.delegate"],
    signature: "5".repeat(88),
  });
  expect(projected.completed).toEqual([STEPS[1].id]);
  expect(projected.signature).toBeNull();
  expect(
    normalizeProgress({
      ...emptyProgress(),
      stepIndex: 22,
      completed: ["scam.delegate", STEPS[1].id],
    }),
  ).toMatchObject({ stepIndex: 22, completed: [STEPS[1].id, "scam.delegate"] });
});
