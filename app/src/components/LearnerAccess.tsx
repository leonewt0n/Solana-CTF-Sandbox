import { useState } from "react";
import { useLearnerAccount } from "../context/LearnerAccount";
import { accountApi } from "../engine/accountApi";
import {
  mergeIntroductoryProgress,
  normalizeProgress,
  type Progress,
} from "../engine/progress";

export function LearnerAccess({
  progress,
  restore,
  busy,
}: {
  progress: Progress;
  restore: (progress: Progress) => void;
  busy: boolean;
}) {
  const account = useLearnerAccount();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [localCode, setLocalCode] = useState("");
  const [transfer, setTransfer] = useState("");
  const [incoming, setIncoming] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  async function run(action: () => Promise<void>) {
    if (working || busy) return;
    setWorking(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again");
    } finally {
      setWorking(false);
    }
  }
  return (
    <section
      className="learner-access"
      aria-label="Save and move learning progress"
    >
      <div className="learner-access-heading">
        <span>
          {account.learner
            ? `Learning account: ${account.learner.email}`
            : "Keep your progress when you switch browsers."}
        </span>
        <button
          className="text-button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close save options" : "Save or move progress"}
        </button>
        {account.learner && (
          <button
            className="text-button"
            disabled={working || busy}
            onClick={() =>
              void run(async () => {
                await accountApi("account/logout", {});
                await account.refresh();
                setMessage("Signed out. Progress on this device is kept.");
              })
            }
          >
            Sign out of learner account
          </button>
        )}
      </div>
      {open && (
        <div className="learner-access-options">
          {!account.learner && (
            <div>
              <h2>Save with email</h2>
              <p>
                Use a sign-in code. Connect and link a wallet later for
                wallet-specific practice.
              </p>
              {!account.loaded ? (
                <p>Checking sign-in options…</p>
              ) : account.emailAvailable ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      if (!sent) {
                        const result = await accountApi("account/code", {
                          email,
                        });
                        setSent(true);
                        setLocalCode(
                          typeof result.localCode === "string"
                            ? result.localCode
                            : "",
                        );
                        setMessage(
                          "Enter the eight-digit code. It expires in 10 minutes.",
                        );
                      } else {
                        await accountApi("account/verify", { code });
                        await account.refresh();
                        setCode("");
                        setLocalCode("");
                        setMessage(
                          "Signed in. Your learning can now follow you across browsers.",
                        );
                      }
                    });
                  }}
                >
                  <label>
                    Email address
                    <input
                      type="email"
                      value={email}
                      autoComplete="email"
                      maxLength={254}
                      required
                      disabled={sent || working}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  {sent && (
                    <label>
                      Eight-digit sign-in code
                      <input
                        value={code}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        pattern="[0-9]{8}"
                        maxLength={8}
                        required
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, ""))
                        }
                      />
                    </label>
                  )}
                  {localCode && account.localEmail && (
                    <p className="local-code">
                      Local development only: {localCode}. No email was sent.
                    </p>
                  )}
                  <button
                    className="button button-primary"
                    disabled={working || busy}
                  >
                    {working
                      ? "Please wait…"
                      : sent
                        ? "Sign in with code"
                        : "Send sign-in code"}
                  </button>
                  {sent && (
                    <button
                      className="text-button"
                      type="button"
                      disabled={working}
                      onClick={() => {
                        setSent(false);
                        setCode("");
                        setLocalCode("");
                      }}
                    >
                      Use another email or request a new code
                    </button>
                  )}
                </form>
              ) : (
                <p>
                  Email sign-in is not enabled yet. You can move introductory
                  progress with a transfer code below.
                </p>
              )}
            </div>
          )}
          <div>
            <h2>Continue in another browser</h2>
            <p>
              Create a one-time code here, then open this site in Solflare,
              Phantom, or another browser and enter it below. Codes expire in 10
              minutes.
            </p>
            <p>
              This moves introductory lessons. It does not sign you in or move
              wallet transactions.
            </p>
            <button
              className="button button-secondary"
              disabled={working || busy}
              onClick={() =>
                void run(async () => {
                  const result = await accountApi("transfer/create", {
                    version: 3,
                    progress,
                  });
                  setTransfer(result.code);
                  setMessage(
                    "Copy the code and enter it in your other browser.",
                  );
                })
              }
            >
              Create browser-transfer code
            </button>
            {transfer && (
              <div className="transfer-output">
                <output aria-label="Your browser-transfer code">
                  {transfer}
                </output>
                <button
                  className="text-button"
                  onClick={() =>
                    void run(async () => {
                      await navigator.clipboard.writeText(transfer);
                      setMessage("Transfer code copied.");
                    })
                  }
                >
                  Copy transfer code
                </button>
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const result = await accountApi("transfer/redeem", {
                    code: incoming,
                  });
                  const portable =
                    result.version === 3
                      ? normalizeProgress(result.progress)
                      : null;
                  if (!portable)
                    throw new Error("This transfer cannot be restored");
                  restore(mergeIntroductoryProgress(progress, portable));
                  setIncoming("");
                  setMessage(
                    "Your introductory learning is restored. Continue where you left off.",
                  );
                });
              }}
            >
              <label>
                Code from your other browser
                <input
                  value={incoming}
                  autoComplete="off"
                  maxLength={24}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                  required
                  onChange={(event) =>
                    setIncoming(event.target.value.toUpperCase())
                  }
                />
              </label>
              <button
                className="button button-primary"
                disabled={working || busy}
              >
                Resume with transfer code
              </button>
            </form>
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
