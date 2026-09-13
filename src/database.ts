import { Authorication } from "./authorication";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { Table } from "./table";;
import type { Schema } from "./schema";

export class Database {
  private _spreadsheet: GoogleSpreadsheet;
  private _initialized: boolean;
  constructor(spreadsheetId: string, auth: Authorication) {
    this._spreadsheet = new GoogleSpreadsheet(spreadsheetId, auth.jwt);  
    this._initialized = false;
  }


  async useTable<T extends Schema>({sheetId, type}: {sheetId: number, type: T}): Promise<Table<T>>;
  async useTable<T extends Schema>({sheetName, type}: {sheetName: string, type: T}): Promise<Table<T>>;
  
  async useTable<T extends Schema>({sheetName, sheetId, type}: {sheetName?: string, sheetId?: number, type: T}): Promise<Table<T>> {
    if (!this._initialized)
      await this._spreadsheet.loadInfo();

    let sheet;

    if (sheetName != undefined && !sheetId) {
      sheet = this._spreadsheet.sheetsByTitle[sheetName];
    } else if (sheetId != undefined && !sheetName) {
      sheet = this._spreadsheet.sheetsById[sheetId];
    } else {
      throw new Error("You must pass only one of the arguments.");
    }

    if (!sheet)
      throw new Error("Sheet is not found.");

    return new Table<T>(sheet, type);
  }
}