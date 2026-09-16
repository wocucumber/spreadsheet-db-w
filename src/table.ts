import { GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import type { InferSchema, InferSchemaPartial, Schema } from "./schema.js";

export type Row<TableType extends Schema> = InferSchema<TableType> & {
  id: number;
  // rowId: number;
};

export const NULL_VALUE = "*;[<<null>];*";

function parseToString(value: null | any): string {
  if (value == null) return NULL_VALUE;
  return value.toString();
}

export class Table<S extends Schema> {
  private sheet: GoogleSpreadsheetWorksheet;
  public schema: S;
  constructor(sheet: GoogleSpreadsheetWorksheet, schema: S) {
    this.sheet = sheet;
    this.schema = schema;
  }
  private parseRow(r: GoogleSpreadsheetRow) {
    const id = r.get("id");
    if (!id || isNaN(Number(id))) throw new Error("Row: id is not defined.");

    const row: any = {
      id: Number(id),
      // rowId: r.rowNumber
    };

    const shape = this.schema;
    for (const key of Object.keys(shape) as [keyof typeof shape]) {
      // @ts-ignore
      row[key] = shape[key].__validate(r.get(this.schema[key].__key));
    }

    return row;
  }
  async getRows(): Promise<Row<S>[]> {
    const rows: Row<S>[] = [];

    for (const r of await this.sheet.getRows()) {
      rows.push(this.parseRow(r));
    }

    return rows;
  }
  async find(id: number) {
    const rows = await this.getRows();
    return rows.find(r => r.id == id);
  }
  async where(filter: InferSchemaPartial<S>) {
    const rows = await this.getRows();
    const filterKeys = Object.keys(filter);
    return rows.filter(r => {
      for (const key of filterKeys) {
        if (filter[key] != r[key]) return false;
      }
      return true;
    });
  }
  async filter(predicate: (value: Row<S>, index: number, array: Row<S>[]) => boolean | Promise<boolean>) {
    return (await this.getRows()).filter(predicate);
  }
  async updateRow(id: number, value: InferSchemaPartial<S>): Promise<void>;
  async updateRow(target: InferSchemaPartial<S> & {id: number}): Promise<void>;

  async updateRow(argument: InferSchemaPartial<S> & {id: number} | number, v?: InferSchemaPartial<S>) {
    const id = typeof argument == "number" ? argument : argument.id;
    const rows = await this.sheet.getRows();
    const row  = rows.find(r => r.get("id") == id);

    if (!row) throw new Error("Row: "+id+" is not found.");

    const value = typeof argument == "number" ? v : argument;

    const shape = this.schema;
    for (const key of Object.keys(shape) as [keyof typeof shape]) {
      // @ts-ignore
      if (key in value)
        // @ts-ignore
        row.set(shape[key].__key, parseToString(shape[key].__validate(value[key])))
      
    }

    await row.save();
  }

  async appendRow(value: Omit<InferSchema<S>, "id">) {
    const rows = await this.sheet.getRows();
    const newId = rows.reduce((prev, curr) => Math.max(prev, Number(curr.get("id"))), 0) + 1;

    const parsed = {};
    const shape = this.schema;
    for (const key of Object.keys(shape)) {
      // @ts-ignore
      parsed[key] = parseToString(shape[key].__validate(value[key]));
    }

    const row = await this.sheet.addRow({
      newId,
      ...parsed
    });

    return this.parseRow(row);
  }

  async deleteRow(id: number): Promise<void>;
  async deleteRow(target: S & {id: number}): Promise<void>;

  async deleteRow(argument: S & {id: number} | number) {
    const id = typeof argument == "number" ? argument : argument.id;

    const rows = await this.sheet.getRows();
    const row  = rows.find(r => r.get("id") == id);

    if (!row) throw new Error("Row: "+id+" is not found.");

    await row.delete();
  }
}