import { config, validateConfig } from "../config/config";
import { GoogleSheetsService } from "../service/google-sheets-service";
import { LineService } from "../service/line-service";
import { Logger } from "../log/logger";
import { NotificationData } from "../types/types";
import { parseDate } from "../util/date";

const JOB_NAME = "notify-overdue-stock-vehicles";

export class NotifyOverdueStockVehiclesService {
  private googleSheetsService: GoogleSheetsService;
  private lineService: LineService;
  private logger: Logger;

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

      const isLineConnected = await this.lineService.validateConnection();
      if (!isLineConnected) {
        throw new Error("LINE service connection failed");
      }

      this.logger.info(
        "Notify Overdue Stock Vehicles Cron job service initialized successfully"
      );
    } catch (error) {
      this.logger.error(
        "Failed to initialize cron job service",
        error as Error
      );
      throw error;
    }
  }

  async executeJob(): Promise<void> {
    try {
      this.logger.info("Executing job", {
        jobName: JOB_NAME,
      });

      const sheet = await this.googleSheetsService.readSheet(
        config.googleSheetNameJob1
      );

      const inStockDateIdx = 5;
      const licensePlateIdx = 8;
      const makeIdx = 11;
      const modelIdx = 12;
      const yearIdx = 14;
      const campaignIdx = 17;
      const priceIdx = 18;

      const notificationsToSend = [];

      for (const row of sheet) {
        const inStockDateValue = row.values[inStockDateIdx];

        if (!inStockDateValue) {
          continue; // Skip rows without stock date
        }

        // Parse the stock date
        const inStockDate = parseDate(inStockDateValue);
        if (!inStockDate) {
          this.logger.warn("Invalid stock date format", {
            jobName: JOB_NAME,
            rowIndex: row.rowIndex,
            dateValue: inStockDateValue,
          });
          continue;
        }

        const now = new Date();

        // Calculate months since stock date
        const monthsSinceStock = this.getMonthsDifference(inStockDate, now);

        // Check if it's time to notify
        if (this.shouldNotify(inStockDate, now)) {
          const licensePlate = this.cleanText(
            String(row.values[licensePlateIdx] || "N/A")
          );
          const make = this.cleanText(String(row.values[makeIdx] || "N/A"));
          const model = this.cleanText(String(row.values[modelIdx] || "N/A"));
          const year = this.cleanText(String(row.values[yearIdx] || "N/A"));
          const campaign = this.cleanText(
            String(row.values[campaignIdx] || "N/A")
          );
          const price = this.cleanText(String(row.values[priceIdx] || "N/A"));

          notificationsToSend.push({
            rowIndex: row.rowIndex,
            inStockDate,
            monthsSinceStock,
            vehicleInfo: {
              licensePlate,
              make,
              model,
              year,
              campaign,
              price,
            },
          });
        }
      }

      this.logger.info("Overdue stock check completed", {
        jobName: JOB_NAME,
      });

      // Send notifications
      for (const notification of notificationsToSend) {
        await this.processOverdueStockNotification(notification);
      }

      if (notificationsToSend.length === 0) {
        this.logger.info("No overdue stock notifications needed", {
          jobName: JOB_NAME,
        });
      }
    } catch (error) {
      this.logger.error("Error executing job", error as Error, {
        jobName: JOB_NAME,
      });
      throw error;
    }
  }

  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    return years * 12 + months;
  }

  private cleanText(text: string): string {
    if (!text || text === "N/A") {
      return text;
    }

    // Remove all types of newlines and extra whitespace, replace with separator
    return text
      .replace(/\r\n/g, " ") // Windows line endings
      .replace(/\n/g, " ") // Unix line endings
      .replace(/\r/g, " ") // Mac line endings
      .replace(/\s+/g, " ") // Multiple spaces/tabs to single space
      .trim(); // Remove leading/trailing whitespace
  }

  private shouldNotify(inStockDate: Date, currentDate: Date): boolean {
    const monthsSinceStock = this.getMonthsDifference(inStockDate, currentDate);

    // Must be at least 2 months since stock date for first notification
    if (monthsSinceStock < 2) {
      return false;
    }

    // Handle edge cases for day-of-month matching
    const stockDay = inStockDate.getDate();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get the last day of current month to handle edge cases
    const lastDayOfCurrentMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

    // Case 1: Exact day match (normal case)
    if (currentDay === stockDay) {
      return true;
    }

    // Case 2: Stock day doesn't exist in current month (e.g., stock on 31st, current month has only 30 days)
    // In this case, notify on the last day of the month
    if (
      stockDay > lastDayOfCurrentMonth &&
      currentDay === lastDayOfCurrentMonth
    ) {
      return true;
    }

    return false;
  }

  private async processOverdueStockNotification(notification: {
    rowIndex: number;
    inStockDate: Date;
    monthsSinceStock: number;
    vehicleInfo: {
      licensePlate: string;
      make: string;
      model: string;
      year: string;
      campaign: string;
      price: string;
    };
  }): Promise<void> {
    try {
      // Create a detailed message for overdue stock notification
      const vehicleDetails = `
แจ้งเตือนรถค้างสต็อคเกิน 60 วัน 
${notification.vehicleInfo.make} ${notification.vehicleInfo.model} ${notification.vehicleInfo.year}
ป้ายทะเบียน: ${notification.vehicleInfo.licensePlate}
ราคา: ${notification.vehicleInfo.price}
แคมเปญ: ${notification.vehicleInfo.campaign}`.trim();

      const notificationData: NotificationData = {
        receiverId: config.lineUserId,
        message: vehicleDetails,
      };

      await this.lineService.sendNotification(notificationData);

      this.logger.info("Overdue stock notification sent successfully", {
        jobName: JOB_NAME,
        rowIndex: notification.rowIndex,
        monthsSinceStock: notification.monthsSinceStock,
        licensePlate: notification.vehicleInfo.licensePlate,
        inStockDate: notification.inStockDate.toISOString(),
      });
    } catch (error) {
      this.logger.error(
        "Failed to process overdue stock notification",
        error as Error,
        {
          jobName: JOB_NAME,
          rowIndex: notification.rowIndex,
          monthsSinceStock: notification.monthsSinceStock,
        }
      );
    }
  }
}
