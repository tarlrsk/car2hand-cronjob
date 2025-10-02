import { LineServiceInterface, NotificationData } from "../types/types";
import { Client } from "@line/bot-sdk";
import { config } from "../config/config";
import { Logger } from "../log/logger";

export class LineService implements LineServiceInterface {
  private client: Client;
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    this.client = new Client({
      channelAccessToken: config.lineChannelAccessToken,
    });
    this.logger.info("LINE Bot SDK client initialized successfully");
  }

  async sendNotification(data: NotificationData): Promise<void> {
    try {
      const message = this.formatNotificationMessage(data);

      this.logger.info("Sending LINE notification", {
        userId: config.lineUserId,
        value: data.value,
        rowIndex: data.rowIndex,
      });

      await this.client.pushMessage(config.lineUserId, {
        type: "text",
        text: message,
      });

      this.logger.info("LINE notification sent successfully", {
        userId: config.lineUserId,
        value: data.value,
        rowIndex: data.rowIndex,
      });
    } catch (error) {
      this.logger.error("Failed to send LINE notification", error as Error, {
        userId: config.lineUserId,
        value: data.value,
        rowIndex: data.rowIndex,
      });
      throw new Error(
        `Failed to send LINE notification: ${(error as Error).message}`
      );
    }
  }

  private formatNotificationMessage(data: NotificationData): string {
    const message =
      `🚨 Alert: Low Value Detected!

` +
      `� Job: ${data.jobName}
` +
      `�📊 Value: ${data.value}
` +
      `📍 Row: ${data.rowIndex} | Column: ${data.columnIndex}
` +
      `⚠️ Threshold: < ${data.threshold}
` +
      `🕐 Time: ${data.currentTime}

` +
      `Please check the spreadsheet for details.`;

    return message;
  }

  async sendTestMessage(jobName?: string): Promise<void> {
    try {
      const testMessage =
        `✅ Car2Hand Cron Job Test

` +
        `🤖 System is running properly
` +
        `� Job: ${jobName || "System Test"}
` +
        `� Time: ${new Date().toISOString()}`;

      await this.client.pushMessage(config.lineUserId, {
        type: "text",
        text: testMessage,
      });

      this.logger.info("Test message sent successfully");
    } catch (error) {
      this.logger.error("Failed to send test message", error as Error);
      throw error;
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.client.getProfile(config.lineUserId);
      this.logger.info("LINE connection validated successfully");
      return true;
    } catch (error) {
      this.logger.error("LINE connection validation failed", error as Error);
      return false;
    }
  }
}
