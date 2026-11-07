import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicKey, type Connection } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { prepareMission, sendTriggerMission } from "../src/lib/program";
import { classifyTxError } from "../src/engine/checks";
import { verifyFlag } from "../src/lib/flag";
import { webcrypto } from "node:crypto";
const signature = "5".repeat(88);
const publicKey = new PublicKey("11111111111111111111111111111111");
let connection: Connection;
let wallet: WalletContextState;
beforeEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: webcrypto,
  });
  connection = {
    getGenesisHash: vi
      .fn()
      .mockResolvedValue("EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"),
    getAccountInfo: vi.fn().mockResolvedValue({ executable: true }),
    getLatestBlockhashAndContext: vi.fn().mockResolvedValue({
      context: { slot: 1 },
      value: { blockhash: publicKey.toBase58(), lastValidBlockHeight: 100 },
    }),
    getFeeForMessage: vi.fn().mockResolvedValue({ value: 5000 }),
    confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  } as unknown as Connection;
  wallet = {
    publicKey,
    sendTransaction: vi.fn().mockResolvedValue(signature),
  } as unknown as WalletContextState;
});
describe("transaction verification", () => {
  it("previews a program call without a transfer", async () => {
    const preview = await prepareMission(connection, publicKey);
    expect(preview.feeLamports).toBe(5000);
    expect(preview.transaction.instructions).toHaveLength(1);
    expect(preview.transaction.instructions[0].keys).toEqual([
      { pubkey: publicKey, isSigner: true, isWritable: false },
    ]);
  });
  it("blocks a non-Devnet RPC before requesting signing", async () => {
    vi.mocked(connection.getGenesisHash).mockResolvedValue("mainnet-genesis");
    await expect(sendTriggerMission(connection, wallet)).rejects.toThrow(
      "Incorrect cluster",
    );
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
  });
  it("blocks an absent or non-executable program", async () => {
    vi.mocked(connection.getAccountInfo).mockResolvedValue(null);
    await expect(sendTriggerMission(connection, wallet)).rejects.toThrow(
      "program unavailable",
    );
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
  });
  it("does not ask for signing if no fee estimate is available", async () => {
    vi.mocked(connection.getFeeForMessage).mockResolvedValue({
      context: { slot: 1 },
      value: null,
    });
    await expect(sendTriggerMission(connection, wallet)).rejects.toThrow(
      "Fee estimate unavailable",
    );
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
  });
  it("rejects a confirmed execution failure and retains its receipt", async () => {
    vi.mocked(connection.confirmTransaction).mockResolvedValue({
      context: { slot: 1 },
      value: { err: { InstructionError: [0, "InvalidArgument"] } },
    });
    await expect(sendTriggerMission(connection, wallet)).rejects.toMatchObject({
      signature,
      message: expect.stringContaining("execution failed"),
    });
  });
  it("returns a signature only after successful execution", async () => {
    await expect(sendTriggerMission(connection, wallet)).resolves.toBe(
      signature,
    );
    expect(connection.confirmTransaction).toHaveBeenCalledWith(
      { signature, blockhash: publicKey.toBase58(), lastValidBlockHeight: 100 },
      "confirmed",
    );
  });
  it("distinguishes rejection, execution, expiry, network, and RPC errors", () => {
    expect(classifyTxError(new Error("User rejected request"))).toBe(
      "rejected",
    );
    expect(classifyTxError(new Error("Transaction execution failed"))).toBe(
      "execution",
    );
    expect(classifyTxError(new Error("Blockhash not found"))).toBe("expired");
    expect(classifyTxError(new Error("Incorrect cluster"))).toBe("network");
    expect(classifyTxError(new Error("429"))).toBe("rpc");
  });
});
it("accepts the public exercise code but rejects incorrect flags", async () => {
  await expect(verifyFlag("  CTF{r3ad_th3_l0gs}  ")).resolves.toBe(true);
  await expect(verifyFlag("CTF{wrong}")).resolves.toBe(false);
});
