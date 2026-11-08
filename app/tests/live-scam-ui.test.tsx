import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Keypair } from "@solana/web3.js";
import { ScamLesson } from "../src/components/ScamLesson";
import { WalletTransaction } from "../src/components/WalletTransaction";
const mocks = vi.hoisted(() => ({
  wallet: {
    connected: true,
    publicKey: null as unknown,
    signTransaction: vi.fn(),
  },
  prepare: vi.fn(),
  submit: vi.fn(),
  read: vi.fn(),
  pending: vi.fn(),
  reconcile: vi.fn(),
  useWallet: vi.fn(),
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => {
    mocks.useWallet();
    return mocks.wallet;
  },
  useConnection: () => ({ connection: { rpcEndpoint: "devnet" } }),
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletMultiButton: () => <button>Connect wallet</button>,
}));
vi.mock("../src/lib/transactionLifecycle", () => ({
  prepareRequest: (...a: unknown[]) => mocks.prepare(...a),
  submitRequest: (...a: unknown[]) => mocks.submit(...a),
  reconcileRequest: (...a: unknown[]) => mocks.reconcile(...a),
  readTransactionAttempt: (...a: unknown[]) => mocks.read(...a),
  pendingTransaction: (...a: unknown[]) => mocks.pending(...a),
  withTransactionLock: (_owner: string, task: () => unknown) => task(),
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.wallet = {
    connected: true,
    publicKey: Keypair.generate().publicKey,
    signTransaction: vi.fn(),
  };
  mocks.read.mockReturnValue(null);
  mocks.pending.mockReturnValue(null);
  mocks.prepare.mockResolvedValue({
    owner: "A",
    network: "devnet",
    action: "transfer",
    recipient: "B",
    feeLamports: 5000,
    blockhash: "hash",
    lastValidBlockHeight: 100,
    message: "exact reviewed message",
  });
});
afterEach(cleanup);
it("never exposes live launch controls or accesses a wallet in threat lessons", () => {
  for (const id of ["scam.airdrop", "scam.message", "scam.approval"]) {
    const view = render(<ScamLesson scenarioId={id} />);
    expect(
      screen.queryByRole("button", { name: "Real wallet practice" }),
    ).toBeNull();
    view.unmount();
  }
  expect(mocks.useWallet).not.toHaveBeenCalled();
  expect(mocks.prepare).not.toHaveBeenCalled();
});
async function prepareTransfer() {
  fireEvent.change(screen.getByLabelText("Wallet B public address"), {
    target: { value: Keypair.generate().publicKey.toBase58() },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Prepare and simulate request" }),
  );
  await screen.findByText("Review this exact request · simulation passed");
}
it("requires full-address review and does not sign during preparation", async () => {
  render(<WalletTransaction action="transfer" onReceipt={vi.fn()} />);
  expect(
    (
      screen.getByRole("button", {
        name: "Prepare and simulate request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await prepareTransfer();
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(screen.getByText("exact reviewed message")).toBeTruthy();
});
it("recipient changes clear the prepared review", async () => {
  render(<WalletTransaction action="transfer" onReceipt={vi.fn()} />);
  await prepareTransfer();
  fireEvent.change(screen.getByLabelText("Wallet B public address"), {
    target: { value: Keypair.generate().publicKey.toBase58() },
  });
  expect(screen.queryByRole("button", { name: "Review in wallet" })).toBeNull();
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
});
it("owner changes clear preview and full-address acknowledgement", async () => {
  const view = render(
    <WalletTransaction action="transfer" onReceipt={vi.fn()} />,
  );
  await prepareTransfer();
  mocks.wallet.publicKey = Keypair.generate().publicKey;
  view.rerender(<WalletTransaction action="transfer" onReceipt={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "Review in wallet" })).toBeNull();
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
});
it("wallet rejection leaves course progress incomplete and permits new review", async () => {
  const done = vi.fn();
  mocks.submit.mockRejectedValue(new Error("User rejected"));
  render(<WalletTransaction action="transfer" onReceipt={done} />);
  await prepareTransfer();
  fireEvent.click(screen.getByRole("button", { name: "Review in wallet" }));
  await screen.findByText("User rejected");
  expect(done).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Review in wallet" })).toBeNull();
});
it("restores and reconciles a pending receipt without signing", async () => {
  const a = {
    action: "transfer",
    signature: "5".repeat(88),
    status: "pending",
  };
  mocks.pending.mockReturnValue(a);
  mocks.reconcile.mockResolvedValue({
    ...a,
    status: "confirmed",
    receipt: { fee: 5000, senderChange: -1005000, recipientChange: 1000000 },
  });
  const done = vi.fn();
  render(<WalletTransaction action="transfer" onReceipt={done} />);
  await waitFor(() =>
    expect(done).toHaveBeenCalledWith("transfer", a.signature),
  );
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(screen.getByText(/Recorded sender change/).textContent).toContain(
    "-1005000",
  );
});
it("unresolved outcomes prevent a second transaction", async () => {
  const a = { action: "program", signature: "5".repeat(88), status: "pending" };
  mocks.pending.mockReturnValue(a);
  mocks.reconcile.mockResolvedValue(a);
  render(<WalletTransaction action="program" onReceipt={vi.fn()} />);
  await screen.findByText(/Outcome unresolved/);
  expect(
    (
      screen.getByRole("button", {
        name: "Prepare and simulate request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
