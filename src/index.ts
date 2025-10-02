import {
  config,
  validateConfig,
  getJobByName,
  getAllJobs,
} from "./config/config";
import { GoogleSheetsService } from "./service/googleSheetsService";
import { LineService } from "./service/lineService";
import { Logger } from "./log/logger";
import { NotificationData, JobConfig } from "./types/types";

class CronJobService {
  private googleSheetsService: GoogleSheetsService;
  private lineService: LineService;
  private logger: Logger;
  private lastNotificationTimes: Map<string, number> = new Map(); // Key: jobName-rowIndex
  private readonly NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown per row per job

  constructor() {
    this.logger = new Logger();
    this.googleSheetsService = new GoogleSheetsService();
    this.lineService = new LineService();
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info("Initializing cron job service...");

      // Validate configuration
      validateConfig();
      this.logger.info("Configuration validated successfully");

      // Test LINE connection
      const isLineConnected = await this.lineService.validateConnection();
      if (!isLineConnected) {
        throw new Error("LINE service connection failed");
      }

      this.logger.info("Cron job service initialized successfully", {
        sheetId: config.googleSheetId,
        totalJobs: config.jobs.length,
        jobs: config.jobs.map((job) => ({
          name: job.name,
          column: job.columnIndex,
          threshold: job.thresholdValue,
          schedule: job.schedule,
        })),
      });
    } catch (error) {
      this.logger.error(
        "Failed to initialize cron job service",
        error as Error
      );
      throw error;
    }
  }

  async checkAndNotify(jobName?: string): Promise<void> {
    try {
      this.logger.info("Starting check and notify process", { jobName });

      const jobsToRun = jobName
        ? ([getJobByName(jobName)].filter(Boolean) as JobConfig[])
        : getAllJobs();

      if (jobsToRun.length === 0) {
        this.logger.warn("No jobs found to execute", { requestedJob: jobName });
        return;
      }

      for (const job of jobsToRun) {
        await this.executeJob(job);
      }

      this.logger.info("Check and notify process completed", {
        executedJobs: jobsToRun.length,
      });
    } catch (error) {
      this.logger.error("Error in check and notify process", error as Error);
      throw error;
    }
  }

  private async executeJob(job: JobConfig): Promise<void> {
    try {
      this.logger.info("Executing job", {
        jobName: job.name,
        column: job.columnIndex,
        threshold: job.thresholdValue,
      });

      // Get column values from the specified column
      const columnValues = await this.googleSheetsService.getColumnValues(
        job.columnIndex
      );

      if (columnValues.length === 0) {
        this.logger.warn("No numeric values found in the specified column", {
          jobName: job.name,
          columnIndex: job.columnIndex,
        });
        return;
      }

      // Find values below threshold
      const belowThreshold = columnValues.filter(
        (item) => item.value < job.thresholdValue
      );

      this.logger.info("Job threshold check completed", {
        jobName: job.name,
        totalValues: columnValues.length,
        belowThreshold: belowThreshold.length,
        threshold: job.thresholdValue,
      });

      // Send notifications for values below threshold
      for (const item of belowThreshold) {
        await this.processNotification(item, job);
      }

      if (belowThreshold.length === 0) {
        this.logger.info(
          "All values are above threshold - no notifications needed",
          {
            jobName: job.name,
          }
        );
      }
    } catch (error) {
      this.logger.error("Error executing job", error as Error, {
        jobName: job.name,
      });
      throw error;
    }
  }

  private async processNotification(
    item: { value: number; rowIndex: number },
    job: JobConfig
  ): Promise<void> {
    try {
      // Create unique cooldown key for job and row combination
      const cooldownKey = `${job.name}-${item.rowIndex}`;

      // Check cooldown to prevent spam notifications
      const lastNotification = this.lastNotificationTimes.get(cooldownKey);
      const now = Date.now();

      if (
        lastNotification &&
        now - lastNotification < this.NOTIFICATION_COOLDOWN_MS
      ) {
        this.logger.info("Skipping notification due to cooldown", {
          jobName: job.name,
          rowIndex: item.rowIndex,
          value: item.value,
          lastNotification: new Date(lastNotification).toISOString(),
        });
        return;
      }

      const notificationData: NotificationData = {
        value: item.value,
        rowIndex: item.rowIndex,
        currentTime: new Date().toISOString(),
        jobName: job.name,
        columnIndex: job.columnIndex,
        threshold: job.thresholdValue,
      };

      await this.lineService.sendNotification(notificationData);

      // Update last notification time
      this.lastNotificationTimes.set(cooldownKey, now);

      this.logger.info("Notification sent successfully", {
        jobName: job.name,
        rowIndex: item.rowIndex,
        value: item.value,
      });
    } catch (error) {
      this.logger.error("Failed to process notification", error as Error, {
        jobName: job.name,
        rowIndex: item.rowIndex,
        value: item.value,
      });
      // Don't throw here to continue processing other notifications
    }
  }

  async sendStartupNotification(jobName?: string): Promise<void> {
    try {
      await this.lineService.sendTestMessage(jobName);
      this.logger.info("Startup notification sent", { jobName });
    } catch (error) {
      this.logger.error("Failed to send startup notification", error as Error, {
        jobName,
      });
      // Don't throw here as this is not critical
    }
  }
}

// Main execution function
async function main(): Promise<void> {
  const cronJob = new CronJobService();
  const logger = new Logger();

  try {
    // Get job name from command line arguments
    const jobName = process.argv[2];

    logger.info("Starting Car2Hand Cron Job", {
      jobName: jobName || "all jobs",
    });

    await cronJob.initialize();

    // Send startup notification (optional)
    if (config.nodeEnv === "production") {
      await cronJob.sendStartupNotification(jobName);
    }

    // Run the main check
    await cronJob.checkAndNotify(jobName);

    logger.info("Cron job completed successfully", {
      jobName: jobName || "all jobs",
    });
  } catch (error) {
    logger.error("Cron job failed", error as Error);
    process.exit(1);
  }
}

// Export for testing and Railway cron usage
export { CronJobService, main };

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
