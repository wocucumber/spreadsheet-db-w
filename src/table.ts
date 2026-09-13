import { GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import z, { ZodObject, type ZodRawShape } from "zod";

export type Row<TableType extends ZodObject<ZodRawShape>> = z.infer<TableType> & {
  id: number;
  // rowId: number;
};

export class Table<ZodType extends ZodObject<ZodRawShape>> {
  private sheet: GoogleSpreadsheetWorksheet;
  public type: ZodType;
  constructor(sheet: GoogleSpreadsheetWorksheet, type: ZodType) {
    this.sheet = sheet;
    this.type = type;
  }
  private parseRow(r: GoogleSpreadsheetRow) {
    const id = r.get("id");
    if (!id || isNaN(Number(id))) throw new Error("Row: id is not defined.");

    const row: any = {
      id: Number(id),
      // rowId: r.rowNumber
    };

    const shape = this.type.shape
    for (const key of Object.keys(shape)) {
      // @ts-ignore
      row[key] = shape[key].parse(r.get(key));
    }

    return row;
  }
  async getRows(): Promise<Row<ZodType>[]> {
    const rows: Row<ZodType>[] = [];

    for (const r of await this.sheet.getRows()) {
      rows.push(this.parseRow(r));
    }

    return rows;
  }
  async find(id: number) {
    const rows = await this.getRows();
    return rows.find(r => r.id == id);
  }
  async where(filter: z.infer<ReturnType<typeof this.type.partial>>) {
    const rows = await this.getRows();
    const filterKeys = Object.keys(filter);
    return rows.filter(r => {
      for (const key of filterKeys) {
        if (filter[key] != r[key]) return false;
      }
      return true;
    });
  }
  async filter(predicate: (value: Row<ZodType>, index: number, array: Row<ZodType>[]) => boolean | Promise<boolean>) {
    return (await this.getRows()).filter(predicate);
  }
  async updateRow(id: number): Promise<void>;
  async updateRow(target: z.infer<ReturnType<typeof this.type.partial>> & {id: number}): Promise<void>;

  async updateRow(argument: z.infer<ReturnType<typeof this.type.partial>> & {id: number} | number) {
    const id = typeof argument == "number" ? argument : argument.id;
    const rows = await this.sheet.getRows();
    const row  = rows.find(r => r.get("id") == id);

    if (!row) throw new Error("Row: "+id+" is not found.");


    const shape = this.type.shape;
    for (const key of Object.keys(shape)) {
      // @ts-ignore
      if (key in value)
        // @ts-ignore
        row.set(key, String(shape[key].parse(value[key])))
      
    }

    await row.save();
  }

  async appendRow(value: z.infer<ZodType>) {
    const rows = await this.sheet.getRows();
    const newId = rows.reduce((prev, curr) => Math.max(prev, Number(curr.get("id"))), 0) + 1;

    const parsed = {};
    const shape = this.type.shape;
    for (const key of Object.keys(shape)) {
      // @ts-ignore
      parsed[key] = String(shape[key].parse(value[key]));
    }

    const row = await this.sheet.addRow({
      newId,
      ...parsed
    });

    return this.parseRow(row);
  }

  async deleteRow(id: number): Promise<void>;
  async deleteRow(target: z.infer<ReturnType<typeof this.type.partial>> & {id: number}): Promise<void>;

  async deleteRow(argument: z.infer<ReturnType<typeof this.type.partial>> & {id: number} | number) {
    const id = typeof argument == "number" ? argument : argument.id;

    const rows = await this.sheet.getRows();
    const row  = rows.find(r => r.get("id") == id);

    if (!row) throw new Error("Row: "+id+" is not found.");

    await row.delete();
  }
}