import { Config } from "../types/types";
import dotenv from "dotenv";

dotenv.config();

export const config: Config = {
  googleSheetId: process.env.GOOGLE_SHEET_ID || "",
  googleCredentials: process.env.GOOGLE_CREDENTIALS_JSON || "",
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  lineUserId: process.env.LINE_USER_ID || "",
  mongoConnectionString: process.env.MONGO_CONNECTION_STRING || "",
  mongoDatabase: process.env.MONGO_DATABASE || "",
  nodeEnv: process.env.NODE_ENV || "development",
};

export function validateConfig(): void {
  const requiredFields: (keyof Config)[] = [
    "googleSheetId",
    "googleCredentials",
    "lineChannelAccessToken",
    "lineUserId",
    "mongoConnectionString",
    "mongoDatabase",
  ];

  const missing = requiredFields.filter((field) => !config[field]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
