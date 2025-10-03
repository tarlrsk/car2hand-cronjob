import { Config, JobConfig } from "../types/types";
import dotenv from "dotenv";

dotenv.config();

export const config: Config = {
  googleSheetId: process.env.GOOGLE_SHEET_ID || "",
  googleSheetNameJob1: process.env.GOOGLE_SHEET_NAME_JOB_1 || "Sheet1",
  googleSheetNameJob2: process.env.GOOGLE_SHEET_NAME_JOB_2 || "Sheet1",
  googleCredentials: process.env.GOOGLE_CREDENTIALS_JSON || "",
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  lineUserId: process.env.LINE_USER_ID || "",
  nodeEnv: process.env.NODE_ENV || "development",
};

export function validateConfig(): void {
  const requiredFields: (keyof Omit<Config, "jobs">)[] = [
    "googleSheetId",
    "googleSheetNameJob1",
    "googleCredentials",
    "lineChannelAccessToken",
    "lineUserId",
  ];

  const missing = requiredFields.filter((field) => !config[field]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
