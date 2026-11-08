import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  LessonScene,
  LessonExplanation,
} from "../src/components/LessonExperience";
import { Celebration } from "../src/components/Celebration";
import { MISSIONS } from "../src/content/missions";
import { existsSync } from "node:fs";
import { chapterArtwork } from "../src/content/presentation";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const steps = MISSIONS.flatMap((m) => m.steps);
it("lets every non-scam lesson explore all visual stages without network or storage writes", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const write = vi.spyOn(Storage.prototype, "setItem");
  for (const step of steps.filter((s) => !s.scamScenario)) {
    const view = render(<LessonScene key={step.id} step={step} />);
    const controls = screen.getByRole("group", {
      name: "Choose a visual stage",
    });
    const buttons = within(controls).getAllByRole("button");
    expect(
      (
        screen.getByRole("button", {
          name: "Previous scene",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    for (const button of buttons) {
      fireEvent.click(button);
      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(
        within(controls)
          .getAllByRole("button")
          .filter((b) => b.getAttribute("aria-pressed") === "true"),
      ).toHaveLength(1);
    }
    expect(
      (screen.getByRole("button", { name: /Next scene/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Previous scene" }));
    expect(
      (screen.getByRole("button", { name: /Next scene/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(view.container.querySelector("input, iframe, form")).toBeNull();
    view.unmount();
  }
  expect(fetchMock).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  write.mockRestore();
});
it("keeps every original explanation available while revealing one stage at a time", () => {
  for (const step of steps) {
    const view = render(<LessonExplanation step={step} />);
    const region = screen.getByRole("region", { name: "Concept explained" });
    const page = region.querySelector(".explanation-page")!;
    expect(page.textContent).toContain(step.why);
    for (const paragraph of step.explanation ?? []) {
      fireEvent.click(screen.getByRole("button", { name: "Next explanation" }));
      expect(
        page.isConnected || region.querySelector(".explanation-page"),
      ).toBeTruthy();
      expect(region.querySelector(".explanation-page")!.textContent).toContain(
        paragraph,
      );
    }
    const full = region.querySelector("details")!;
    fireEvent.click(within(full).getByText("Read the full explanation"));
    expect(full.open).toBe(true);
    for (const paragraph of [step.why, ...(step.explanation ?? [])])
      expect(full.textContent).toContain(paragraph);
    view.unmount();
  }
});
it("does not celebrate the final step alone and celebrates when the remaining step is filled out of order", () => {
  const ids = MISSIONS[0].steps.map((s) => s.id);
  const view = render(<Celebration completed={[]} />);
  view.rerender(<Celebration completed={[ids.at(-1)!]} />);
  expect(screen.queryByText("Module complete. Nicely done.")).toBeNull();
  view.rerender(<Celebration completed={ids} />);
  expect(screen.getByText("Module complete. Nicely done.")).toBeTruthy();
});
it("ships an optimized illustration for every chapter", () => {
  for (const [i] of MISSIONS.entries())
    expect(existsSync(`public${chapterArtwork(i)}`)).toBe(true);
});
