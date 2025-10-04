export interface JobConfig {
  name: string;
}

export interface Config {
  googleSheetId: string;
  googleCredentials: string;
  lineChannelAccessToken: string;
  lineUserId: string;
  mongoConnectionString: string;
  mongoDatabase: string;
  nodeEnv: string;
  timezone: string;
}

export interface SheetRow {
  values: (string | number)[];
  rowIndex: number;
}

export interface NotificationData {
  receiverIds: string[];
  message: string;
}

export interface GoogleSheetsServiceInterface {
  readSheet(sheetName?: string): Promise<SheetRow[]>;
}

export interface LineServiceInterface {
  sendNotification(data: NotificationData): Promise<void>;
  sendToMultipleUsers(userIds: string[], message: string): Promise<void>;
}

export interface LoggerInterface {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}
