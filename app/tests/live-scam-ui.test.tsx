import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { ScamLesson } from "../src/components/ScamLesson";
const mocks = vi.hoisted(() => ({
  wallet: {
    connected: true,
    publicKey: null as PublicKey | null,
    signTransaction: vi.fn(),
    signMessage: vi.fn(),
  },
  useWallet: vi.fn(),
  prepare: vi.fn(),
  submit: vi.fn(),
  refresh: vi.fn(),
  message: vi.fn(),
  read: vi.fn(),
  unresolved: vi.fn(),
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => {
    mocks.useWallet();
    return mocks.wallet;
  },
  useConnection: () => ({
    connection: {
      getGenesisHash: vi
        .fn()
        .mockResolvedValue("EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"),
    },
  }),
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletMultiButton: () => <button>Connect practice wallet</button>,
}));
vi.mock("../src/lib/liveScam", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/liveScam")>();
  return {
    ...actual,
    prepareTrainingTransfer: (...a: unknown[]) => mocks.prepare(...a),
    submitTrainingTransfer: (...a: unknown[]) => mocks.submit(...a),
    refreshTrainingAttempt: (...a: unknown[]) => mocks.refresh(...a),
    readAttempt: (...a: unknown[]) => mocks.read(...a),
    unresolvedAttempt: (...a: unknown[]) => mocks.unresolved(...a),
    signTrainingMessage: (...a: unknown[]) => mocks.message(...a),
    withTrainingLock: (_owner: string, task: () => unknown) => task(),
  };
});
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.wallet = {
    connected: true,
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: vi.fn(),
    signMessage: vi.fn(),
  };
  mocks.read.mockReturnValue(null);
  mocks.unresolved.mockReturnValue(null);
  mocks.prepare.mockImplementation(async (_c, key, scenario) => ({
    owner: key.toBase58(),
    scenario,
    feeLamports: 5000,
  }));
  mocks.message.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function enable(scenario = "scam.airdrop") {
  const view = render(<ScamLesson scenarioId={scenario} />);
  fireEvent.click(screen.getByRole("button", { name: "Real wallet practice" }));
  return view;
}
async function preview() {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Prepare and review request" }),
  );
  await screen.findByRole("heading", {
    name: "Payment review · simulation passed",
  });
}
it("starts with the isolated preview and does not access a wallet until live mode is selected", () => {
  render(<ScamLesson scenarioId="scam.airdrop" />);
  expect(screen.getByText("TRAINING SIMULATION")).toBeTruthy();
  expect(mocks.useWallet).not.toHaveBeenCalled();
  expect(mocks.prepare).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Real wallet practice" }));
  expect(
    (
      screen.getByRole("button", {
        name: "Prepare and review request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(mocks.prepare).not.toHaveBeenCalled();
  expect(mocks.submit).not.toHaveBeenCalled();
});
it("requires a fresh acknowledgement after the connected account changes", async () => {
  const view = enable();
  await preview();
  expect(
    screen.getByRole("button", { name: "Review the claim in my wallet" }),
  ).toBeTruthy();
  mocks.wallet = {
    ...mocks.wallet,
    publicKey: new PublicKey("Vote111111111111111111111111111111111111111"),
  };
  view.rerender(<ScamLesson scenarioId="scam.airdrop" />);
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
  expect(
    screen.queryByRole("heading", {
      name: "Payment review · simulation passed",
    }),
  ).toBeNull();
  expect(mocks.submit).not.toHaveBeenCalled();
});
it("reports wallet rejection without marking progress or inventing a loss", async () => {
  localStorage.setItem("solana-learn:v3:anon", "unchanged");
  mocks.submit.mockRejectedValue(
    Object.assign(new Error("User rejected"), { code: 4001 }),
  );
  enable();
  await preview();
  fireEvent.click(
    screen.getByRole("button", { name: "Review the claim in my wallet" }),
  );
  await screen.findByText(/Request declined in the wallet/);
  expect(screen.queryByText(/Confirmed: the practice account sent/)).toBeNull();
  expect(localStorage.getItem("solana-learn:v3:anon")).toBe("unchanged");
});
it("blocks duplicate clicks and switching modes while a wallet request is pending", async () => {
  let finish!: (v: unknown) => void;
  mocks.submit.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  mocks.refresh.mockImplementation(async (_connection, a) => a);
  enable();
  await preview();
  const request = screen.getByRole("button", {
    name: "Review the claim in my wallet",
  });
  fireEvent.click(request);
  fireEvent.click(request);
  await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
  expect(
    (
      screen.getByRole("button", {
        name: "Preview",
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  finish({
    owner: mocks.wallet.publicKey!.toBase58(),
    scenario: "scam.airdrop",
    status: "pending",
    signature: "5".repeat(88),
  });
  await screen.findByText(/successful execution has not been verified/);
  expect(
    screen.queryByRole("button", { name: "Review the claim in my wallet" }),
  ).toBeNull();
  expect(
    (
      screen.getByRole("button", {
        name: "Prepare and review request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
it("shows unsupported signing methods without a fallback request", () => {
  mocks.wallet.signTransaction = undefined as never;
  enable();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("alert").textContent).toContain("does not support");
  expect(
    (
      screen.getByRole("button", {
        name: "Prepare and review request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(mocks.submit).not.toHaveBeenCalled();
});
it("leaves secret-collection and permission scenarios as isolated simulations", () => {
  render(<ScamLesson scenarioId="scam.delegate" />);
  expect(
    screen.queryByRole("button", { name: "Real wallet practice" }),
  ).toBeNull();
  expect(mocks.useWallet).not.toHaveBeenCalled();
});
it("reviews the training message before signing and never treats it as a transfer", async () => {
  enable("scam.message");
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Prepare and review request" }),
  );
  await screen.findByLabelText("Exact training message");
  expect(screen.getByLabelText("Exact training message").textContent).toContain(
    "TRAINING ONLY",
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Review the training message in my wallet",
    }),
  );
  await screen.findByText(/Training message signature verified/);
  expect(mocks.message).toHaveBeenCalledTimes(1);
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(screen.queryByText(/Confirmed: the practice account sent/)).toBeNull();
});
it("restores a pending receipt without signing and explains a failed result separately", async () => {
  const a = {
    owner: mocks.wallet.publicKey!.toBase58(),
    scenario: "scam.blind",
    status: "pending",
    signature: "5".repeat(88),
  };
  mocks.unresolved.mockReturnValue(a);
  mocks.refresh.mockResolvedValue({ ...a, status: "failed" });
  enable();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(
    (
      screen.getByRole("button", {
        name: "Prepare and review request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Check saved receipt" }));
  await screen.findByText(/Execution failed: the transfer did not take effect/);
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(mocks.prepare).not.toHaveBeenCalled();
  expect(screen.queryByText(/Confirmed: the practice account sent/)).toBeNull();
});
