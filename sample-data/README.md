# Sample data

`business-requirements-template.csv` is a starter for the source sheet. It has the 20 columns you fill in, in the right order, and five invented rows.

1. In Google Sheets choose File, Import, Upload, and pick the CSV. Replace the spreadsheet or insert a new sheet.
2. Name the tab exactly **Business Requirements**.
3. Add dropdown lists (Data, Data validation) to **PROCESS AREA**, **PROCESS**, **ORDER TYPE**, **BRD TYPE**, **DEMO READY**, **DATA LEVEL**, **STATUS** and **PRIORITY**. The app reads these lists and follows them. See [../docs/sheet-structure.md](../docs/sheet-structure.md).
4. Delete the five sample rows when you are ready to start.

The app adds its own five columns (RESPONDER NAME, RESPONDER EMAIL, LOGGED ON, LAST UPDATED and DELETED) the first time you run `setup()`.
