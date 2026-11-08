import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { useMissionEngine } from "../src/engine/useMissionEngine";
import {
  completeStep,
  emptyProgress,
  initialProgress,
  normalizeProgress,
  readProgress,
  STEPS,
  STORAGE_PREFIX,
  introductoryProgress,
} from "../src/engine/progress";
import { LEGACY_LESSON_IDS } from "../src/content/legacyLessonIds";
import { ALL_SCENARIOS, inspectionTask } from "../src/content/scams";
const mocks = vi.hoisted(() => ({
  wallet: { connected: false, publicKey: null as PublicKey | null },
  connection: { getBalance: vi.fn(), getGenesisHash: vi.fn() },
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({ connection: mocks.connection }),
  useWallet: () => mocks.wallet,
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.wallet = { connected: false, publicKey: null };
  mocks.connection.getBalance.mockResolvedValue(0);
  mocks.connection.getGenesisHash.mockResolvedValue(
    "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  );
});
afterEach(cleanup);
const ix = (id: string) => STEPS.findIndex((s) => s.id === id);
it("starts with wallet safety and browsing never awards skipped completions", () => {
  const { result } = renderHook(() => useMissionEngine("anon"));
  expect(result.current.step.id).toBe("1.1");
  act(() => result.current.navigate(ix("7.1")));
  expect(result.current.completed).toEqual([]);
  act(() => result.current.goNext());
  expect(result.current.completed).toEqual([]);
});
it.each(ALL_SCENARIOS)(
  "$id blocks direct quiz bypass and incomplete assessments",
  (scenario) => {
    const { result } = renderHook(() => useMissionEngine("anon"));
    act(() => result.current.navigate(ix(scenario.id)));
    act(() => {
      expect(
        result.current.checkAnswer(result.current.step.quiz?.correct ?? "0"),
      ).toBe(false);
      result.current.confirmManual();
    });
    expect(result.current.passed).toBe(false);
    const task = inspectionTask(scenario.id, "request")!;
    act(() => {
      expect(
        result.current.assessScenario({
          variant: "request",
          inspection: "",
          decision: scenario.request.recommended,
          evidence: task.answer,
        }),
      ).toBe(false);
    });
    expect(result.current.passed).toBe(false);
    act(() =>
      result.current.assessScenario({
        variant: "request",
        inspection: task.answer,
        decision: scenario.request.recommended,
        evidence: task.answer,
      }),
    );
    expect(result.current.passed).toBe(true);
  },
);
it("migrates every v3 navigation index by frozen lesson ID, retaining originals", () => {
  for (const [stepIndex, id] of LEGACY_LESSON_IDS.entries()) {
    const raw = JSON.stringify({
      stepIndex,
      completed: ["1.1", "scam.airdrop", "5.1"],
      signature: "5".repeat(88),
    });
    localStorage.setItem("solana-learn:v3:A", raw);
    const restored = readProgress("A")!;
    expect(restored.lessonId).toBe(id);
    expect(restored.stepIndex).toBe(ix(id));
    expect(restored.completed).toContain("1.1");
    expect(restored.completed).toContain("5.1");
    expect(restored.completed).not.toContain("scam.airdrop");
    expect(restored.programSignature).toBe("5".repeat(88));
    expect(restored.transferSignature).toBeNull();
    expect(localStorage.getItem("solana-learn:v3:A")).toBe(raw);
  }
});
it("v4 restores stable lesson IDs independent of stale array positions", () => {
  const p = normalizeProgress({
    ...emptyProgress(),
    stepIndex: 999,
    lessonId: "6.1",
  });
  expect(p?.stepIndex).toBe(ix("6.1"));
});
it("never migrates another wallet's receipts or unsafe anonymous progress", () => {
  localStorage.setItem(
    STORAGE_PREFIX + "anon",
    JSON.stringify({
      ...emptyProgress(),
      completed: ["1.1", "5.1"],
      signature: "5".repeat(88),
      programSignature: "5".repeat(88),
    }),
  );
  localStorage.setItem(
    STORAGE_PREFIX + "A",
    JSON.stringify({ ...emptyProgress(), signature: "5".repeat(88) }),
  );
  const p = initialProgress("B");
  expect(p.signature).toBeNull();
  expect(p.completed).toEqual(["1.1"]);
  expect(
    introductoryProgress({ ...p, transferSignature: "5".repeat(88) })
      .transferSignature,
  ).toBeNull();
});
it("blocks receiptless transaction/transfer completion and malformed progress", () => {
  for (const id of ["5.1", "6.1", "transfer.first"])
    expect(completeStep(emptyProgress(), id).completed).toEqual([]);
  expect(normalizeProgress({})).toBeNull();
  expect(normalizeProgress({ stepIndex: "x", completed: [] })).toBeNull();
  localStorage.setItem(STORAGE_PREFIX + "anon", "{bad");
  expect(readProgress("anon")).toBeNull();
});
it("reset keeps unresolved transaction records outside course progress", () => {
  const key = "solana-learn:transactions:v1:A:transfer";
  localStorage.setItem(key, "pending");
  const { result } = renderHook(() => useMissionEngine("A"));
  act(() => result.current.restart());
  expect(localStorage.getItem(key)).toBe("pending");
});
it("checks positive Devnet funds while preserving failures as incomplete", async () => {
  mocks.wallet = {
    connected: true,
    publicKey: new PublicKey("11111111111111111111111111111111"),
  };
  mocks.connection.getBalance.mockResolvedValue(1);
  const { result } = renderHook(() => useMissionEngine("A"));
  act(() => result.current.navigate(ix("4.1")));
  await waitFor(() => expect(result.current.passed).toBe(true));
});
it("ignores late balance results after navigating away", async () => {
  let resolve!: (value: number) => void;
  mocks.connection.getBalance.mockReturnValue(
    new Promise<number>((r) => {
      resolve = r;
    }),
  );
  mocks.wallet = {
    connected: true,
    publicKey: new PublicKey("11111111111111111111111111111111"),
  };
  const { result } = renderHook(() => useMissionEngine("A"));
  act(() => result.current.navigate(ix("4.1")));
  await waitFor(() => expect(mocks.connection.getBalance).toHaveBeenCalled());
  act(() => result.current.navigate(ix("1.1")));
  await act(async () => resolve(1e9));
  expect(result.current.completed).not.toContain("4.1");
});

it("stores out-of-order scenario assessments in the canonical API order", () => {
  const { result } = renderHook(() => useMissionEngine("anon"));
  for (const scenario of [...ALL_SCENARIOS].reverse()) {
    act(() => result.current.navigate(ix(scenario.id)));
    const task = inspectionTask(scenario.id, "request")!;
    act(() =>
      result.current.assessScenario({
        variant: "request",
        inspection: task.answer,
        decision: scenario.request.recommended,
        evidence: task.answer,
      }),
    );
  }
  expect(JSON.stringify(normalizeProgress(result.current.progress))).toBe(
    JSON.stringify(result.current.progress),
  );
});
