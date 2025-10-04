import { config, validateConfig } from "../config/config";
import { GoogleSheetsService } from "../service/google-sheets-service";
import { LineService } from "../service/line-service";
import { MongoDbService } from "../service/mongodb-service";
import { Logger } from "../log/logger";
import { NotificationData } from "../types/types";
import { differenceInDays } from "date-fns";
import { parseDate } from "../util/date";

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

        const now = new Date();
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
    vehicles: VehicleTaxInfo[]
  ): Promise<void> {
    try {
      // Create consolidated message for all vehicles
      let message = `แจ้งเตือนรถที่ต้องต่อภาษีภายใน 60 วัน`;

      vehicles.forEach((vehicle, index) => {
        const carNumber = index + 1;
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
        message: message,
      };

      await this.lineService.sendNotification(notificationData);

      this.logger.info("Tax deadline notification sent successfully", {
        jobName: JOB_NAME,
        vehicleCount: vehicles.length,
        vehicles: vehicles.map((v) => ({
          rowIndex: v.rowIndex,
          oldLicensePlate: v.oldLicensePlate,
          newLicensePlate: v.newLicensePlate,
          daysUntilExpiry: v.daysUntilExpiry,
        })),
      });
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
