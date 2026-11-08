// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { Keypair, Transaction, type Connection } from "@solana/web3.js";
import {
  prepareRequest,
  submitRequest,
  reconcileRequest,
  pendingTransaction,
  readTransactionAttempt,
  destination,
} from "../src/lib/transactionLifecycle";
import { prepareMission } from "../src/lib/program";
import { classifyTxError } from "../src/engine/checks";
import { verifyFlag } from "../src/lib/flag";
class MemoryStorage {
  values = new Map<string, string>();
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
  clear() {
    this.values.clear();
  }
}
vi.stubGlobal("Storage", MemoryStorage);
vi.stubGlobal("localStorage", new MemoryStorage());
const owner = Keypair.generate();
const recipient = Keypair.generate().publicKey.toBase58();
let connection: Connection;
let signed: Transaction;
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  connection = {
    rpcEndpoint: "https://devnet.example",
    getGenesisHash: vi
      .fn()
      .mockResolvedValue("EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"),
    getAccountInfo: vi.fn().mockResolvedValue({ executable: true }),
    getLatestBlockhashAndContext: vi.fn().mockResolvedValue({
      context: { slot: 1 },
      value: {
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      },
    }),
    getFeeForMessage: vi.fn().mockResolvedValue({ value: 5000 }),
    getBalance: vi.fn().mockResolvedValue(2e6),
    simulateTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    getBlockHeight: vi.fn().mockResolvedValue(1),
    sendRawTransaction: vi.fn().mockImplementation(async () => {
      const bs58 = (await import("bs58")).default;
      return bs58.encode(signed.signature!);
    }),
    getSignatureStatuses: vi.fn().mockResolvedValue({ value: [null] }),
    getTransaction: vi.fn(),
  } as unknown as Connection;
});
const sign = vi.fn(async (tx: Transaction) => {
  tx.sign(owner);
  signed = tx;
  return tx;
});
const prepare = () =>
  prepareRequest(connection, owner.publicKey, "transfer", recipient);
it("rejects invalid, self and program destinations", () => {
  expect(() => destination(owner.publicKey, "secret words")).toThrow();
  expect(() =>
    destination(owner.publicKey, owner.publicKey.toBase58()),
  ).toThrow();
});
it.each(["transfer", "program"] as const)(
  "%s signs the exact simulated message and persists before broadcast",
  async (action) => {
    const p = await prepareRequest(
      connection,
      owner.publicKey,
      action,
      action === "transfer" ? recipient : null,
    );
    vi.mocked(connection.sendRawTransaction).mockImplementation(async () => {
      expect(readTransactionAttempt(p.owner, action)?.status).toBe("pending");
      return readTransactionAttempt(p.owner, action)!.signature;
    });
    const a = await submitRequest(connection, p, sign, () => true);
    expect(p.transaction.serializeMessage()).toEqual(signed.serializeMessage());
    expect(connection.simulateTransaction).toHaveBeenCalledTimes(1);
    expect(pendingTransaction(p.owner)?.signature).toBe(a.signature);
    await expect(prepare()).rejects.toThrow(/pending/);
  },
);
it.each(["network", "fee", "balance", "simulation", "program"])(
  "blocks %s failure before signing",
  async (failure) => {
    if (failure === "network")
      vi.mocked(connection.getGenesisHash).mockResolvedValue("mainnet");
    if (failure === "fee")
      vi.mocked(connection.getFeeForMessage).mockResolvedValue({
        value: 50001,
        context: { slot: 1 },
      });
    if (failure === "balance")
      vi.mocked(connection.getBalance).mockResolvedValue(0);
    if (failure === "simulation")
      vi.mocked(connection.simulateTransaction).mockResolvedValue({
        value: { err: "failure" },
        context: { slot: 1 },
      } as never);
    if (failure === "program")
      vi.mocked(connection.getAccountInfo).mockResolvedValue(null);
    await expect(prepareMission(connection, owner.publicKey)).rejects.toThrow();
  },
);
it("requires a fresh preview after expiry", async () => {
  const p = await prepare();
  const signer = vi.fn();
  vi.mocked(connection.getBlockHeight).mockResolvedValue(101);
  await expect(
    submitRequest(connection, p, signer, () => true),
  ).rejects.toThrow(/expired/);
  expect(signer).not.toHaveBeenCalled();
});
it("rejects changed instructions, metadata and signed contents", async () => {
  const p = await prepare();
  p.transaction.instructions[0].data[4] ^= 1;
  await expect(submitRequest(connection, p, sign, () => true)).rejects.toThrow(
    /changed/,
  );
  const q = await prepare();
  q.recipient = Keypair.generate().publicKey.toBase58();
  await expect(submitRequest(connection, q, sign, () => true)).rejects.toThrow(
    /changed/,
  );
  const r = await prepare();
  await expect(
    submitRequest(
      connection,
      r,
      async (tx) => {
        tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
        tx.sign(owner);
        return tx;
      },
      () => true,
    ),
  ).rejects.toThrow(/differ/);
  expect(connection.sendRawTransaction).not.toHaveBeenCalled();
});
it("does not broadcast when wallet rejects or changes", async () => {
  const p = await prepare();
  await expect(
    submitRequest(
      connection,
      p,
      async () => {
        throw new Error("User rejected");
      },
      () => true,
    ),
  ).rejects.toThrow(/rejected/);
  let active = true;
  await expect(
    submitRequest(
      connection,
      p,
      async (tx) => {
        tx.sign(owner);
        active = false;
        return tx;
      },
      () => active,
    ),
  ).rejects.toThrow(/changed/);
  expect(connection.sendRawTransaction).not.toHaveBeenCalled();
});
it("stops submission when durable storage fails", async () => {
  const p = await prepare();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("storage failed");
  });
  await expect(submitRequest(connection, p, sign, () => true)).rejects.toThrow(
    /storage/,
  );
  expect(connection.sendRawTransaction).not.toHaveBeenCalled();
});
it("recovers after interrupted broadcast and validates receipt balance changes", async () => {
  const p = await prepare();
  vi.mocked(connection.sendRawTransaction).mockRejectedValueOnce(
    new Error("timeout"),
  );
  await expect(submitRequest(connection, p, sign, () => true)).rejects.toThrow(
    /timeout/,
  );
  const a = readTransactionAttempt(p.owner, "transfer")!;
  expect(a.status).toBe("pending");
  vi.mocked(connection.getSignatureStatuses).mockResolvedValue({
    value: [{ confirmationStatus: "confirmed" }],
    context: { slot: 2 },
  } as never);
  const msg = signed.compileMessage();
  const sender = msg.accountKeys.findIndex((k) => k.equals(owner.publicKey));
  const target = msg.accountKeys.findIndex((k) => k.toBase58() === recipient);
  const pre = msg.accountKeys.map(() => 2e6);
  const post = [...pre];
  post[sender] -= 1005000;
  post[target] += 1e6;
  vi.mocked(connection.getTransaction).mockResolvedValue({
    transaction: { message: msg, signatures: [a.signature] },
    meta: { err: null, fee: 5000, preBalances: pre, postBalances: post },
  } as never);
  expect((await reconcileRequest(connection, a)).status).toBe("confirmed");
  expect(pendingTransaction(p.owner)).toBeNull();
  post[target]--;
  await expect(reconcileRequest(connection, a)).rejects.toThrow(
    /balance changes/,
  );
});
it("requires historical lookup and finalized lifetime before closing an absent attempt", async () => {
  const p = await prepare();
  const a = await submitRequest(connection, p, sign, () => true);
  expect((await reconcileRequest(connection, a)).status).toBe("pending");
  vi.mocked(connection.getBlockHeight).mockResolvedValue(101);
  expect((await reconcileRequest(connection, a)).status).toBe("expired");
  expect(connection.getSignatureStatuses).toHaveBeenCalledWith([a.signature], {
    searchTransactionHistory: true,
  });
});
it("classifies errors and checks only the public practice code", async () => {
  expect(classifyTxError(new Error("User rejected request"))).toBe("rejected");
  expect(classifyTxError(new Error("Blockhash expired"))).toBe("expired");
  expect(await verifyFlag("CTF{r3ad_th3_l0gs}")).toBe(true);
  expect(await verifyFlag("CTF{wrong}")).toBe(false);
});

it("retains a signed attempt when expiry occurs inside the wallet", async () => {
  const p = await prepare();
  await expect(
    submitRequest(
      connection,
      p,
      async (tx) => {
        tx.sign(owner);
        vi.mocked(connection.getBlockHeight).mockResolvedValue(101);
        return tx;
      },
      () => true,
    ),
  ).rejects.toThrow(/expired/);
  expect(readTransactionAttempt(p.owner, "transfer")?.status).toBe("signed");
  expect(connection.sendRawTransaction).not.toHaveBeenCalled();
});
it("confirmation interruptions remain unresolved after restoration", async () => {
  const p = await prepare();
  const a = await submitRequest(connection, p, sign, () => true);
  vi.mocked(connection.getSignatureStatuses).mockRejectedValue(
    new Error("confirmation timeout"),
  );
  await expect(reconcileRequest(connection, a)).rejects.toThrow(/timeout/);
  expect(pendingTransaction(p.owner)?.signature).toBe(a.signature);
  await expect(prepare()).rejects.toThrow(/pending/);
});
it("validates a failed program execution without inventing a successful call", async () => {
  const p = await prepareMission(connection, owner.publicKey);
  const a = await submitRequest(connection, p, sign, () => true);
  const msg = signed.compileMessage();
  const pre = msg.accountKeys.map(() => 2e6);
  const post = [...pre];
  post[0] -= 5000;
  vi.mocked(connection.getSignatureStatuses).mockResolvedValue({
    value: [{ confirmationStatus: "confirmed" }],
    context: { slot: 2 },
  } as never);
  vi.mocked(connection.getTransaction).mockResolvedValue({
    transaction: { message: msg, signatures: [a.signature] },
    meta: {
      err: { InstructionError: [0, "InvalidArgument"] },
      fee: 5000,
      preBalances: pre,
      postBalances: post,
    },
  } as never);
  expect((await reconcileRequest(connection, a)).status).toBe("failed");
  expect(pendingTransaction(p.owner)).toBeNull();
});

it("rejects metadata mutated while the wallet prompt is open", async () => {
  const p = await prepare();
  await expect(
    submitRequest(
      connection,
      p,
      async (tx) => {
        tx.sign(owner);
        p.feeLamports = 4999;
        return tx;
      },
      () => true,
    ),
  ).rejects.toThrow(/differ/);
  expect(connection.sendRawTransaction).not.toHaveBeenCalled();
});
