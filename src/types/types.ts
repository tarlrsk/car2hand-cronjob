export interface JobConfig {
  name: string;
}

export interface Config {
  googleSheetId: string;
  googleSheetNameJob1: string;
  googleSheetNameJob2: string;
  googleCredentials: string;
  lineChannelAccessToken: string;
  lineUserId: string;
  nodeEnv: string;
}

export interface SheetRow {
  values: (string | number)[];
  rowIndex: number;
}

export interface NotificationData {
  receiverId: string;
  message: string;
}

export interface GoogleSheetsServiceInterface {
  readSheet(sheetName?: string): Promise<SheetRow[]>;
}

export interface LineServiceInterface {
  sendNotification(data: NotificationData): Promise<void>;
}

export interface LoggerInterface {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}
