# Configuration

All settings are at the top of `Code.gs`.

## `CFG`

| Setting | Default | Meaning |
|---|---|---|
| `APP_NAME` | Requirement Hub | Browser title and the name used in emails |
| `REQ_SHEET` | Business Requirements | The tab that holds requirements. Must match exactly |
| `ACCESS_SHEET` | Access | Tab for roles and requests |
| `LOG_SHEET` | Audit Log | Tab for the audit log |
| `GUIDE_SHEET` | Process Guide | Tab for process area hints |
| `OWNERS` | `['your.name@example.com']` | First Owners. More are added in the app |
| `POLL_MS` | 7000 | How often screens check for changes, in milliseconds |

## Fixed values in the code

| Value | Meaning |
|---|---|
| Lock timeout | 25 seconds. Longer than that and the person sees a "please try again" message |
| List and guide cache | 5 minutes |
| Header row search | The top 40 rows of the sheet |

## Header names the app looks for

A header matches when its letters and digits (ignoring case and punctuation) equal the name below. Some match on their first words.

| Field | Header | Also accepted |
|---|---|---|
| Reference | REQ # | |
| Area | L2- PROCESS AREA | |
| Process | PROCESS | |
| Name | REQUIREMENT NAME | |
| Order type | ORDER TYPE | |
| Type | BRD TYPE | |
| Description | DESCRIPTION | SIGNIFICANCE / DESCRIPTION |
| As is | AS IS PROCESS | |
| Change request | CHANGE REQUEST | |
| Dependencies | ORDER BEHAVIOR | Any header that starts with it |
| Demo ready | DEMO READY | |
| Data level | DATA LEVEL | |
| Source | BRD SOURCE | |
| Documents | DATA SOURCE/USE CASE(S) | |
| Status | STATUS | |
| Lucid chart | Lucid Chart | |
| Priority | PRIORITY | |
| Follow-up | Follow-up Question | Any header that starts with it |
| Answers | ANSWERS | Any header that starts with it |
| Notes | NOTES/COMMENTS | |
| System | RESPONDER NAME, RESPONDER EMAIL, LOGGED ON, LAST UPDATED, DELETED | Added by `setup()` |

If one is missing, Owners see a banner naming it, and the app writes nothing until it is fixed.

## Dropdown lists

`LISTS` in `Code.gs` holds sample values for areas, processes, order types, type, status, demo and priority. They are used only when the sheet's dropdown cannot be read. In normal use, change the sheet and leave the code alone.

## Manifest

`appsscript.json` sets the runtime (V8), the web app to run as the deploying user, and access to the domain. Permissions: the current spreadsheet only, Apps Script triggers, sending email, and the signed-in user's email. If you change scopes, run `setup` again to re-approve.
