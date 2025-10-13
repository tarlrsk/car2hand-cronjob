import { VercelRequest, VercelResponse } from "@vercel/node";
import { NotifyOverdueStockVehiclesService } from "../src/job/notify-overdue-stock-vehicles";
import { MongoDbService } from "../src/service/mongodb-service";
import { Logger } from "../src/log/logger";

const logger = new Logger();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Basic authentication check
  const authHeader = req.headers.authorization;
  const expectedAuth = process.env.API_SECRET;

  if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const mongoDbService = new MongoDbService();
  let notifyOverdueStockVehicles: NotifyOverdueStockVehiclesService;

  try {
    logger.info("Starting notify-overdue-stock-vehicles API job");

    // Connect to MongoDB
    await mongoDbService.connect();

    // Initialize and execute job
    notifyOverdueStockVehicles = new NotifyOverdueStockVehiclesService(
      mongoDbService
    );
    await notifyOverdueStockVehicles.initialize();
    await notifyOverdueStockVehicles.executeJob();

    logger.info("API job completed successfully");

    return res.status(200).json({
      success: true,
      message: "Overdue stock vehicles notification job completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("API job failed", error as Error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    // Cleanup MongoDB connection
    try {
      if (mongoDbService) {
        await mongoDbService.disconnect();
      }
    } catch (cleanupError) {
      logger.error("MongoDB cleanup failed", cleanupError as Error);
    }
  }
}
