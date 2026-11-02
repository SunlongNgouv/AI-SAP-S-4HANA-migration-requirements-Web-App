---
name: requirements-hub-setup
description: Set up, deploy, update and maintain the Requirement Hub, a Google Apps Script web app that runs on a Google Sheet. Use when someone asks to install the Hub, deploy or release a new version, change dropdown lists, add or remove people, restore a deleted requirement, fix a deployment or sync problem, or check that the sheet and app are healthy.
---

# Requirements Hub: set up, deploy and maintain

The Hub is a Google Apps Script web app bound to one Google Sheet. The sheet holds the requirements. The script serves the screens and enforces roles. You cannot see or change the person's Google account, so you guide them step by step and ask them to confirm each result.

## Before you begin

Ask for these. Do not guess them, and never ask the person to paste secrets.

| Need | Why |
|---|---|
| Email of the first Owner | Goes in `OWNERS` in `Code.gs` |
| Whether people are all on one company domain | Chooses "Anyone within your domain" or "Anyone with Google account" |
| Whether they have a sheet already, or are starting fresh | Starts from the sample template or from their sheet |
| What the dropdown lists should contain | The app follows the sheet's dropdowns |

The source files are in `src/`: `Code.gs`, `Index.html` and `appsscript.json`. Full human steps are in `docs/setup.md`.

## Workflow 1: first-time install

1. **Sheet.** The tab must be named exactly `Business Requirements`. For a new sheet, import `sample-data/business-requirements-template.csv`.
2. **Dropdowns.** Add data validation lists to the first data row of PROCESS AREA, PROCESS, ORDER TYPE, BRD TYPE, DEMO READY, STATUS and PRIORITY. Add one to DATA LEVEL as well. Check: click a cell and see a list arrow.
3. **Open Apps Script** from Extensions. Turn on the manifest under Project Settings.
4. **Paste three files.** `appsscript.json` into the manifest, `Code.gs` into Code.gs, and `Index.html` into an HTML file named exactly `Index`.
5. **Set the Owner.** Replace `your.name@example.com` in the `CFG` block.
6. **Run `setup`** once and approve permissions. Check: the sheet now has RESPONDER NAME to DELETED on the right, and new tabs Access, Audit Log and Process Guide.
7. **Deploy** as a web app: Execute as **Me**, access as agreed. Copy the link.
8. **Test.** Open the link, capture one requirement, find the new row in the sheet, then delete both the test row and the sample rows.

Stop after each numbered step and wait for the person to confirm before the next one.

## Workflow 2: release an update

1. Paste the changed file and save.
2. Deploy, Manage deployments, pencil icon, **Version: New version**, Deploy.
3. Reload with Ctrl+Shift+R.

If the change does not show, the missing New version step is almost always the cause. Ask the person to confirm they published one.

## Workflow 3: routine maintenance

| Task | How |
|---|---|
| Add someone | Access tab, Add a person. Owners only |
| Approve a request | Access tab, approval queue |
| Change or remove a role | Access tab. There must always be one Owner |
| Change a dropdown list | Edit the sheet's data validation on the first data row. The app follows within five minutes |
| Restore a deleted requirement | Register, tick Show deleted (Owners), then Restore |
| Fix the process guide text | Edit the Process Guide tab. Headers must start with L1, L2, L3, L4 |
| Add a column | Safe. Add it anywhere. The app ignores columns it does not know |
| Rename a column | Not safe for the headers the app uses. See `references/configuration.md` |

For a longer list, use `references/maintenance-checklist.md`.

## Workflow 4: health check

Ask the person to confirm each:

- The Register loads and shows "Synced" within ten seconds.
- A test edit in the sheet appears in the Register without reloading.
- The Access and Audit Log tabs exist and are protected.
- Owners see no red banner about missing columns.
- Triggers page in Apps Script lists `onSheetEdit`.

## Guardrails

- Never rename or delete the sheet's header cells. The app finds columns by name.
- The HTML file must be named exactly `Index`.
- In `Index.html`, do not put `//` or `/* */` inside strings or regular expressions, and do not use the spread operator inside `STEPS`. Apps Script's page service breaks on them.
- Do not commit a real sheet ID, web app link or email address to a public repository.
- Ask before telling the person to delete data or change who has access.
- If an error message appears, ask for the exact text. Most are written in plain language and name the cause.

## References

- `references/configuration.md`: the settings in `Code.gs`, header names and defaults
- `references/troubleshooting.md`: symptom, cause and fix
- `references/maintenance-checklist.md`: what to do weekly, monthly and each quarter
