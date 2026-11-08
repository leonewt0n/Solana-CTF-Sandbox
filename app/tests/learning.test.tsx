import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { prepareMission } from "../src/lib/program";
import { useMissionEngine } from "../src/engine/useMissionEngine";
import { MISSIONS } from "../src/content/missions";
import { Stage } from "../src/components/Stage";
import { LearningVisual } from "../src/components/LearningVisual";
import { Celebration } from "../src/components/Celebration";
import {
  completeStep,
  emptyProgress,
  initialProgress,
  readProgress,
  STEPS,
  STORAGE_PREFIX,
} from "../src/engine/progress";
const mocks = vi.hoisted(() => ({
  wallet: { connected: false, publicKey: null as PublicKey | null },
  connection: { getBalance: vi.fn(), getGenesisHash: vi.fn() },
  cast: vi.fn(),
  flag: vi.fn(),
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({ connection: mocks.connection }),
  useWallet: () => mocks.wallet,
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletMultiButton: () => <button>Connect wallet</button>,
}));
vi.mock("../src/engine/checks", () => ({
  castSpell: (...args: unknown[]) => mocks.cast(...args),
  checkFlag: (...args: unknown[]) => mocks.flag(...args),
}));
vi.mock("../src/lib/program", () => ({ prepareMission: vi.fn() }));
const walletA = new PublicKey("11111111111111111111111111111111");
const walletB = new PublicKey("Vote111111111111111111111111111111111111111");
const signature = "5".repeat(88);
const ix = (id: string) => STEPS.findIndex((s) => s.id === id);
function save(
  owner: string,
  id: string,
  completedCurrent = false,
  sig: string | null = null,
) {
  const index = ix(id);
  localStorage.setItem(
    STORAGE_PREFIX + owner,
    JSON.stringify({
      stepIndex: index,
      completed: STEPS.slice(0, index + (completedCurrent ? 1 : 0)).map(
        (s) => s.id,
      ),
      signature: sig,
    }),
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.wallet = { connected: false, publicKey: null };
  mocks.connection.getBalance.mockResolvedValue(0);
  mocks.connection.getGenesisHash.mockResolvedValue(
    "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  );
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.mocked(prepareMission).mockResolvedValue({ feeLamports: 5000 } as Awaited<
    ReturnType<typeof prepareMission>
  >);
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("learning and progress boundaries", () => {
  it("starts with a foundation and allows direct exploration without crediting skipped lessons", () => {
    const { result } = renderHook(() => useMissionEngine("anon"));
    expect(result.current.step.id).toBe("web3.why");
    act(() => result.current.navigate(ix("1.1")));
    expect(result.current.stepIndex).toBe(ix("1.1"));
    expect(result.current.completed).toEqual([]);
    act(() => result.current.navigate(0));
    act(() => result.current.confirmManual());
    expect(result.current.passed).toBe(false);
    act(() => result.current.checkAnswer("private"));
    expect(result.current.passed).toBe(false);
    act(() => result.current.checkAnswer("shared"));
    expect(result.current.passed).toBe(true);
    act(() => result.current.goNext());
    expect(result.current.step.id).toBe("web3.blockchain");
  });
  it("restores a transaction lesson without resending", () => {
    save(walletA.toBase58(), "5.1", true, signature);
    mocks.wallet = { connected: true, publicKey: walletA };
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    act(() => {
      void result.current.runCast();
    });
    expect(mocks.cast).not.toHaveBeenCalled();
    act(() => result.current.goNext());
    expect(result.current.step.id).toBe("scam.airdrop");
    expect(result.current.signature).toBe(signature);
  });
  it("carries only the pre-connection prefix into a newly connected account", () => {
    save("anon", "2.1");
    const expected = STEPS.slice(0, ix("2.1")).map((s) => s.id);
    expect(initialProgress(walletA.toBase58())).toEqual({
      stepIndex: ix("2.1"),
      completed: expected,
      signature: null,
    });
  });
  it("rejects malformed data and filters unknown lesson IDs", () => {
    localStorage.setItem(STORAGE_PREFIX + "anon", "{broken");
    expect(readProgress("anon")).toBeNull();
    localStorage.setItem(
      STORAGE_PREFIX + "anon",
      JSON.stringify({ stepIndex: 99, completed: ["unknown"], signature: "x" }),
    );
    expect(readProgress("anon")).toEqual({
      ...emptyProgress(),
      stepIndex: STEPS.length - 1,
    });
    expect(completeStep(emptyProgress(), "unknown")).toEqual(emptyProgress());
  });
  it("does not restore transaction completion without a receipt", () => {
    save(walletA.toBase58(), "6.1");
    expect(readProgress(walletA.toBase58())?.stepIndex).toBe(ix("6.1"));
    expect(readProgress(walletA.toBase58())?.completed).not.toContain("5.1");
    expect(readProgress(walletA.toBase58())?.completed).toContain(
      "scam.airdrop",
    );
  });
  it("isolates receipts on account change while keeping the current lesson view", async () => {
    save(walletA.toBase58(), "6.1", false, signature);
    mocks.wallet = { connected: true, publicKey: walletA };
    const view = render(<Stage />);
    fireEvent.click(screen.getByRole("button", { name: /Continue learning/ }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "explorer",
    );
    mocks.wallet = { connected: true, publicKey: walletB };
    view.rerender(<Stage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Why did Web3 start?",
    );
    await waitFor(() =>
      expect(readProgress(walletB.toBase58())?.signature).toBeNull(),
    );
    expect(readProgress(walletA.toBase58())?.signature).toBe(signature);
  });
  it("resets only this course record, without changing the wallet", () => {
    save(walletA.toBase58(), "6.1", false, signature);
    mocks.wallet = { connected: true, publicKey: walletA };
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    act(() => result.current.restart());
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.completed).toEqual([]);
    expect(result.current.signature).toBeNull();
    expect(mocks.wallet.publicKey).toBe(walletA);
  });
  it("leaves v2 progress intact without falsely completing new foundation lessons", () => {
    localStorage.setItem(
      "solana-learn:v2:anon",
      JSON.stringify({ stepIndex: 8, completed: ["1.1"], signature }),
    );
    expect(initialProgress("anon")).toEqual(emptyProgress());
    expect(localStorage.getItem("solana-learn:v2:anon")).not.toBeNull();
  });
});
describe("asynchronous checks", () => {
  it("ignores a balance result from a previous step", async () => {
    let resolve!: (value: number) => void;
    mocks.connection.getBalance.mockImplementation(
      () =>
        new Promise<number>((r) => {
          resolve = r;
        }),
    );
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "4.1");
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() => expect(mocks.connection.getBalance).toHaveBeenCalled());
    act(() => result.current.goBack());
    await act(async () => resolve(10000));
    expect(result.current.step.id).toBe("fees.explain");
    expect(result.current.completed).not.toContain("4.1");
    expect(result.current.balanceLamports).toBeNull();
  });
  it("reports RPC failure separately from a zero balance", async () => {
    mocks.connection.getBalance.mockRejectedValue(new Error("429"));
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "4.1");
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() => expect(result.current.failReason).toBe("balance-rpc"));
    expect(result.current.balanceLamports).toBeNull();
    expect(result.current.passed).toBe(false);
  });
  it("leaves zero balance incomplete and rejects a non-Devnet balance", async () => {
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "4.1");
    const zero = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() => expect(zero.result.current.balanceLamports).toBe(0));
    expect(zero.result.current.passed).toBe(false);
    zero.unmount();
    mocks.connection.getGenesisHash.mockResolvedValue("wrong");
    mocks.connection.getBalance.mockClear();
    const wrong = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() =>
      expect(wrong.result.current.failReason).toBe("network"),
    );
    expect(mocks.connection.getBalance).not.toHaveBeenCalled();
  });
  it("completes a positive balance check", async () => {
    mocks.connection.getBalance.mockResolvedValue(1000);
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "4.1");
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() => expect(result.current.passed).toBe(true));
  });
  it("retains failed receipts without completing the transaction lesson", async () => {
    mocks.cast.mockResolvedValue({ ok: false, reason: "execution", signature });
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "5.1");
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await act(async () => result.current.runCast());
    expect(result.current.passed).toBe(false);
    expect(result.current.signature).toBe(signature);
    expect(result.current.failReason).toBe("execution");
  });
  it("allows a declined transaction to be reviewed and retried", async () => {
    mocks.cast
      .mockResolvedValueOnce({ ok: false, reason: "rejected" })
      .mockResolvedValueOnce({ ok: true, signature });
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "5.1");
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await act(async () => result.current.runCast());
    expect(result.current.passed).toBe(false);
    expect(result.current.failReason).toBe("rejected");
    await act(async () => result.current.runCast());
    expect(result.current.passed).toBe(true);
  });
  it("deduplicates signing requests and blocks navigation while pending", async () => {
    let resolve!: (value: unknown) => void;
    mocks.cast.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "5.1");
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    act(() => {
      void result.current.runCast();
      void result.current.runCast();
      result.current.goBack();
    });
    expect(mocks.cast).toHaveBeenCalledTimes(1);
    expect(result.current.step.id).toBe("5.1");
    await act(async () => resolve({ ok: true, signature }));
    expect(result.current.passed).toBe(true);
  });
  it("ignores results after the account session unmounts", async () => {
    let resolve!: (value: unknown) => void;
    mocks.cast.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), "5.1");
    const view = renderHook(() => useMissionEngine(walletA.toBase58()));
    act(() => {
      void view.result.current.runCast();
    });
    view.unmount();
    await act(async () => resolve({ ok: true, signature }));
    expect(readProgress(walletA.toBase58())?.signature).toBeNull();
  });
});
describe("interactive explanations", () => {
  it("switches between company and shared-record models", () => {
    render(<LearningVisual kind="records" />);
    expect(screen.getByText("One operator manages the record.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Shared network" }));
    expect(
      screen.getByText("Independent participants follow shared rules."),
    ).toBeTruthy();
  });
  it("compares networks and their fee assets", () => {
    render(<LearningVisual kind="networks" />);
    expect(screen.getByText("SOL")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ethereum" }));
    expect(screen.getByText("ETH")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bitcoin" }));
    expect(screen.getByText("BTC")).toBeTruthy();
  });
  it("lets a learner fix a simulated missing fee and reset it", () => {
    render(<LearningVisual kind="fees" />);
    expect(screen.getByText("0.00")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /Add simulated test SOL/ }),
    );
    expect(screen.getByText("0.01")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset the example" }));
    expect(screen.getByText("0.00")).toBeTruthy();
    expect(mocks.cast).not.toHaveBeenCalled();
  });
  it("distinguishes failed execution from a successful receipt", () => {
    render(<LearningVisual kind="journey" />);
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Execution failed" }));
    expect(screen.getByText(/Requested state changes revert/)).toBeTruthy();
  });
  it("reveals a social-engineering clue without connecting or signing", () => {
    render(<LearningVisual kind="support" />);
    fireEvent.click(screen.getByRole("button", { name: "Show me a clue" }));
    expect(screen.getByText("Evaluate the access requested.")).toBeTruthy();
    expect(mocks.cast).not.toHaveBeenCalled();
  });
  it("supports wrong-answer feedback, retry, and review of a completed lesson", () => {
    render(<Stage />);
    fireEvent.click(
      screen.getByRole("button", { name: /Start from the beginning/ }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: /Writing a private shopping list/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Check my answer/ }));
    expect(screen.getByText("Let’s look at that again.")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: /^Next lesson/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    fireEvent.click(
      screen.getByRole("radio", {
        name: /People transferring a digital asset/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Check my answer/ }));
    expect(screen.getByText("You’ve got it.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Back/ }));
    expect(screen.getByText("You’ve got it.")).toBeTruthy();
  });
  it("opens scam practice before wallet connection without changing course progress", () => {
    render(<Stage />);
    const before = readProgress("anon");
    fireEvent.click(screen.getByRole("button", { name: "Scam practice" }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Practice the pause before approval.",
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Choose a scenario" }),
      { target: { value: "scam.blind" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Review simulated request" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve simulation" }));
    expect(mocks.cast).not.toHaveBeenCalled();
    expect(readProgress("anon")).toEqual(before);
  });
  it("opens a searchable glossary and a working progress page", () => {
    render(<Stage />);
    fireEvent.click(screen.getByRole("button", { name: "Glossary" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "Search glossary" }),
      { target: { value: "Lamport" } },
    );
    expect(within(dialog).getByText("Lamport")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close glossary" }));
    fireEvent.click(screen.getByRole("button", { name: "My progress" }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Look how far you’ve come.",
    );
  });
  it("celebrates a new module completion but not restored completion", () => {
    const completed = STEPS.slice(0, 2).map((s) => s.id);
    const view = render(<Celebration completed={completed} />);
    expect(screen.queryByText(/Module complete/)).toBeNull();
    view.unmount();
    const fresh = render(<Celebration completed={[]} />);
    fresh.rerender(<Celebration completed={completed} />);
    expect(screen.getByText("Module complete. Nicely done.")).toBeTruthy();
  });
});
it("completes the expanded course with simulated wallet/RPC, preserving the lesson on connection", async () => {
  mocks.connection.getBalance.mockResolvedValue(1000000);
  mocks.cast.mockResolvedValue({ ok: true, signature });
  mocks.flag.mockResolvedValue({ ok: true });
  const view = render(<Stage />);
  fireEvent.click(
    screen.getByRole("button", { name: /Start from the beginning/ }),
  );
  for (const step of STEPS) {
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      step.title,
    );
    if (step.action === "summary") break;
    if (step.action === "quiz") {
      const correct = screen
        .getAllByRole("radio")
        .find((r) => r.getAttribute("value") === step.quiz!.correct)!;
      fireEvent.click(correct);
      fireEvent.click(screen.getByRole("button", { name: /Check my answer/ }));
    } else if (step.verification === "self") {
      fireEvent.click(screen.getByRole("button", { name: step.confirmLabel! }));
    } else if (step.action === "connect") {
      mocks.wallet = { connected: true, publicKey: walletA };
      view.rerender(<Stage />);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        step.title,
      );
    } else if (step.action === "transaction") {
      await waitFor(() =>
        expect(
          (
            screen.getByRole("button", {
              name: /Review in wallet/,
            }) as HTMLButtonElement
          ).disabled,
        ).toBe(false),
      );
      fireEvent.click(screen.getByRole("button", { name: /Review in wallet/ }));
    } else if (step.action === "flag") {
      fireEvent.change(screen.getByLabelText("Public exercise code"), {
        target: { value: "CTF{r3ad_th3_l0gs}" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    }
    const next = () =>
      screen.getByRole("button", { name: /^Continue|^Review your progress/ });
    await waitFor(() =>
      expect((next() as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(next());
  }
  expect(
    screen
      .getByRole("progressbar", { name: "Course progress" })
      .getAttribute("value"),
  ).toBe("100");
  expect(mocks.cast).toHaveBeenCalledTimes(1);
  expect(readProgress(walletA.toBase58())?.completed).toHaveLength(
    STEPS.length - 1,
  );
  fireEvent.click(screen.getByRole("button", { name: "Overview" }));
  expect(
    screen.getByText(`${MISSIONS.length} / ${MISSIONS.length} modules`),
  ).toBeTruthy();
});
