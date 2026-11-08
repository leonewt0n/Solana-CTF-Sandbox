import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MISSIONS } from "../content/missions";
import { Icon } from "./Icon";
export function Celebration({ completed }: { completed: string[] }) {
  const previous = useRef(completed);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = completed;
    const increased = completed.length > before.length;
    const milestone = MISSIONS.find(
      (m) =>
        m.steps.some((s) => s.action !== "summary") &&
        m.steps
          .filter((s) => s.action !== "summary")
          .every((s) => completed.includes(s.id)) &&
        !m.steps
          .filter((s) => s.action !== "summary")
          .every((s) => before.includes(s.id)),
    );
    if (!increased || !milestone) return;
    if (timer.current) clearTimeout(timer.current);
    // Announce a newly completed learning milestone; do not replay on restored progress.
    // eslint-disable-next-line react/set-state-in-effect
    setName(milestone.name);
    timer.current = setTimeout(() => setName(null), 2200);
  }, [completed]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  if (!name) return null;
  return (
    <>
      <div className="completion-toast" role="status">
        <span>
          <Icon name="check" size={20} />
        </span>
        <div>
          <strong>{name}</strong>
          <p>Module complete. Nicely done.</p>
        </div>
      </div>
      <div className="confetti" aria-hidden key={name}>
        {Array.from({ length: 24 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--x": `${8 + ((i * 17) % 84)}%`,
                "--delay": `${(i % 5) * 0.06}s`,
                "--angle": `${i * 37}deg`,
                "--color": ["#d5cef3", "#88bcb4", "#e3c78f", "#a4b6d7"][i % 4],
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
