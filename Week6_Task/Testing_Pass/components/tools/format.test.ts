import { formatDay, formatHours, formatRange, formatWeekday, plural } from "./format";

describe("format helpers", () => {
  it("formatDay: short UTC dates, raw text while a date is still streaming", () => {
    expect(formatDay("2026-09-28")).toBe("Sep 28");
    expect(formatDay("2026-01-01")).toBe("Jan 1");
    expect(formatDay("2026-09-")).toBe("2026-09-");
    expect(formatDay(undefined)).toBe("");
  });

  it("formatWeekday: adds the weekday", () => {
    expect(formatWeekday("2026-09-28")).toBe("Mon, Sep 28");
  });

  it("dates never shift a day, whatever the machine's time zone", () => {
    // Midnight UTC is still the previous day west of Greenwich; the helpers format in UTC.
    expect(formatDay("2026-03-01")).toBe("Mar 1");
    expect(formatWeekday("2026-12-31")).toBe("Thu, Dec 31");
  });

  it.each([
    ["2026-09-22", "2026-09-28", "Sep 22 – Sep 28"],
    ["2026-09-28", "2026-09-28", "Sep 28"],
    ["2026-09-22", undefined, "Since Sep 22"],
    [undefined, "2026-09-28", "Until Sep 28"],
    [undefined, undefined, "All time"],
  ])("formatRange(%s, %s) → %s", (from, to, expected) => {
    expect(formatRange(from, to)).toBe(expected);
  });

  it("formatRange uses the fallback when there are no dates", () => {
    expect(formatRange(undefined, undefined, "Any time")).toBe("Any time");
  });

  it.each([
    [3, "3h"],
    [2.5, "2.5h"],
    [0, "0h"],
    [1.25, "1.3h"],
  ])("formatHours(%s) → %s", (hours, expected) => {
    expect(formatHours(hours)).toBe(expected);
  });

  it("plural picks the right word, with a custom plural form", () => {
    expect(plural(1, "entry", "entries")).toBe("1 entry");
    expect(plural(0, "entry", "entries")).toBe("0 entries");
    expect(plural(2, "tag")).toBe("2 tags");
  });
});
