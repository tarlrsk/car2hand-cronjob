import { LineServiceInterface, NotificationData } from "../types/types";
import { messagingApi } from "@line/bot-sdk";
import { config } from "../config/config";
import { Logger } from "../log/logger";

const { MessagingApiClient } = messagingApi;

export class LineService implements LineServiceInterface {
  private client: messagingApi.MessagingApiClient;
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    this.client = new MessagingApiClient({
      channelAccessToken: config.lineChannelAccessToken,
    });
    this.logger.info("LINE Bot SDK client initialized successfully");
  }

  async sendNotification(data: NotificationData): Promise<void> {
    try {
      this.logger.info("Sending LINE notification", {
        userId: data.receiverId,
      });

      await this.client.pushMessage({
        to: data.receiverId,
        messages: [{ type: "text", text: data.message }],
      });

      this.logger.info("LINE notification sent successfully", {
        userId: data.receiverId,
      });
    } catch (error) {
      this.logger.error("Failed to send LINE notification", error as Error, {
        userId: data.receiverId,
      });
      throw new Error(
        `Failed to send LINE notification: ${(error as Error).message}`
      );
    }
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

      await this.client.pushMessage({
        to: config.lineUserId,
        messages: [{ type: "text", text: testMessage }],
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
