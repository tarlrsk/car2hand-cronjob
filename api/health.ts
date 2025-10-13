import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests for health check
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    success: true,
    message: "Car2Hand Cron Job API is running",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/notify-overdue-stock - Notify overdue stock vehicles",
      "POST /api/notify-tax-deadline - Notify vehicles near tax deadline",
      "GET /api/health - Health check",
    ],
  });
}
