import { config, validateConfig } from "./config/config";
import { GoogleSheetsService } from "./service/googleSheetsService";
import { LineService } from "./service/lineService";
import { Logger } from "./log/logger";

async function testServices(): Promise<void> {
  const logger = new Logger();

  try {
    logger.info("Starting service tests...");

    // Test configuration validation
    logger.info("Testing configuration validation...");
    try {
      validateConfig();
      logger.info("✅ Configuration validation passed");
    } catch (error) {
      logger.error("❌ Configuration validation failed", error as Error);
      return;
    }

    // Test Google Sheets service initialization
    logger.info("Testing Google Sheets service...");
    try {
      const sheetsService = new GoogleSheetsService();
      logger.info("✅ Google Sheets service initialized");
    } catch (error) {
      logger.error(
        "❌ Google Sheets service initialization failed",
        error as Error
      );
    }

    // Test LINE service initialization
    logger.info("Testing LINE service...");
    try {
      const lineService = new LineService();
      logger.info("✅ LINE service initialized");
    } catch (error) {
      logger.error("❌ LINE service initialization failed", error as Error);
    }

    logger.info("Service tests completed");
  } catch (error) {
    logger.error("Test script failed", error as Error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testServices().catch((error) => {
    console.error("Unhandled error in tests:", error);
    process.exit(1);
  });
}

export { testServices };
