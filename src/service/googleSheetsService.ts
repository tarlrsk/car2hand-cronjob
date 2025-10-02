import { GoogleSheetsServiceInterface, SheetRow } from "../types/types";
import { google } from "googleapis";
import { config } from "../config/config";
import { Logger } from "../log/logger";

export class GoogleSheetsService implements GoogleSheetsServiceInterface {
  private sheets: any;
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    this.initializeAuth();
  }

  private initializeAuth(): void {
    try {
      const credentials = JSON.parse(config.googleCredentials);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      this.sheets = google.sheets({ version: "v4", auth });
      this.logger.info("Google Sheets authentication initialized successfully");
    } catch (error) {
      this.logger.error(
        "Failed to initialize Google Sheets authentication",
        error as Error
      );
      throw new Error("Google Sheets authentication failed");
    }
  }

  async readSheet(): Promise<SheetRow[]> {
    try {
      this.logger.info("Starting to read Google Sheet", {
        sheetId: config.googleSheetId,
      });

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheetId,
        range: "A:Z", // Read all columns
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        this.logger.warn("No data found in the sheet");
        return [];
      }

      const sheetRows: SheetRow[] = rows.map((row: any[], index: number) => ({
        values: row || [],
        rowIndex: index + 1, // 1-based row indexing
      }));

      this.logger.info("Successfully read sheet data", {
        rowCount: sheetRows.length,
        firstRowLength: sheetRows[0]?.values.length || 0,
      });

      return sheetRows;
    } catch (error) {
      this.logger.error("Failed to read Google Sheet", error as Error, {
        sheetId: config.googleSheetId,
      });
      throw new Error(
        `Failed to read Google Sheet: ${(error as Error).message}`
      );
    }
  }

  async getColumnValues(
    columnIndex: number
  ): Promise<Array<{ value: number; rowIndex: number }>> {
    try {
      const rows = await this.readSheet();
      const columnValues: Array<{ value: number; rowIndex: number }> = [];

      for (const row of rows) {
        const cellValue = row.values[columnIndex];

        if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
          const numericValue =
            typeof cellValue === "number"
              ? cellValue
              : parseFloat(String(cellValue));

          if (!isNaN(numericValue)) {
            columnValues.push({
              value: numericValue,
              rowIndex: row.rowIndex,
            });
          }
        }
      }

      this.logger.info("Extracted column values", {
        columnIndex,
        validValues: columnValues.length,
      });

      return columnValues;
    } catch (error) {
      this.logger.error("Failed to get column values", error as Error, {
        columnIndex,
      });
      throw error;
    }
  }
}
