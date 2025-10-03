import { parse, isValid } from "date-fns";

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
      // Use current date as reference for relative parsing (helps with 2-digit years)
      const parsedDate = parse(dateStr, format, new Date());

      if (isValid(parsedDate)) {
        return parsedDate;
      }
    } catch (error) {
      // Continue to next format
      continue;
    }
  }

  // Fallback: try JavaScript's default parsing
  const defaultDate = new Date(dateStr);
  if (isValid(defaultDate)) {
    return defaultDate;
  }

  return null;
}
