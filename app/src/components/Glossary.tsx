import { useEffect, useRef, useState } from "react";
import { MISSIONS } from "../content/missions";
import { Icon } from "./Icon";
const TERMS = Array.from(
  new Map(
    MISSIONS.flatMap((m) => m.steps.flatMap((s) => s.terms)).map((t) => [
      t.term.toLowerCase(),
      t,
    ]),
  ).values(),
).sort((a, b) => a.term.localeCompare(b.term));
export function Glossary({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    dialog.current?.showModal?.();
  }, []);
  const results = TERMS.filter((t) =>
    `${t.term} ${t.definition}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <dialog
      ref={dialog}
      className="glossary-dialog"
      aria-labelledby="glossary-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="glossary-header">
        <div>
          <span className="eyebrow">A LITTLE LESS JARGON</span>
          <h2 id="glossary-title">The glossary</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close glossary"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <label className="glossary-search">
        <Icon name="search" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a term…"
          aria-label="Search glossary"
          autoFocus
        />
      </label>
      <dl>
        {results.map((t) => (
          <div key={t.term}>
            <dt>{t.term}</dt>
            <dd>{t.definition}</dd>
          </div>
        ))}
      </dl>
      {results.length === 0 && (
        <p>No matching terms. Try “wallet”, “fee”, or “signature”.</p>
      )}
    </dialog>
  );
}
