import { useState } from "react";
import type { Step } from "../content/missions";
import { Icon } from "./Icon";
export function LessonQuiz({
  step,
  passed,
  checkAnswer,
}: {
  step: Step;
  passed: boolean;
  checkAnswer: (id: string) => boolean;
}) {
  const quiz = step.quiz!;
  const [selected, setSelected] = useState<string | null>(
    passed ? quiz.correct : null,
  );
  const [checked, setChecked] = useState<string | null>(
    passed ? quiz.correct : null,
  );
  const option = quiz.options.find((o) => o.id === checked);
  const correct = checked === quiz.correct;
  return (
    <section
      className="practice-panel quiz-panel"
      aria-label="Check your understanding"
    >
      <div className="practice-heading">
        <span className="section-label">
          <Icon name="spark" size={17} />
          Your turn
        </span>
        <span className="check-label">Learning check</span>
      </div>
      <h2>{quiz.question}</h2>
      <fieldset className="quiz-options">
        <legend className="sr-only">Choose an answer</legend>
        {quiz.options.map((item, index) => (
          <label
            className={`quiz-option ${selected === item.id ? "selected" : ""} ${checked === item.id ? (correct ? "correct" : "try-again") : ""}`}
            key={item.id}
          >
            <input
              type="radio"
              name={`quiz-${step.id}`}
              value={item.id}
              checked={selected === item.id}
              disabled={passed}
              onChange={() => {
                setSelected(item.id);
                setChecked(null);
              }}
            />
            <span className="choice-letter" aria-hidden>
              {String.fromCharCode(65 + index)}
            </span>
            <span>{item.title}</span>
            {checked === item.id && correct && <Icon name="check" size={20} />}
          </label>
        ))}
      </fieldset>
      {option && (
        <div
          className={`quiz-feedback ${correct ? "is-correct" : ""}`}
          role="status"
        >
          <Icon name={correct ? "check" : "info"} size={20} />
          <div>
            <strong>
              {correct ? "You’ve got it." : "Let’s look at that again."}
            </strong>
            <p>{option.feedback}</p>
          </div>
        </div>
      )}
      {!passed && (
        <div className="quiz-footer">
          <span>You can try again. No scores, no pressure.</span>
          <button
            className="button button-primary"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                setChecked(selected);
                checkAnswer(selected);
              }
            }}
          >
            Check my answer
            <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
