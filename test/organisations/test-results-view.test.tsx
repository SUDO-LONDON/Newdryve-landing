import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TestResultsView, { byInstructor, summarise, testResultsCsv } from "@/components/organisations/TestResultsView";
import type { TestResult, TestResultsResponse } from "@/lib/organisations/types";

function result(over: Partial<TestResult> = {}): TestResult {
  return {
    id: "r1",
    organisation_id: "org-1",
    instructor_id: "i1",
    instructor_name: "Sam Carter",
    learner_name: "Priya Shah",
    learner_kind: "newdryve",
    test_date: "2026-11-23",
    majors: 0,
    minors: 4,
    passed: true,
    examiner_name: "Sarah Jones",
    created_at: "2026-11-23T15:00:00.000Z",
    ...over,
  };
}

function data(results: TestResult[]): TestResultsResponse {
  return {
    generated_at: "2026-11-25T10:00:00.000Z",
    organisations: [{ id: "org-1", name: "Norwich Driving School" }],
    summary: summarise(results),
    results,
    truncated: false,
  };
}

const results = [
  result(),
  result({ id: "r2", learner_name: "Tom Baker", learner_kind: "private", majors: 1, minors: 2, passed: false, examiner_name: "Mr Patel" }),
  result({ id: "r3", instructor_id: "i2", instructor_name: "Ola Nowak", learner_name: "Kim Lee", minors: 9, examiner_name: "A Examiner" }),
];

describe("TestResultsView", () => {
  it("shows each test with its examiner, faults and result, and the school's pass rate", () => {
    const { container } = render(<TestResultsView data={data(results)} />);
    const table = container.querySelector("table")!;
    expect(within(table).getByText("Priya Shah")).toBeTruthy();
    expect(within(table).getByText("Mr Patel")).toBeTruthy();
    expect(within(table).getByText("Private learner")).toBeTruthy();
    expect(within(table).getAllByText("Fail")).toHaveLength(1);
    expect(within(table).getAllByText("Pass")).toHaveLength(2);
    expect(screen.getByText("67%")).toBeTruthy();
    expect(screen.getByText("2 passed")).toBeTruthy();
  });

  it("narrows to one instructor", () => {
    const { container } = render(<TestResultsView data={data(results)} />);
    fireEvent.change(screen.getByLabelText("Instructor"), { target: { value: "i2" } });
    const table = container.querySelector("table")!;
    expect(within(table).queryByText("Priya Shah")).toBeNull();
    expect(within(table).getByText("Kim Lee")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("explains how results arrive when there are none", () => {
    render(<TestResultsView data={data([])} />);
    expect(screen.getByText("No test results yet.")).toBeTruthy();
    expect(screen.getByText(/Record a test result/)).toBeTruthy();
  });
});

describe("test result helpers", () => {
  it("ranks instructors by pass rate", () => {
    expect(byInstructor(results).map((i) => [i.name, i.pass_rate, i.tests])).toEqual([
      ["Ola Nowak", 100, 1],
      ["Sam Carter", 50, 2],
    ]);
  });

  it("writes a CSV that a spreadsheet can't run", () => {
    const csv = testResultsCsv([result({ examiner_name: "=HYPERLINK(1)" })]);
    expect(csv.split("\r\n")[0]).toBe('"Test date","Learner","Instructor","Result","Majors","Minors","Examiner"');
    expect(csv).toContain(`"'=HYPERLINK(1)"`);
    expect(csv).toContain('"Pass"');
  });
});
