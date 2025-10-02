import { Config, JobConfig } from "../types/types";
import dotenv from "dotenv";

dotenv.config();

// Parse jobs from environment variable
function parseJobs(): JobConfig[] {
  const jobsJson = process.env.JOBS_CONFIG;

  if (jobsJson) {
    try {
      return JSON.parse(jobsJson);
    } catch (error) {
      console.warn("Failed to parse JOBS_CONFIG, using default job");
    }
  }

  // Default job configuration for backward compatibility
  return [
    {
      name: "default-monitor",
      columnIndex: parseInt(process.env.COLUMN_INDEX || "0", 10),
      thresholdValue: parseInt(process.env.THRESHOLD_VALUE || "90", 10),
      schedule: process.env.DEFAULT_SCHEDULE || "*/30 * * * *",
      description: "Default monitoring job",
    },
  ];
}

export const config: Config = {
  googleSheetId: process.env.GOOGLE_SHEET_ID || "",
  googleCredentials: process.env.GOOGLE_CREDENTIALS_JSON || "",
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  lineUserId: process.env.LINE_USER_ID || "",
  nodeEnv: process.env.NODE_ENV || "development",
  jobs: parseJobs(),
};

export function validateConfig(): void {
  const requiredFields: (keyof Omit<Config, "jobs">)[] = [
    "googleSheetId",
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

  if (!config.jobs || config.jobs.length === 0) {
    throw new Error("At least one job configuration is required");
  }

  // Validate each job
  config.jobs.forEach((job, index) => {
    if (!job.name) {
      throw new Error(`Job at index ${index} is missing a name`);
    }

    if (job.thresholdValue < 0 || job.thresholdValue > 100) {
      throw new Error(
        `Job '${job.name}': THRESHOLD_VALUE must be between 0 and 100`
      );
    }

    if (job.columnIndex < 0) {
      throw new Error(`Job '${job.name}': COLUMN_INDEX must be 0 or greater`);
    }
  });
}

export function getJobByName(jobName: string): JobConfig | undefined {
  return config.jobs.find((job) => job.name === jobName);
}

export function getAllJobs(): JobConfig[] {
  return config.jobs;
}
