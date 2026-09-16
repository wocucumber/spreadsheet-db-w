import { NULL_VALUE } from "./table.js";

type NullValue = null;

type InferValidation<T extends ValidationObject> = ( T extends ValidationObject<infer Option> ?

  T extends StringValidation
    ? (Option extends {nullable: true} ? string | NullValue : string) :
  T extends NumberValidation
    ? (Option extends {nullable: true} ? number | NullValue : number) :

  never : never
);



export type Schema = Record<string, ValidationObject>;

export type InferSchema<T extends Schema> = {
  [K in keyof T]: InferValidation<T[K]>;
} & {
  id: InferValidation<NumberValidation>
};

export type InferSchemaPartial<T extends Schema> = Partial<InferSchema<T>>;

export function createSchema<T extends Schema>(schema: T): T & {id: NumberValidation} {
  return {
    ...schema,
    id: new NumberValidation("id")
  };
}

export class ValidationObject<T extends {nullable?: boolean} = {nullable: false}> {
  protected _nullable: boolean;
  private type: "string" | "number";
  private key: string;

  constructor(key: string, type: typeof this.type) {
    this.key = key;
    this.type = type;
    this._nullable = false;
  }

  optional() {
    this._nullable = true;
    return this as this & ValidationObject<{nullable: true}>;
  }

  protected validateBase(value: any) {
    if ((value == undefined || value == null) && !this._nullable)
      throw new Error("not nullable");
  }

  __validate(value: any) {}
  get __key() {
    return this.key;
  }
}

export class StringValidation extends ValidationObject {
  constructor(key: string) {
    super(key, "string");
  }
  override __validate(value: any): string | null {
    this.validateBase(value);
    if (value == "" && this._nullable)
      return null;

    if (value == NULL_VALUE)
      return null;

    return value.toString();
  }
}
export class NumberValidation extends ValidationObject {
  constructor(key: string) {
    super(key, "number");
  }
  override __validate(value: any): number | null {
    this.validateBase(value);

    if (value == "" && this._nullable)
      return null;

    if (value == NULL_VALUE)
      return null;

    if (isNaN(Number(value)))
      throw new Error("Valid error: not number");

    return Number(value);
  }
}

export function string(key: string) {
  return new StringValidation(key);
}
export function number(key: string) {
  return new NumberValidation(key);
}

