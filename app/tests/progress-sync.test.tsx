import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { emptyProgress, STEPS, type Progress } from "../src/engine/progress";
import { useProgressSync } from "../src/engine/useProgressSync";
const mocks = vi.hoisted(() => ({ wallet: { signMessage: vi.fn() } }));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => mocks.wallet,
}));
const owner = "11111111111111111111111111111111";
const next: Progress = {
  stepIndex: 1,
  completed: [STEPS[0].id],
  signature: null,
};
const record = (progress: Progress | null, revision = 1, wallet = owner) => ({
  wallet,
  progress,
  revision,
  version: 3,
});
const response = (data: unknown, status = 200) =>
  Response.json(data, { status });
function useHarness(initial = emptyProgress()) {
  const [progress, setProgress] = useState(initial);
  const sync = useProgressSync(owner, progress, setProgress);
  return { ...sync, progress, setProgress };
}
beforeEach(() => {
  mocks.wallet.signMessage.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("cloud progress synchronization", () => {
  it("signs a domain-bound login message only after an explicit action", async () => {
    const message = `Login\nWallet: ${owner}\nURI: ${window.location.origin}\nNonce: example`;
    mocks.wallet.signMessage.mockResolvedValueOnce(new Uint8Array(64));
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ error: "Sign in" }, 401))
      .mockResolvedValueOnce(response({ message }))
      .mockResolvedValueOnce(response({ wallet: owner }))
      .mockResolvedValueOnce(response(record(emptyProgress(), 1)));
    const { result } = renderHook(() => useHarness());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(mocks.wallet.signMessage).not.toHaveBeenCalled();
    await act(async () => result.current.signIn());
    expect(mocks.wallet.signMessage).toHaveBeenCalledTimes(1);
    expect(
      new TextDecoder().decode(mocks.wallet.signMessage.mock.calls[0][0]),
    ).toBe(message);
    expect(result.current.status).toBe("ready");
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it("retains browser progress when the learner declines login signing", async () => {
    mocks.wallet.signMessage.mockRejectedValueOnce(new Error("User rejected"));
    const message = `Login\nWallet: ${owner}\nURI: ${window.location.origin}\n`;
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ error: "Sign in" }, 401))
      .mockResolvedValueOnce(response({ message }));
    const { result } = renderHook(() => useHarness(next));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await act(async () => result.current.signIn());
    expect(result.current.progress).toEqual(next);
    expect(result.current.status).toBe("local");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("requires an explicit choice before replacing different browser progress", async () => {
    vi.mocked(fetch).mockResolvedValue(response(record(next, 4)));
    const { result } = renderHook(() => useHarness());
    await waitFor(() => expect(result.current.status).toBe("conflict"));
    expect(result.current.progress).toEqual(emptyProgress());
    expect(fetch).toHaveBeenCalledTimes(1);
    act(() => result.current.resolve(true));
    expect(result.current.progress).toEqual(next);
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("uploads this device's chosen progress using the cloud revision", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(record(next, 4)))
      .mockResolvedValueOnce(response(record(emptyProgress(), 5)));
    const { result } = renderHook(() => useHarness());
    await waitFor(() => expect(result.current.status).toBe("conflict"));
    act(() => result.current.resolve(false));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2), {
      timeout: 2000,
    });
    const options = vi.mocked(fetch).mock.calls[1][1];
    expect(JSON.parse(options!.body as string)).toEqual({
      wallet: owner,
      version: 3,
      revision: 4,
      progress: emptyProgress(),
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
  it("keeps offline changes and retries without silently overwriting a newer record", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(record(emptyProgress(), 2)))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response(record(emptyProgress(), 3)));
    const { result } = renderHook(() => useHarness());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    act(() => result.current.setProgress(next));
    await waitFor(() => expect(result.current.status).toBe("error"), {
      timeout: 2000,
    });
    expect(result.current.progress).toEqual(next);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("conflict"));
    expect(result.current.progress).toEqual(next);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("rejects another wallet's browser session before uploading", async () => {
    vi.mocked(fetch).mockResolvedValue(
      response(record(null, 0, "other-wallet")),
    );
    const { result } = renderHook(() => useHarness(next));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(result.current.status).toBe("local");
    expect(result.current.progress).toEqual(next);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("cancels a queued save when signing out", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(record(emptyProgress(), 2)))
      .mockResolvedValueOnce(response({ ok: true }));
    const { result } = renderHook(() => useHarness());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    act(() => result.current.setProgress(next));
    await act(async () => result.current.signOut());
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(result.current.status).toBe("local");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe("/api/auth/logout");
  });
  it("ignores a cloud response after the account session unmounts", async () => {
    let finish!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const restore = vi.fn();
    const view = renderHook(() =>
      useProgressSync(owner, emptyProgress(), restore),
    );
    view.unmount();
    await act(async () => finish(response(record(next))));
    expect(restore).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
