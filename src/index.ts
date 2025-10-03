import { Logger } from "./log/logger";
import { NotifyOverdueStockVehiclesService } from "./job/notify-overdue-stock-vehicles";
import { NotifyVehiclesNearTaxDeadlineService } from "./job/notify-vehicles-near-tax-deadline";

// Main execution function
async function main(): Promise<void> {
  const notifyOverdueStockVehicles = new NotifyOverdueStockVehiclesService();
  const notifyVehiclesNearTaxDeadline =
    new NotifyVehiclesNearTaxDeadlineService();
  const logger = new Logger();

  try {
    await notifyOverdueStockVehicles.initialize();
    await notifyOverdueStockVehicles.executeJob();

    await notifyVehiclesNearTaxDeadline.initialize();
    await notifyVehiclesNearTaxDeadline.executeJob();

    logger.info("Cron job completed successfully");
  } catch (error) {
    logger.error("Cron job failed", error as Error);
    process.exit(1);
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
