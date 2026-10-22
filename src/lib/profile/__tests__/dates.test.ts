import { describe, expect, it } from "vitest";

import { formatIsoMonth, parseResumeDate } from "@/lib/profile/dates";

/**
 * Resume dates are free text. The conversion to `YYYY-MM` happens in code and
 * never in a model, so these tests pin every shape a resume can use.
 */

describe("parseResumeDate", () => {
  it("reads a month and a year", () => {
    const parsed = parseResumeDate("Jan 2021");
    expect(parsed.iso).toBe("2021-01");
    expect(parsed.precision).toBe("month");
    expect(parsed.isCurrent).toBe(false);
  });

  it("reads a full month name", () => {
    expect(parseResumeDate("January 2021").iso).toBe("2021-01");
    expect(parseResumeDate("Sept 2022").iso).toBe("2022-09");
  });

  it("reads a year and a month", () => {
    expect(parseResumeDate("2021 March").iso).toBe("2021-03");
  });

  it("reads a numeric month and year", () => {
    expect(parseResumeDate("03/2021").iso).toBe("2021-03");
    expect(parseResumeDate("2021-03").iso).toBe("2021-03");
  });

  it("reads a year on its own and reports the lower precision", () => {
    const parsed = parseResumeDate("2021");
    expect(parsed.iso).toBe("2021-01");
    expect(parsed.precision).toBe("year");
  });

  it("reads a season as a year", () => {
    const parsed = parseResumeDate("Summer 2020");
    expect(parsed.iso).toBe("2020-01");
    expect(parsed.precision).toBe("year");
  });

  it("reads the words that mean the job is still running", () => {
    for (const raw of ["Present", "Current", "Present to date", "Ongoing"]) {
      const parsed = parseResumeDate(raw);
      expect(parsed.isCurrent).toBe(true);
      expect(parsed.iso).toBeNull();
      expect(parsed.precision).toBe("none");
    }
  });

  it("returns nothing for text that holds no date", () => {
    const parsed = parseResumeDate("somewhere in the past");
    expect(parsed.iso).toBeNull();
    expect(parsed.precision).toBe("none");
    expect(parsed.isCurrent).toBe(false);
  });

  it("keeps the source text so the review screen can show it", () => {
    expect(parseResumeDate(" Jan 2021 ").raw).toBe("Jan 2021");
  });
});

describe("formatIsoMonth", () => {
  it("writes a readable month", () => {
    expect(formatIsoMonth("2021-01")).toBe("Jan 2021");
    expect(formatIsoMonth("2021-09")).toBe("Sep 2021");
  });

  it("returns an empty string for nothing", () => {
    expect(formatIsoMonth(null)).toBe("");
    expect(formatIsoMonth("")).toBe("");
  });
});
