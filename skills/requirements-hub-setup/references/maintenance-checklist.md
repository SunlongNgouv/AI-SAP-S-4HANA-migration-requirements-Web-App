# Maintenance checklist

## Weekly (10 minutes, an Owner)

- [ ] Approve or decline access requests.
- [ ] Scan the Audit Log for surprises, such as many deletes or unknown users.
- [ ] Check for Pending requirements nobody has reviewed in a week.
- [ ] Look at deleted requirements. Restore any that were removed by mistake.

## Monthly

- [ ] Review the Owner and Editor list. Remove people who have moved on.
- [ ] Check the dropdown lists still match how the team talks.
- [ ] Open the Register and confirm the number tiles match the sheet.
- [ ] Make a copy of the sheet (File, Make a copy) as a backup.

## Each quarter

- [ ] Re-read the Process Guide tab. Update it if processes changed.
- [ ] Check Apps Script's Triggers page for the `onSheetEdit` trigger.
- [ ] Confirm the deploying account still has edit access to the sheet.
- [ ] Review the manifest permissions. Remove any you no longer need.

## When the deploying person leaves

The app runs as the person who deployed it. If that account is closed, the app stops.

1. Before they leave, add a second Owner.
2. Make a new deployment from the new Owner's account (they need edit access to the sheet and the script).
3. Share the new link.
4. Retire the old deployment.

## Before a big change

- [ ] Copy the sheet.
- [ ] Tell users when it will happen.
- [ ] Deploy a new version, test as an Owner and as an Editor, then announce.
