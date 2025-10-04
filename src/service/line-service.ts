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
        userIds: data.receiverIds,
        userCount: data.receiverIds.length,
      });

      // Multiple users - use multicast
      await this.sendToMultipleUsers(data.receiverIds, data.message);

      this.logger.info("LINE notification sent successfully", {
        userIds: data.receiverIds,
        userCount: data.receiverIds.length,
      });
    } catch (error) {
      this.logger.error("Failed to send LINE notification", error as Error, {
        receiverId: data.receiverIds,
      });
      throw new Error(
        `Failed to send LINE notification: ${(error as Error).message}`
      );
    }
  }

  async sendToMultipleUsers(userIds: string[], message: string): Promise<void> {
    try {
      this.logger.info("Sending message to multiple users", {
        userCount: userIds.length,
      });

      if (userIds.length === 0) {
        this.logger.warn("No user IDs provided for sending message");
        return;
      }

      // LINE multicast supports up to 500 recipients per call
      const batchSize = 500;
      const batches = [];

      for (let i = 0; i < userIds.length; i += batchSize) {
        batches.push(userIds.slice(i, i + batchSize));
      }

      // Send to each batch
      for (const batch of batches) {
        await this.client.multicast({
          to: batch,
          messages: [{ type: "text", text: message }],
        });

        this.logger.info(`Sent message to batch of ${batch.length} users`);
      }
    } catch (error) {
      this.logger.error(
        "Failed to send message to multiple users",
        error as Error,
        {
          userCount: userIds.length,
        }
      );
      throw new Error(
        `Failed to send message to multiple users: ${(error as Error).message}`
      );
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.client.getProfile(config.lineUserId);
      return true;
    } catch (error) {
      this.logger.error("LINE connection validation failed", error as Error);
      return false;
    }
  }
}
