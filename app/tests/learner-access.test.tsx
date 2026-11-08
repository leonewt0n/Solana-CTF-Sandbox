import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { LearnerAccess } from "../src/components/LearnerAccess";
import {
  STEPS,
  emptyProgress,
  introductoryProgress,
  type Progress,
} from "../src/engine/progress";
import worker from "../worker/index";
const mocks = vi.hoisted(() => ({
  account: {
    learner: null,
    emailAvailable: true,
    localEmail: true,
    loaded: true,
    refresh: vi.fn(),
  },
}));
vi.mock("../src/context/LearnerAccount", () => ({
  useLearnerAccount: () => mocks.account,
}));
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  mocks.account.emailAvailable = true;
  mocks.account.refresh.mockReset();
  mocks.account.refresh.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function Harness({ initial = emptyProgress() }: { initial?: Progress }) {
  const [progress, set] = useState(initial);
  return (
    <>
      <LearnerAccess progress={progress} restore={set} busy={false} />
      <output aria-label="Progress snapshot">{JSON.stringify(progress)}</output>
    </>
  );
}
it("supports email codes without a connected wallet", async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(Response.json({ ok: true, localCode: "12345678" }))
    .mockResolvedValueOnce(Response.json({ ok: true }));
  render(<Harness />);
  fireEvent.click(
    screen.getByRole("button", { name: "Save or move progress" }),
  );
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "learner@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
  await waitFor(() =>
    expect(screen.getByText(/Local development only: 12345678/)).toBeTruthy(),
  );
  fireEvent.change(screen.getByLabelText("Eight-digit sign-in code"), {
    target: { value: "12345678" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in with code" }));
  await waitFor(() => expect(mocks.account.refresh).toHaveBeenCalledTimes(1));
  expect(vi.mocked(fetch).mock.calls.map((call) => call[0])).toEqual([
    "/api/account/code",
    "/api/account/verify",
  ]);
});
it("restores introductory progress from a browser-transfer code without email login", async () => {
  mocks.account.emailAvailable = false;
  const progress = {
    ...emptyProgress(),
    lessonId: STEPS[2].id,
    stepIndex: 2,
    completed: STEPS.slice(0, 2).map((step) => step.id),
    signature: null,
  };
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({ version: 4, progress }),
  );
  render(<Harness />);
  fireEvent.click(
    screen.getByRole("button", { name: "Save or move progress" }),
  );
  expect(screen.getByText(/Email sign-in is not enabled yet/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Code from your other browser"), {
    target: { value: "ABCD-1234-ABCD-1234-ABCD" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Resume with transfer code" }),
  );
  await waitFor(() =>
    expect(
      JSON.parse(screen.getByLabelText("Progress snapshot").textContent!),
    ).toEqual(progress),
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("a transfer never replaces more advanced wallet progress or receipts", async () => {
  const tx = STEPS.findIndex((step) => step.action === "transaction");
  const full = {
    stepIndex: tx + 1,
    completed: STEPS.slice(0, tx + 1).map((step) => step.id),
    signature: "5".repeat(88),
  };
  const portable = introductoryProgress(full);
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({ version: 3, progress: portable }),
  );
  render(<Harness initial={full} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Save or move progress" }),
  );
  fireEvent.change(screen.getByLabelText("Code from your other browser"), {
    target: { value: "ABCD-1234-ABCD-1234-ABCD" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Resume with transfer code" }),
  );
  await waitFor(() =>
    expect(screen.getByText(/introductory learning is restored/)).toBeTruthy(),
  );
  expect(
    JSON.parse(screen.getByLabelText("Progress snapshot").textContent!),
  ).toEqual(full);
});
it("local email test mode cannot expose codes on a public HTTPS URL", async () => {
  const env = {
    DB: {},
    EMAIL_MODE: "local",
    EMAIL_CODE_SECRET: "local-testing-secret-that-is-long-enough",
    EMAIL_FROM: "",
    EMAIL: {},
  };
  const response = await worker.fetch(
    new Request("https://solana-learn.example/api/account"),
    env as never,
  );
  const data = (await response.json()) as {
    emailAvailable: boolean;
    localEmail: boolean;
  };
  expect(data.emailAvailable).toBe(false);
  expect(data.localEmail).toBe(false);
  const attempt = await worker.fetch(
    new Request("https://solana-learn.example/api/account/code", {
      method: "POST",
      headers: {
        Origin: "https://solana-learn.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "learner@example.test" }),
    }),
    env as never,
  );
  expect(attempt.status).toBe(503);
  expect(await attempt.text()).not.toContain("localCode");
});
