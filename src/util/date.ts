import { parse, isValid } from "date-fns";
import { toZonedTime, fromZonedTime, format } from "date-fns-tz";
import { config } from "../config/config";
import { Logger } from "../log/logger";

// Local timezone utilities
export function getNowInLocal(): Date {
  return toZonedTime(new Date(), config.timezone);
}

export function createLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0
): Date {
  const localDate = new Date(year, month - 1, day, hour, minute);
  return fromZonedTime(localDate, config.timezone);
}

export function parseDate(dateValue: string | number): Date | null {
  if (!dateValue) {
    return null;
  }

  // Convert to string if it's a number
  const dateStr = String(dateValue).trim();

  // Common date formats to try with date-fns
  const formats = [
    "dd/M/yy", // 18/7/25
    "dd/MM/yy", // 18/07/25
    "dd/M/yyyy", // 18/7/2025
    "dd/MM/yyyy", // 18/07/2025
    "dd-M-yy", // 18-7-25
    "dd-MM-yy", // 18-07-25
    "dd-M-yyyy", // 18-7-2025
    "dd-MM-yyyy", // 18-07-2025
    "yyyy-MM-dd", // 2025-07-18 (ISO)
    "MM/dd/yyyy", // 07/18/2025 (US format)
  ];

  // Try each format
  for (const format of formats) {
    try {
      // Use local time as reference for relative parsing
      const referenceDate = getNowInLocal();
      const parsedDate = parse(dateStr, format, referenceDate);

      if (isValid(parsedDate)) {
        // Convert to local timezone
        return fromZonedTime(parsedDate, config.timezone);
      }
    } catch (error) {
      continue;
    }
  }

  // Fallback: try JavaScript's default parsing and convert to local timezone
  const defaultDate = new Date(dateStr);
  if (isValid(defaultDate)) {
    return fromZonedTime(defaultDate, config.timezone);
  }

  return null;
}
