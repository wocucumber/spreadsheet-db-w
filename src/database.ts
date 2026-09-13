import { Authorication } from "./authorication.js";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { Table } from "./table.js";
import type { Schema } from "./schema.js";

export class Database {
  private _spreadsheet: GoogleSpreadsheet;
  private _initialized: boolean;
  constructor(spreadsheetId: string, auth: Authorication) {
    this._spreadsheet = new GoogleSpreadsheet(spreadsheetId, auth.jwt);  
    this._initialized = false;
  }


  async useTable<T extends Schema>({sheetId, schema}: {sheetId: number, schema: T}): Promise<Table<T>>;
  async useTable<T extends Schema>({sheetName, schema}: {sheetName: string, schema: T}): Promise<Table<T>>;
  
  async useTable<T extends Schema>({sheetName, sheetId, schema}: {sheetName?: string, sheetId?: number, schema: T}): Promise<Table<T>> {
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

    return new Table<T>(sheet, schema);
  }
}