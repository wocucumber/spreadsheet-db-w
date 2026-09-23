# spreadsheet-db-w

A typescript library to use google spreadsheet as a convenient database with type safety.

When use small applications for you or your family, it's a very good way to save data to use google spreadsheet instead of databases.

## ⚠️Warning⚠️
**You need to add "id" column to your all sheets for this library.**


## Installation
1. Prepare API key
  1. Create a service account on Google Cloud Platform
  2. Download a service account JSON key

2. Share your spreadsheet to use as a database with the service account email.
3. Install this library
```bash
npm install spreadsheet-db-w
```


## Easy to use
Things that you have to do to use this library:
- Prepare API key
- Create a spreadsheet
- Create a sheet
- **Add "id" column to your new sheet**
- Initialize authorication class:
```js
const auth = new Authorication({
  private_key: key.private_key,
  client_email: key.client_email
});
```

## Example

```js
import { Authorication, Database, createSchema, number, string, boolean } from "spreadsheet-db-w";
string, boolean } from "./index.js";
import key from "./key.json" with {type: "json"};

const auth = new Authorication({
  private_key: key.private_key,
  client_email: key.client_email
});

// Replace "xxxxxxxxxxxxx" with your spreadsheet id.
// (You can see how to get spreadsheet id below)
const db = new Database("xxxxxxxxxxxxx", auth);

export const booksSchema = createSchema({
  // Keys of this object is ones to access items in source code.
  // Keys of argument must match columns name of your sheet.
  name: string("name"),
  isbn: string("ISBN"),
  price: number("price"),
  bought: boolean("did I buy").optional()
});

export const books = await db.useTable({
  // Replace "0" with your sheet id (The id of the first sheet of spreadsheet is 0).
  // (You can see how to get sheet id below)
  sheetId: 0,
  schema: booksSchema
});

// You don't have to createSchema to create a schema. However the type of variable is suggested if you use it.
export const userSchema = {
  name: string("name"),
  birthday: string("birthday")
};

export const users = await db.useTable({
  // You can use sheet name instead of sheetId
  sheetName: "users",
  schema: userSchema
});



// Get items
const allBooks = await books.getRows();
console.log(allBooks);

// Find item by id
const id1Book = await books.find(1);

// Where
const boughtBooks = await books.where({
  bought: true
});

// Filter items
const inexpensiveBooks = await books.filter((book) => book.price <= 1)
 
// Add a item
const TenBook = await books.appendRow({
  name: "10 Good Ideas to Live Healthy",
  isbn: "00000000",
  price: 0.25,
  bought: true
});

const OneThousandBook = await books.appendRow({
  name: "1000 Good Ideassss to Live Healthy",
  isbn: "00000000",
  price: 30,
  bought: false
});


// Update item by id
await books.updateRow(2, {
  bought: true
});


// Update item by item
OneThousandBook.name = "1000 Good Ideas to Live Healthy";
OneThousandBook.bought = true;
await books.updateRow(OneThousandBook);


// Delete by id
await books.deleteRow(2);

// Delete by item
await books.deleteRow(OneThousandBook);
```

## How to get...
### spreadsheet id
1. Access your spreadsheet to get spreadsheet id
2. Look at the URL
(Your URL is like below:)
```
https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxx/edit
```
3. The spreadsheet id is **"xxxxxxxxxxxxx"** part in the URL shown above. (It is not always "xxxxxxxxxxxxx".)


### sheet id
1. Access your spreadsheet
2. Open your sheet to get sheet id
3. Look at the URL
(Your URL is like below:)
```
https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxx/edit?gid=319982422#gid=319982422
```
4. The sheet id is **"319982422"** in the shown above. (It is not always "319982422".)

(It can be "0" like below URL when the sheet is the firt one in the spreadsheet.)
```
https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxx/edit?gid=0#gid=0
```
