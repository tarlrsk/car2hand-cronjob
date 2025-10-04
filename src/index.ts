import { Logger } from "./log/logger";
import { NotifyOverdueStockVehiclesService } from "./job/notify-overdue-stock-vehicles";
import { NotifyVehiclesNearTaxDeadlineService } from "./job/notify-vehicles-near-tax-deadline";
import { MongoDbService } from "./service/mongodb-service";

// Main execution function
async function main(): Promise<void> {
  const logger = new Logger();
  const mongoDbService = new MongoDbService();

  let notifyOverdueStockVehicles: NotifyOverdueStockVehiclesService;
  let notifyVehiclesNearTaxDeadline: NotifyVehiclesNearTaxDeadlineService;

  try {
    // Connect to MongoDB once at the start
    await mongoDbService.connect();

    // Initialize jobs with shared MongoDB service
    notifyOverdueStockVehicles = new NotifyOverdueStockVehiclesService(
      mongoDbService
    );
    notifyVehiclesNearTaxDeadline = new NotifyVehiclesNearTaxDeadlineService(
      mongoDbService
    );

    // Initialize and execute jobs
    await notifyOverdueStockVehicles.initialize();
    await notifyOverdueStockVehicles.executeJob();

    await notifyVehiclesNearTaxDeadline.initialize();
    await notifyVehiclesNearTaxDeadline.executeJob();

    logger.info("Cron job completed successfully");
  } catch (error) {
    logger.error("Cron job failed", error as Error);
  } finally {
    // Disconnect from MongoDB once at the end
    try {
      await mongoDbService.disconnect();
    } catch (cleanupError) {
      logger.error("MongoDB cleanup failed", cleanupError as Error);
    }

    // Force exit after cleanup
    process.exit(0);
  }
}

// Export for testing and Railway cron usage
export { NotifyOverdueStockVehiclesService, main };

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
