/**
 * Date parsing for resume dates.
 *
 * Resumes state dates in free text ("Jan 2021", "2021", "03/2021", "Present").
 * The profile stores `YYYY-MM`, so the conversion happens here, in code, and
 * never in a model. When the source only names a year the month is set to
 * January and the precision is reported as `year`, so the review screen can
 * tell the user that the month was not stated.
 */

export type DatePrecision = "month" | "year" | "none";

export interface ParsedDate {
  /** `YYYY-MM`, or null when the text holds no usable date. */
  iso: string | null;
  /** `month` when the source named a month, `year` when it named only a year. */
  precision: DatePrecision;
  /** True for "Present", "Current" and similar. */
  isCurrent: boolean;
  /** The source text, kept so the review screen can show what was written. */
  raw: string;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const CURRENT_PATTERN =
  /\b(?:present|current|now|ongoing|to date|till now|presently)\b/i;

const MONTH_YEAR_PATTERN =
  /^([A-Za-z]{3,9})\.?\s+(\d{4})$/;
const YEAR_MONTH_PATTERN = /^(\d{4})[\s.\-\/]+([A-Za-z]{3,9})\.?$/;
const MONTH_SLASH_YEAR_PATTERN = /^(\d{1,2})[\/.\-](\d{4})$/;
const YEAR_DASH_MONTH_PATTERN = /^(\d{4})[\-\/.](\d{1,2})$/;
const YEAR_ONLY_PATTERN = /^(\d{4})$/;
const SEASON_YEAR_PATTERN = /^(?:spring|summer|autumn|fall|winter)\s+(\d{4})$/i;

function pad(month: number): string {
  return month < 10 ? `0${month}` : String(month);
}

/**
 * Turns one free-form date into `YYYY-MM`.
 */
export function parseResumeDate(raw: string): ParsedDate {
  const text = (raw ?? "").trim();
  const empty: ParsedDate = {
    iso: null,
    precision: "none",
    isCurrent: false,
    raw: text,
  };

  if (!text) return empty;

  if (CURRENT_PATTERN.test(text)) {
    return { iso: null, precision: "none", isCurrent: true, raw: text };
  }

  const monthYear = MONTH_YEAR_PATTERN.exec(text);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    if (month) {
      return {
        iso: `${monthYear[2]}-${pad(month)}`,
        precision: "month",
        isCurrent: false,
        raw: text,
      };
    }
  }

  const yearMonth = YEAR_MONTH_PATTERN.exec(text);
  if (yearMonth) {
    const month = MONTHS[yearMonth[2].toLowerCase()];
    if (month) {
      return {
        iso: `${yearMonth[1]}-${pad(month)}`,
        precision: "month",
        isCurrent: false,
        raw: text,
      };
    }
  }

  const slash = MONTH_SLASH_YEAR_PATTERN.exec(text);
  if (slash) {
    const month = Number(slash[1]);
    if (month >= 1 && month <= 12) {
      return {
        iso: `${slash[2]}-${pad(month)}`,
        precision: "month",
        isCurrent: false,
        raw: text,
      };
    }
  }

  const dash = YEAR_DASH_MONTH_PATTERN.exec(text);
  if (dash) {
    const month = Number(dash[2]);
    if (month >= 1 && month <= 12) {
      return {
        iso: `${dash[1]}-${pad(month)}`,
        precision: "month",
        isCurrent: false,
        raw: text,
      };
    }
  }

  const season = SEASON_YEAR_PATTERN.exec(text);
  if (season) {
    return {
      iso: `${season[1]}-01`,
      precision: "year",
      isCurrent: false,
      raw: text,
    };
  }

  const year = YEAR_ONLY_PATTERN.exec(text);
  if (year) {
    return {
      iso: `${year[1]}-01`,
      precision: "year",
      isCurrent: false,
      raw: text,
    };
  }

  return empty;
}

/**
 * The `YYYY-MM` value for a free-form date, or null when there is none.
 * A "Present" date yields null: the end date is empty and `isCurrent` is set.
 */
export function toIsoMonth(raw: string): string | null {
  return parseResumeDate(raw).iso;
}

/**
 * A short label for a stored `YYYY-MM` value, or an empty string.
 */
export function formatIsoMonth(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = Number(match[2]);
  const name = Object.keys(MONTHS).find((key) => MONTHS[key] === month);
  const label = name
    ? name.slice(0, 3).replace(/^./, (c) => c.toUpperCase())
    : match[2];
  return `${label} ${match[1]}`;
}
