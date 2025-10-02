export interface JobConfig {
  name: string;
  columnIndex: number;
  thresholdValue: number;
  schedule: string;
  description?: string;
}

export interface Config {
  googleSheetId: string;
  googleCredentials: string;
  lineChannelAccessToken: string;
  lineUserId: string;
  nodeEnv: string;
  jobs: JobConfig[];
}

export interface SheetRow {
  values: (string | number)[];
  rowIndex: number;
}

export interface NotificationData {
  value: number;
  rowIndex: number;
  currentTime: string;
  jobName: string;
  columnIndex: number;
  threshold: number;
}

export interface GoogleSheetsServiceInterface {
  readSheet(): Promise<SheetRow[]>;
}

export interface LineServiceInterface {
  sendNotification(data: NotificationData): Promise<void>;
}

export interface LoggerInterface {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}
