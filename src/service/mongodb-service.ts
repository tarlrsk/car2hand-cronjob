import { MongoClient, Db, Collection } from "mongodb";
import { Logger } from "../log/logger";
import { config } from "../config/config";

export interface JobConfig {
  _id?: string;
  jobName: string;
  receiverLineIds: string[];
  sheetName: string;
  isActive: boolean;
}

export class MongoDbService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private logger: Logger;
  private jobConfigCollection: Collection<JobConfig> | null = null;

  constructor() {
    this.logger = new Logger();
  }

  async connect(): Promise<void> {
    try {
      if (!config.mongoConnectionString) {
        throw new Error("MongoDB connection string not configured");
      }

      this.client = new MongoClient(config.mongoConnectionString);
      await this.client.connect();

      this.db = this.client.db(config.mongoDatabase);
      this.jobConfigCollection = this.db.collection<JobConfig>("jobconfigs");

      // Create index on jobName for better performance
      await this.jobConfigCollection.createIndex(
        { jobName: 1 },
        { unique: true }
      );

      this.logger.info("Connected to MongoDB successfully", {
        database: config.mongoDatabase,
      });
    } catch (error) {
      this.logger.error("Failed to connect to MongoDB", error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.jobConfigCollection = null;
        this.logger.info("Disconnected from MongoDB");
      }
    } catch (error) {
      this.logger.error("Error disconnecting from MongoDB", error as Error);
    }
  }

  async getJobConfigByJobName(jobName: string): Promise<JobConfig | null> {
    try {
      if (!this.jobConfigCollection) {
        throw new Error("MongoDB not connected");
      }

      const jobConfig = await this.jobConfigCollection.findOne({
        jobName,
        isActive: true,
      });

      if (!jobConfig) {
        this.logger.warn("job config not found", {
          jobName,
        });
        return null;
      }

      this.logger.info("Retrieved user IDs for job", {
        jobName,
        userCount: jobConfig.receiverLineIds.length,
      });

      return jobConfig;
    } catch (error) {
      this.logger.error(
        "Failed to get job config by job name",
        error as Error,
        {
          jobName,
        }
      );

      return null;
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Ping the database to check connection
      await this.client.db("admin").admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}
