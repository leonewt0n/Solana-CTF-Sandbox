// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  type Connection,
} from "@solana/web3.js";
import { webcrypto } from "node:crypto";
import {
  LIVE_AMOUNT,
  LIVE_MAX_FEE,
  LIVE_STORAGE_PREFIX,
  TRAINING_DESTINATION,
  prepareTrainingTransfer,
  submitTrainingTransfer,
  refreshTrainingAttempt,
  readAttempt,
  unresolvedAttempt,
  saveAttempt,
  assertTrainingTransfer,
  signTrainingMessage,
  trainingMessage,
  withTrainingLock,
  type PreparedTransfer,
  type Attempt,
} from "../src/lib/liveScam";
class MemoryStorage {
  private values = new Map<string, string>();
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
const genesis = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
let key: Keypair;
let connection: Connection;
let sign: ReturnType<typeof vi.fn>;
let preview: PreparedTransfer;
const nonce = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  vi.stubGlobal("Storage", MemoryStorage);
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("window", { location: { origin: "https://learn.example" } });
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: webcrypto,
  });
  key = Keypair.generate();
  connection = {
    getGenesisHash: vi.fn().mockResolvedValue(genesis),
    getLatestBlockhashAndContext: vi.fn().mockResolvedValue({
      context: { slot: 10 },
      value: {
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      },
    }),
    getFeeForMessage: vi.fn().mockResolvedValue({ value: 5000 }),
    getBalance: vi.fn().mockResolvedValue(10_000_000),
    simulateTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    getBlockHeight: vi.fn().mockResolvedValue(50),
    sendRawTransaction: vi
      .fn()
      .mockImplementation(async () =>
        preview.transaction.signature
          ? (await import("bs58")).default.encode(preview.transaction.signature)
          : "",
      ),
    getSignatureStatuses: vi.fn().mockResolvedValue({ value: [null] }),
    getTransaction: vi.fn().mockResolvedValue(null),
  } as unknown as Connection;
  sign = vi.fn(async (tx: Transaction) => {
    tx.sign(key);
    return tx;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function prepare() {
  preview = await prepareTrainingTransfer(
    connection,
    key.publicKey,
    "scam.airdrop",
  );
  return preview;
}
async function submit() {
  return submitTrainingTransfer(connection, await prepare(), sign, () => true);
}
function receipt(attempt: Attempt, err: unknown = null) {
  return {
    transaction: {
      message: preview.transaction.compileMessage(),
      signatures: [attempt.signature],
    },
    meta: { err },
    version: "legacy",
  };
}
describe("bounded Devnet payment", () => {
  it("prepares exactly one transfer, estimates its fee, and simulates without signing or sending", async () => {
    const p = await prepare();
    assertTrainingTransfer(p.transaction, key.publicKey, p.blockhash);
    expect(p.feeLamports).toBe(5000);
    expect(PublicKey.isOnCurve(TRAINING_DESTINATION.toBytes())).toBe(false);
    expect(
      PublicKey.findProgramAddressSync(
        [Buffer.from("scam-training-sink-v1")],
        new PublicKey("4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa"),
      )[0].equals(TRAINING_DESTINATION),
    ).toBe(true);
    expect(connection.simulateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sigVerify: false, minContextSlot: 10 }),
    );
    expect(sign).not.toHaveBeenCalled();
    expect(connection.sendRawTransaction).not.toHaveBeenCalled();
  });
  it.each([null, LIVE_MAX_FEE + 1, NaN, -1])(
    "rejects an invalid fee %s before signing",
    async (fee) => {
      vi.mocked(connection.getFeeForMessage).mockResolvedValue({
        value: fee,
      } as never);
      await expect(prepare()).rejects.toThrow("fee estimate");
      expect(connection.simulateTransaction).not.toHaveBeenCalled();
    },
  );
  it("blocks wrong networks, insufficient balance, and failed simulation", async () => {
    vi.mocked(connection.getGenesisHash).mockResolvedValueOnce("mainnet");
    await expect(prepare()).rejects.toThrow("Incorrect cluster");
    vi.mocked(connection.getBalance).mockResolvedValueOnce(LIVE_AMOUNT);
    await expect(prepare()).rejects.toThrow("Not enough Devnet");
    vi.mocked(connection.simulateTransaction).mockResolvedValueOnce({
      value: { err: "failure" },
    } as never);
    await expect(prepare()).rejects.toThrow("simulation failed");
    expect(sign).not.toHaveBeenCalled();
  });
  it("saves the correct signed identifier before broadcast, without automatic retry", async () => {
    await prepare();
    vi.mocked(connection.sendRawTransaction).mockImplementation(async () => {
      const saved = readAttempt(key.publicKey.toBase58(), "scam.airdrop")!;
      expect(saved.status).toBe("pending");
      expect(saved.amount).toBe(LIVE_AMOUNT);
      return saved.signature;
    });
    const result = await submitTrainingTransfer(
      connection,
      preview,
      sign,
      () => true,
    );
    expect(result.status).toBe("pending");
    expect(connection.sendRawTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skipPreflight: false, maxRetries: 0 }),
    );
    expect(sign).toHaveBeenCalledTimes(1);
    await expect(
      prepareTrainingTransfer(connection, key.publicKey, "scam.blind"),
    ).rejects.toThrow("pending training receipt");
  });
  it("retains pending receipts through an ambiguous send failure and reload", async () => {
    vi.mocked(connection.sendRawTransaction).mockRejectedValue(
      new Error("RPC timeout"),
    );
    await expect(submit()).rejects.toThrow("RPC timeout");
    const stored = unresolvedAttempt(key.publicKey.toBase58())!;
    expect(stored.status).toBe("pending");
    expect((await refreshTrainingAttempt(connection, stored)).status).toBe(
      "pending",
    );
    await expect(
      submitTrainingTransfer(connection, preview, sign, () => true),
    ).rejects.toThrow("pending");
    expect(sign).toHaveBeenCalledTimes(1);
    expect(connection.sendRawTransaction).toHaveBeenCalledTimes(1);
  });
  it("does not broadcast a wallet rejection, account change, expired preview, or unsaved receipt", async () => {
    await prepare();
    sign.mockRejectedValueOnce(
      Object.assign(new Error("User rejected"), { code: 4001 }),
    );
    await expect(
      submitTrainingTransfer(connection, preview, sign, () => true),
    ).rejects.toThrow("rejected");
    expect(unresolvedAttempt(key.publicKey.toBase58())).toBeNull();
    await expect(
      submitTrainingTransfer(connection, preview, sign, () => false),
    ).rejects.toThrow("wallet or lesson changed");
    vi.mocked(connection.getBlockHeight).mockResolvedValueOnce(101);
    await expect(
      submitTrainingTransfer(connection, preview, sign, () => true),
    ).rejects.toThrow("expired");
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("Storage unavailable");
    });
    await expect(
      submitTrainingTransfer(connection, preview, sign, () => true),
    ).rejects.toThrow("Storage unavailable");
    expect(connection.sendRawTransaction).not.toHaveBeenCalled();
  });
  it("rechecks network and account after signing before broadcast", async () => {
    await prepare();
    let active = true;
    sign.mockImplementationOnce(async (tx) => {
      tx.sign(key);
      active = false;
      return tx;
    });
    await expect(
      submitTrainingTransfer(connection, preview, sign, () => active),
    ).rejects.toThrow("wallet or lesson changed");
    expect(connection.sendRawTransaction).not.toHaveBeenCalled();
    active = true;
    vi.mocked(connection.getGenesisHash)
      .mockResolvedValueOnce(genesis)
      .mockResolvedValueOnce("mainnet");
    await expect(
      submitTrainingTransfer(connection, preview, sign, () => true),
    ).rejects.toThrow("Incorrect cluster");
    expect(unresolvedAttempt(key.publicKey.toBase58())?.status).toBe("signed");
    expect(connection.sendRawTransaction).not.toHaveBeenCalled();
  });
  it.each(["amount", "recipient", "extra", "payer", "signature"])(
    "rejects a wallet-modified %s",
    async (kind) => {
      await prepare();
      sign.mockImplementationOnce(async (tx) => {
        if (kind === "payer") tx.feePayer = Keypair.generate().publicKey;
        else if (kind === "extra")
          tx.add(
            SystemProgram.transfer({
              fromPubkey: key.publicKey,
              toPubkey: TRAINING_DESTINATION,
              lamports: 1,
            }),
          );
        else if (kind !== "signature")
          tx.instructions[0] = SystemProgram.transfer({
            fromPubkey: key.publicKey,
            toPubkey:
              kind === "recipient"
                ? Keypair.generate().publicKey
                : TRAINING_DESTINATION,
            lamports: kind === "amount" ? LIVE_AMOUNT + 1 : LIVE_AMOUNT,
          });
        if (kind !== "payer" && kind !== "signature") tx.sign(key);
        return tx;
      });
      await expect(
        submitTrainingTransfer(connection, preview, sign, () => true),
      ).rejects.toThrow();
      expect(connection.sendRawTransaction).not.toHaveBeenCalled();
      expect(unresolvedAttempt(key.publicKey.toBase58())).toBeNull();
    },
  );
  it("does not turn malformed stored receipts into permission for another transfer", async () => {
    localStorage.setItem(
      LIVE_STORAGE_PREFIX + key.publicKey.toBase58() + ":scam.airdrop",
      "{}",
    );
    await expect(prepare()).rejects.toThrow("receipt is invalid");
    expect(sign).not.toHaveBeenCalled();
  });
});
describe("receipt recovery", () => {
  it("requires a confirmed receipt with the original instruction, rather than a balance drop or status alone", async () => {
    const a = await submit();
    vi.mocked(connection.getSignatureStatuses).mockResolvedValue({
      value: [{ confirmationStatus: "confirmed", err: null }],
    } as never);
    expect((await refreshTrainingAttempt(connection, a)).status).toBe(
      "pending",
    );
    vi.mocked(connection.getTransaction).mockResolvedValue(receipt(a) as never);
    expect((await refreshTrainingAttempt(connection, a)).status).toBe(
      "confirmed",
    );
    expect(connection.sendRawTransaction).toHaveBeenCalledTimes(1);
  });
  it("distinguishes confirmed execution failure and never calls it a successful loss", async () => {
    const a = await submit();
    vi.mocked(connection.getSignatureStatuses).mockResolvedValue({
      value: [
        {
          confirmationStatus: "confirmed",
          err: { InstructionError: [0, "Error"] },
        },
      ],
    } as never);
    vi.mocked(connection.getTransaction).mockResolvedValue(
      receipt(a, { InstructionError: [0, "Error"] }) as never,
    );
    expect((await refreshTrainingAttempt(connection, a)).status).toBe("failed");
  });
  it("closes an unobserved expired transaction only after a finalized height and another history lookup", async () => {
    const a = await submit();
    vi.mocked(connection.getBlockHeight).mockResolvedValue(101);
    expect((await refreshTrainingAttempt(connection, a)).status).toBe(
      "expired",
    );
    expect(connection.getBlockHeight).toHaveBeenLastCalledWith("finalized");
    expect(connection.getSignatureStatuses).toHaveBeenCalledTimes(2);
    vi.mocked(connection.getSignatureStatuses).mockResolvedValue({
      value: [{ confirmationStatus: "processed" }],
    } as never);
    expect((await refreshTrainingAttempt(connection, a)).status).toBe(
      "pending",
    );
  });
  it("rejects unrelated receipts and refuses wrong-network recovery", async () => {
    const a = await submit();
    vi.mocked(connection.getGenesisHash).mockResolvedValueOnce("mainnet");
    await expect(refreshTrainingAttempt(connection, a)).rejects.toThrow(
      "Incorrect cluster",
    );
    vi.mocked(connection.getSignatureStatuses).mockResolvedValue({
      value: [{ confirmationStatus: "confirmed" }],
    } as never);
    const wrong = receipt(a);
    wrong.transaction.signatures = ["2".repeat(88)];
    vi.mocked(connection.getTransaction).mockResolvedValue(wrong as never);
    await expect(refreshTrainingAttempt(connection, a)).rejects.toThrow(
      "receipt does not match",
    );
  });
  it("keeps wallet records separate", async () => {
    const a = await submit();
    saveAttempt(a);
    expect(
      readAttempt(Keypair.generate().publicKey.toBase58(), a.scenario),
    ).toBeNull();
  });
});
it("signs only the exact domain-bound training message and verifies the actual Ed25519 signature", async () => {
  const pair = await webcrypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]);
  const publicKey = new PublicKey(
    new Uint8Array(await webcrypto.subtle.exportKey("raw", pair.publicKey)),
  );
  const message = trainingMessage(
    window.location.origin,
    "scam.message",
    publicKey.toBase58(),
    nonce,
  );
  const signer = vi.fn(
    async (bytes) =>
      new Uint8Array(
        await webcrypto.subtle.sign("Ed25519", pair.privateKey, bytes),
      ),
  );
  await signTrainingMessage(connection, publicKey, message, signer, () => true);
  expect(signer).toHaveBeenCalledTimes(1);
  expect(connection.sendRawTransaction).not.toHaveBeenCalled();
  await expect(
    signTrainingMessage(
      connection,
      publicKey,
      message.replace(window.location.origin, "https://wrong.example"),
      signer,
      () => true,
    ),
  ).rejects.toThrow("message changed");
  expect(signer).toHaveBeenCalledTimes(1);
  await expect(
    signTrainingMessage(
      connection,
      publicKey,
      message,
      async () => new Uint8Array(64),
      () => true,
    ),
  ).rejects.toThrow("could not be verified");
});
it("refuses overlapping same-account operations and unsupported lock coordination", async () => {
  const task = vi.fn().mockResolvedValue("ok");
  vi.stubGlobal("navigator", {
    locks: { request: vi.fn(async (_name, _options, fn) => fn(null)) },
  });
  await expect(
    withTrainingLock(key.publicKey.toBase58(), task),
  ).rejects.toThrow("Another tab");
  expect(task).not.toHaveBeenCalled();
  vi.stubGlobal("navigator", {});
  await expect(
    withTrainingLock(key.publicKey.toBase58(), task),
  ).rejects.toThrow("Web Locks");
});
it("does not request a message signature on the wrong network or after an account change", async () => {
  const message = trainingMessage(
    window.location.origin,
    "scam.message",
    key.publicKey.toBase58(),
    nonce,
  );
  const signer = vi.fn();
  vi.mocked(connection.getGenesisHash).mockResolvedValueOnce("mainnet");
  await expect(
    signTrainingMessage(connection, key.publicKey, message, signer, () => true),
  ).rejects.toThrow("Incorrect cluster");
  await expect(
    signTrainingMessage(
      connection,
      key.publicKey,
      message,
      signer,
      () => false,
    ),
  ).rejects.toThrow("wallet or lesson changed");
  expect(signer).not.toHaveBeenCalled();
});
it("requires fresh network evidence when rechecking a previously saved success", async () => {
  const a = await submit();
  expect(
    (await refreshTrainingAttempt(connection, { ...a, status: "confirmed" }))
      .status,
  ).toBe("pending");
});
