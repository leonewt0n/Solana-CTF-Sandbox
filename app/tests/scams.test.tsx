import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SCAM_SCENARIOS,
  ALL_SCENARIOS,
  FINAL_SCENARIOS,
  inspectionTask,
  validAssessment,
} from "../src/content/scams";
import { ScamSimulator } from "../src/components/ScamSimulator";
afterEach(cleanup);
describe.each(ALL_SCENARIOS)("$id evidence assessment", (scenario) => {
  it("withholds clues and requires inspection, decision and evidence", () => {
    const done = vi.fn();
    render(<ScamSimulator scenarioId={scenario.id} onAssessment={done} />);
    for (const clue of scenario.request.clues)
      expect(screen.queryByText(clue)).toBeNull();
    expect(screen.queryByText(scenario.takeaway)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Review simulated request" }),
    );
    expect(done).not.toHaveBeenCalled();
    const buttons = screen
      .getByRole("group", { name: "Choose a simulated response" })
      .querySelectorAll("button");
    expect(new Set([...buttons].map((b) => b.className)).size).toBe(1);
    const task = inspectionTask(scenario.id, "request")!;
    fireEvent.change(screen.getByLabelText("Inspection answer"), {
      target: { value: task.answer },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name:
          scenario.request.recommended === "stop"
            ? "Reject"
            : scenario.request.recommended === "proceed"
              ? "Proceed"
              : "Investigate further",
        exact: true,
      }),
    );
    expect(done.mock.calls.some(([value]) => value !== null)).toBe(false);
    fireEvent.change(screen.getByLabelText("Supporting evidence"), {
      target: { value: task.answer },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Check decision and evidence" }),
    );
    expect(done).toHaveBeenLastCalledWith({
      variant: "request",
      inspection: task.answer,
      decision: scenario.request.recommended,
      evidence: task.answer,
    });
    expect(screen.getByRole("status").textContent).toContain(
      "Decision supported",
    );
  });
});
it.each(SCAM_SCENARIOS)(
  "$id includes a legitimate comparison and clears unfinished assessment state",
  (scenario) => {
    expect(scenario.comparison).toBeTruthy();
    const done = vi.fn();
    render(<ScamSimulator scenarioId={scenario.id} onAssessment={done} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Review simulated request" }),
    );
    fireEvent.change(screen.getByLabelText("Inspection answer"), {
      target: { value: "unfinished" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request B" }));
    expect(screen.queryByLabelText("Inspection answer")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Review simulated request" }),
    );
    expect(
      (screen.getByLabelText("Inspection answer") as HTMLInputElement).value,
    ).toBe("");
    expect(screen.queryByLabelText("Supporting evidence")).toBeNull();
    expect(done).toHaveBeenLastCalledWith(null);
    const task = inspectionTask(scenario.id, "comparison")!;
    expect(
      validAssessment(scenario.id, {
        variant: "comparison",
        inspection: task.answer,
        decision: "proceed",
        evidence: task.answer,
      }),
    ).toBe(true);
  },
);
it("keeps final assessments unseen in practice and tests proceed, reject and investigate", () => {
  expect(FINAL_SCENARIOS.map((s) => s.request.recommended)).toEqual([
    "proceed",
    "stop",
    "investigate",
  ]);
  expect(SCAM_SCENARIOS.some((s) => s.id.startsWith("final."))).toBe(false);
});

it("practice withholds takeaways and clears responses when switching scenarios", async () => {
  const { ScamPractice } = await import("../src/components/ScamPractice");
  render(<ScamPractice heading={{ current: null }} />);
  expect(screen.queryByText(SCAM_SCENARIOS[0].takeaway)).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Review simulated request" }),
  );
  fireEvent.change(screen.getByLabelText("Inspection answer"), {
    target: { value: "unfinished" },
  });
  fireEvent.change(screen.getByLabelText("Choose a scenario"), {
    target: { value: SCAM_SCENARIOS[1].id },
  });
  expect(screen.queryByLabelText("Inspection answer")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByText(SCAM_SCENARIOS[1].takeaway)).toBeNull();
});
