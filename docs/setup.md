# Install and deploy

About 15 minutes. You need a Google account that can create Google Sheets and Apps Script projects. If your organization uses Google Workspace, use a work account so you can limit the app to your domain.

The account that deploys the app becomes the app's identity for reading and writing the sheet. People who use the app do not need access to the sheet itself.

## 1. Prepare the sheet

1. Create a new Google Sheet, or open the one that holds your requirements.
2. If you are starting fresh, import [../sample-data/business-requirements-template.csv](../sample-data/business-requirements-template.csv) (File, Import, Upload).
3. Name the tab exactly **Business Requirements**.
4. Add dropdown lists (Data, Data validation, Dropdown) to these columns. The app reads them, so the lists you set here are the lists people see.

| Column | Suggested values |
|---|---|
| PROCESS AREA | Your L2 process areas |
| PROCESS | Your processes |
| ORDER TYPE | Your order types |
| BRD TYPE | Pain Point, System Efficiency, Operations Enhancement |
| DEMO READY | Yes, No, Maybe |
| DATA LEVEL | Main/Master Data, Transactional Data, Grocery/Lookup Data |
| STATUS | Pending, Reviewed, Duplicated, Obsoleted |
| PRIORITY | High, Medium, Low |

The header can be on any row in the top 40. Columns can be in any order. See [sheet-structure.md](sheet-structure.md).

## 2. Add the code

1. In the sheet, choose Extensions, **Apps Script**.
2. Open Project Settings (the gear icon) and turn on **Show "appsscript.json" manifest file in editor**.
3. Open `appsscript.json` and replace its contents with [../src/appsscript.json](../src/appsscript.json).
4. Open `Code.gs` and replace its contents with [../src/Code.gs](../src/Code.gs).
5. Change the first Owner near the top of `Code.gs`:

```js
OWNERS: ['your.name@example.com'],
```

6. Choose the plus sign, then **HTML**. Name it exactly `Index` (capital I). Apps Script adds `.html`. Paste in [../src/Index.html](../src/Index.html).
7. Press **Save**.

## 3. Run setup once

1. In the toolbar, choose the function **setup** and press **Run**.
2. Approve the permissions. Google shows an "unverified app" notice for your own scripts. Choose Advanced, then Go to project.
3. Setup does the following, and is safe to run again:
   - adds RESPONDER NAME, RESPONDER EMAIL, LOGGED ON, LAST UPDATED and DELETED to the right of your columns
   - creates the **Access**, **Audit Log** and **Process Guide** tabs
   - makes the people in `OWNERS` the first Owners
   - protects the Access and Audit Log tabs
   - turns on the edit trigger that powers live sync and the sheet side of the audit log

## 4. Deploy

1. Choose Deploy, **New deployment**, and the type **Web app**.
2. Set **Execute as** to **Me**.
3. Set **Who has access**:
   - **Anyone within your domain** is the safe default for a company.
   - **Anyone with Google account** lets outside colleagues in, but the app cannot always read their email address. Test before you rely on it.
4. Press **Deploy** and copy the web app link. That link is what you share.

## 5. Check it works

1. Open the link. You are the Owner.
2. Choose **Capture** and save a test requirement.
3. Open the sheet. The new row is at the bottom, with status Pending.
4. Ask a colleague to open the link. They see **Request access**. Approve them in the **Access** tab.
5. Delete the test requirement from the Register, then delete the sample rows from the sheet.

## 6. Update later

After any code change:

1. Paste the new code and press **Save**.
2. Choose Deploy, **Manage deployments**, the pencil icon, **Version: New version**, then **Deploy**.
3. Reload the app with Ctrl+Shift+R.

Skipping step 2 is the most common mistake. The link keeps serving the old version until you publish a new one.

## Process area guide (optional)

Question 3 in Capture can show what each process area covers.

- `setup` creates a **Process Guide** tab with four columns: L1 (end-to-end process), L2 (process area), L3 (process) and L4 (activity). It fills them with sample rows.
- Replace the sample rows with your own. The L2 names must match the names in your PROCESS AREA dropdown.
- To keep it in step with another sheet, clear the tab and put this in cell A1, then choose **Allow access**:

```
=IMPORTRANGE("https://docs.google.com/spreadsheets/d/[source sheet id]","[tab name]!A:D")
```

- Changes show in the app within about five minutes.

## Security notes

- The app runs as the person who deployed it. Anyone with a role can read and write requirements through the app, so keep the Owner list short.
- The roles are enforced on the server. Hiding a tab in the screen is not what protects the data.
- The manifest asks for four permissions: the current spreadsheet only, Apps Script triggers, sending email (for access notices) and reading the signed-in user's email.
- Do not publish your sheet ID, web app link or email addresses in a public repository.
