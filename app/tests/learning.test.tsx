import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { prepareMission } from "../src/lib/program";
import { useMissionEngine } from "../src/engine/useMissionEngine";
import { Stage } from "../src/components/Stage";
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
function save(
  owner: string,
  stepIndex: number,
  completeCount: number,
  sig: string | null = null,
) {
  localStorage.setItem(
    STORAGE_PREFIX + owner,
    JSON.stringify({
      stepIndex,
      completed: STEPS.slice(0, completeCount).map((s) => s.id),
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
});
afterEach(() => {
  cleanup();
});

describe("progress boundaries", () => {
  it("starts at wallet installation and cannot skip an incomplete lesson", () => {
    const { result } = renderHook(() => useMissionEngine("anon"));
    expect(result.current.step.id).toBe("1.1");
    act(() => result.current.navigate(5));
    expect(result.current.stepIndex).toBe(0);
    act(() => result.current.confirmManual());
    act(() => result.current.goNext());
    expect(result.current.step.id).toBe("1.2");
  });
  it("restores a completed lesson for review without requiring another transaction", () => {
    save(walletA.toBase58(), 6, 7, signature);
    mocks.wallet = { connected: true, publicKey: walletA };
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    expect(result.current.passed).toBe(true);
    act(() => {
      void result.current.runCast();
    });
    expect(mocks.cast).not.toHaveBeenCalled();
    act(() => result.current.goNext());
    expect(result.current.step.id).toBe("6.1");
    expect(result.current.signature).toBe(signature);
  });
  it("transfers only anonymous setup acknowledgments into a new account", () => {
    save("anon", 3, 3);
    expect(initialProgress(walletA.toBase58())).toEqual({
      stepIndex: 3,
      completed: ["1.1", "1.2", "1.3"],
      signature: null,
    });
  });
  it("rejects malformed and out-of-order saved completion", () => {
    localStorage.setItem(STORAGE_PREFIX + "anon", "{broken");
    expect(readProgress("anon")).toBeNull();
    localStorage.setItem(
      STORAGE_PREFIX + "anon",
      JSON.stringify({ stepIndex: 99, completed: ["6.2"], signature: "x" }),
    );
    expect(readProgress("anon")).toEqual(emptyProgress());
    expect(completeStep(emptyProgress(), "6.2")).toEqual(emptyProgress());
  });
  it("does not restore transaction completion without a receipt", () => {
    save(walletA.toBase58(), 9, 9);
    expect(readProgress(walletA.toBase58())?.stepIndex).toBe(6);
    expect(readProgress(walletA.toBase58())?.completed).toHaveLength(6);
  });
  it("isolates progress and receipt when the connected wallet changes", async () => {
    save(walletA.toBase58(), 7, 7, signature);
    mocks.wallet = { connected: true, publicKey: walletA };
    const view = render(<Stage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "explorer",
    );
    mocks.wallet = { connected: true, publicKey: walletB };
    view.rerender(<Stage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "wallet is your way",
    );
    await waitFor(() =>
      expect(readProgress(walletB.toBase58())?.signature).toBeNull(),
    );
    expect(readProgress(walletA.toBase58())?.signature).toBe(signature);
  });
  it("resets course progress without changing the wallet", () => {
    save(walletA.toBase58(), 7, 7, signature);
    mocks.wallet = { connected: true, publicKey: walletA };
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    act(() => result.current.restart());
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.completed).toEqual([]);
    expect(result.current.signature).toBeNull();
    expect(mocks.wallet.publicKey).toBe(walletA);
  });
});

describe("asynchronous checks", () => {
  it("does not let an old balance response pass another lesson", async () => {
    let resolve!: (balance: number) => void;
    mocks.connection.getBalance.mockImplementation(
      () =>
        new Promise<number>((r) => {
          resolve = r;
        }),
    );
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), 5, 5);
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() => expect(mocks.connection.getBalance).toHaveBeenCalled());
    act(() => result.current.goBack());
    await act(async () => {
      resolve(10000);
    });
    expect(result.current.step.id).toBe("3.1");
    expect(result.current.passed).toBe(true);
    expect(result.current.completed).not.toContain("4.1");
    expect(result.current.balanceLamports).toBeNull();
  });
  it("shows RPC failure instead of claiming a zero balance", async () => {
    mocks.connection.getBalance.mockRejectedValue(new Error("429"));
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), 5, 5);
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() => expect(result.current.failReason).toBe("balance-rpc"));
    expect(result.current.balanceLamports).toBeNull();
    expect(result.current.passed).toBe(false);
  });
  it("completes a positive balance check", async () => {
    mocks.connection.getBalance.mockResolvedValue(10000);
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), 5, 5);
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await waitFor(() => expect(result.current.passed).toBe(true));
  });
  it("preserves failed transaction receipts without awarding completion", async () => {
    mocks.cast.mockResolvedValue({ ok: false, reason: "execution", signature });
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), 6, 6);
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    await act(async () => {
      await result.current.runCast();
    });
    expect(result.current.passed).toBe(false);
    expect(result.current.signature).toBe(signature);
    expect(result.current.failReason).toBe("execution");
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
    save(walletA.toBase58(), 6, 6);
    const { result } = renderHook(() => useMissionEngine(walletA.toBase58()));
    act(() => {
      void result.current.runCast();
      void result.current.runCast();
      result.current.goBack();
    });
    expect(mocks.cast).toHaveBeenCalledTimes(1);
    expect(result.current.stepIndex).toBe(6);
    await act(async () => {
      resolve({ ok: true, signature });
    });
    expect(result.current.passed).toBe(true);
  });
  it("ignores a transaction result after the account session unmounts", async () => {
    let resolve!: (value: unknown) => void;
    mocks.cast.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    mocks.wallet = { connected: true, publicKey: walletA };
    save(walletA.toBase58(), 6, 6);
    const view = renderHook(() => useMissionEngine(walletA.toBase58()));
    act(() => {
      void view.result.current.runCast();
    });
    view.unmount();
    await act(async () => {
      resolve({ ok: true, signature });
    });
    expect(readProgress(walletA.toBase58())?.signature).toBeNull();
  });
});

describe("lesson interface", () => {
  it("presents instructions, expands definitions, and lets a beginner advance and go back", () => {
    render(<Stage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "wallet",
    );
    expect(
      screen.getByRole("heading", { name: "Here’s what to do" }),
    ).toBeTruthy();
    const terms = screen.getByText("Understand the terms").closest("details")!;
    expect(terms.open).toBe(false);
    fireEvent.click(screen.getByText("Understand the terms"));
    expect(terms.open).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "My wallet app is ready" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "fresh practice wallet",
    );
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(
      (screen.getByRole("button", { name: "✓ Confirmed" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "wallet is your way",
    );
  });
});

it("completes the full walkthrough with simulated wallet and RPC checks", async () => {
  vi.mocked(prepareMission).mockResolvedValue({ feeLamports: 5000 } as Awaited<
    ReturnType<typeof prepareMission>
  >);
  mocks.connection.getBalance.mockResolvedValue(1000000);
  mocks.cast.mockResolvedValue({ ok: true, signature });
  mocks.flag.mockResolvedValue({ ok: true });
  const view = render(<Stage />);
  for (const label of [
    "My wallet app is ready",
    "I created my practice wallet",
    "I saved my backup privately",
  ]) {
    fireEvent.click(screen.getByRole("button", { name: label }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
  }
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "Connect",
  );
  mocks.wallet = { connected: true, publicKey: walletA };
  view.rerender(<Stage />);
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: /Continue/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
  fireEvent.click(
    screen.getByRole("button", {
      name: "I checked that my wallet uses Devnet",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: /Continue/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: /Review in wallet/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  expect(screen.getByText("5000 lamports (0.000005 SOL)")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Review in wallet/ }));
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: /Continue/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
  expect(
    screen
      .getByRole("link", { name: /Inspect in Solana Explorer/ })
      .getAttribute("href"),
  ).toContain("cluster=devnet");
  fireEvent.click(
    screen.getByRole("button", {
      name: "I inspected the receipt and found the code",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
  fireEvent.change(screen.getByLabelText("Public exercise code"), {
    target: { value: "CTF{r3ad_th3_l0gs}" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: /Review your progress/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: /Review your progress/ }));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "first steps, understood",
  );
  expect(screen.getByRole("progressbar").getAttribute("value")).toBe("100");
  expect(mocks.cast).toHaveBeenCalledTimes(1);
});

it("keeps zero balance incomplete and blocks balances from a non-Devnet RPC", async () => {
  mocks.wallet = { connected: true, publicKey: walletA };
  save(walletA.toBase58(), 5, 5);
  const zero = renderHook(() => useMissionEngine(walletA.toBase58()));
  await waitFor(() => expect(zero.result.current.balanceLamports).toBe(0));
  expect(zero.result.current.passed).toBe(false);
  zero.unmount();
  mocks.connection.getGenesisHash.mockResolvedValue("wrong-network");
  mocks.connection.getBalance.mockClear();
  const wrong = renderHook(() => useMissionEngine(walletA.toBase58()));
  await waitFor(() => expect(wrong.result.current.failReason).toBe("network"));
  expect(mocks.connection.getBalance).not.toHaveBeenCalled();
  expect(wrong.result.current.passed).toBe(false);
});
