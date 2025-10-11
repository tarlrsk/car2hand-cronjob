import { config, validateConfig } from "../config/config";
import { GoogleSheetsService } from "../service/google-sheets-service";
import { LineService } from "../service/line-service";
import { MongoDbService } from "../service/mongodb-service";
import { Logger } from "../log/logger";
import { NotificationData } from "../types/types";
import { differenceInDays } from "date-fns";
import { parseDate, getNowInLocal } from "../util/date";

const JOB_NAME = "notify-vehicles-near-tax-deadline";

interface VehicleTaxInfo {
  rowIndex: number;
  oldLicensePlate: string;
  newLicensePlate: string;
  model: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}

export class NotifyVehiclesNearTaxDeadlineService {
  private googleSheetsService: GoogleSheetsService;
  private lineService: LineService;
  private mongoDbService: MongoDbService;
  private logger: Logger;

  constructor(mongoDbService: MongoDbService) {
    this.logger = new Logger();
    this.googleSheetsService = new GoogleSheetsService();
    this.lineService = new LineService();
    this.mongoDbService = mongoDbService;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info(
        "Initializing notify-vehicles-near-tax-deadline cron job service..."
      );

      // Validate configuration
      validateConfig();

      const isLineConnected = await this.lineService.validateConnection();
      if (!isLineConnected) {
        throw new Error("LINE service connection failed");
      }
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

      const jobConfig = await this.mongoDbService.getJobConfigByJobName(
        JOB_NAME
      );
      if (!jobConfig) {
        return;
      }

      const sheet = await this.googleSheetsService.readSheet(
        jobConfig.sheetName
      );

      const expiresDateIdx = 8;
      const oldLicensePlateIdx = 3;
      const newLicensePlateIdx = 4;
      const modelIdx = 5;

      const vehiclesNearDeadline: VehicleTaxInfo[] = [];

      // Start from row index 1 (skip header row)
      for (const row of sheet.slice(1)) {
        const expiryDateValue = row.values[expiresDateIdx];

        if (!expiryDateValue) {
          continue; // Skip rows without expiry date
        }

        // Parse the expiry date
        const expiryDate = parseDate(expiryDateValue);
        if (!expiryDate) {
          this.logger.warn("Invalid expiry date format", {
            jobName: JOB_NAME,
            rowIndex: row.rowIndex,
            dateValue: expiryDateValue,
          });
          continue;
        }

        const now = getNowInLocal();
        const daysUntilExpiry = differenceInDays(expiryDate, now);

        // Check if vehicle needs tax renewal within 60 days
        if (daysUntilExpiry <= 60) {
          const oldLicensePlate = this.cleanText(
            String(row.values[oldLicensePlateIdx] || "N/A")
          );
          const newLicensePlate = this.cleanText(
            String(row.values[newLicensePlateIdx] || "N/A")
          );
          const model = this.cleanText(String(row.values[modelIdx] || "N/A"));

          vehiclesNearDeadline.push({
            rowIndex: row.rowIndex,
            oldLicensePlate,
            newLicensePlate,
            model,
            expiryDate,
            daysUntilExpiry,
          });
        }
      }

      this.logger.info("Tax deadline check completed", {
        jobName: JOB_NAME,
        vehiclesFound: vehiclesNearDeadline.length,
      });

      // Send single consolidated notification if there are vehicles near deadline
      if (vehiclesNearDeadline.length > 0) {
        await this.processTaxDeadlineNotification(
          jobConfig.receiverLineIds,
          jobConfig.groupLineIds,
          vehiclesNearDeadline
        );
      } else {
        this.logger.info("No vehicles near tax deadline", {
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

  private cleanText(text: string): string {
    if (!text || text === "N/A") {
      return text;
    }

    // Remove all types of newlines and extra whitespace, replace with separator
    return text
      .replace(/\r\n/g, " | ") // Windows line endings
      .replace(/\n/g, " | ") // Unix line endings
      .replace(/\r/g, " | ") // Mac line endings
      .replace(/\s+/g, " ") // Multiple spaces/tabs to single space
      .trim(); // Remove leading/trailing whitespace
  }

  private async processTaxDeadlineNotification(
    receiverIds: string[],
    groupIds: string[],
    vehicles: VehicleTaxInfo[]
  ): Promise<void> {
    try {
      const CARS_PER_MESSAGE = 30;
      const totalVehicles = vehicles.length;
      const totalMessages = Math.ceil(totalVehicles / CARS_PER_MESSAGE);

      // Split vehicles into chunks of 30
      for (let messageIndex = 0; messageIndex < totalMessages; messageIndex++) {
        const startIndex = messageIndex * CARS_PER_MESSAGE;
        const endIndex = Math.min(startIndex + CARS_PER_MESSAGE, totalVehicles);
        const vehiclesBatch = vehicles.slice(startIndex, endIndex);

        // Create message header with batch info
        let message = `แจ้งเตือนรถที่ต้องต่อภาษีภายใน 60 วัน`;

        if (totalMessages > 1) {
          message += ` (ข้อความที่ ${messageIndex + 1}/${totalMessages})`;
        }

        // Add vehicles to message
        vehiclesBatch.forEach((vehicle, index) => {
          const carNumber = startIndex + index + 1; // Global car number across all messages
          const formattedDate = vehicle.expiryDate.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          message += `\n\nคันที่ ${carNumber}`;
          message += `\nทะเบียนเก่า: ${vehicle.oldLicensePlate}`;
          message += `\nทะเบียนใหม่: ${vehicle.newLicensePlate}`;
          message += `\nรุ่น: ${vehicle.model}`;
          message += `\nวันหมดอายุ: ${formattedDate}`;
        });

        const notificationData: NotificationData = {
          receiverIds: receiverIds,
          groupIds: groupIds,
          message: message,
        };

        await this.lineService.sendNotification(notificationData);

        this.logger.info("Tax deadline notification sent successfully", {
          jobName: JOB_NAME,
          messageNumber: messageIndex + 1,
          totalMessages: totalMessages,
          vehicleCount: vehiclesBatch.length,
          totalVehicles: totalVehicles,
          vehicles: vehiclesBatch.map((v) => ({
            rowIndex: v.rowIndex,
            oldLicensePlate: v.oldLicensePlate,
            newLicensePlate: v.newLicensePlate,
            daysUntilExpiry: v.daysUntilExpiry,
          })),
        });

        // Add a small delay between messages to avoid rate limiting
        if (messageIndex < totalMessages - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        }
      }
    } catch (error) {
      this.logger.error(
        "Failed to process tax deadline notification",
        error as Error,
        {
          jobName: JOB_NAME,
          vehicleCount: vehicles.length,
        }
      );
    }
  }
}
