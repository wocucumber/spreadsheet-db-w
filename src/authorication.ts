import { JWT } from "google-auth-library";

export class Authorication {
  private _jwt: JWT;
  constructor({private_key, client_email}: {private_key: string, client_email: string}) {
    this._jwt = new JWT({
      email: client_email,
      key: private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
  }

  get jwt() {
    return this._jwt;
  }
}