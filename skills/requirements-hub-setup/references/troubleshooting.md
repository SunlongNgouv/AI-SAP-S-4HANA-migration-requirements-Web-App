# Troubleshooting

| What the person sees | Likely cause | Fix |
|---|---|---|
| Page stays on "Loading" or is blank | The HTML file is not named `Index`, or a script error in `Index.html` | Rename the file to `Index`. Open the browser console and read the first red error. Look for `//` inside a string |
| A change to the code does not show | No new deployment version | Deploy, Manage deployments, pencil, New version, Deploy. Reload with Ctrl+Shift+R |
| "The sheet tab ... could not be found" | The tab is not named `Business Requirements` | Rename the tab, or change `REQ_SHEET` |
| Red banner for Owners naming a column | A header was renamed or deleted | Put the header back. See `configuration.md` |
| A dropdown is missing a value | The list changed less than five minutes ago, or the sheet has no dropdown there | Wait, or run `setup` to clear the cache. Add the dropdown to the first data row |
| An approved person still sees "Request access" | Wrong Google account, or the email is spelled differently | Check the Access tab. Ask them to sign in with the listed account |
| "You do not have permission to do this" | The role is too low | Change the role in the Access tab |
| "Someone else is saving at the same moment" | Two saves collided | Try again in a few seconds |
| "Someone changed REQ_x while you were editing" | The row changed after the Edit window opened | The newest version is loaded. Make the change again |
| A sheet edit does not appear in the app | The trigger is missing, or the edit was made through another tool | Run `setup` to reinstall the trigger. Press Refresh |
| No emails about access | The send-mail permission was not approved, or the daily quota is used | Run `setup` and approve all permissions. Check Google's quota |
| Outside colleagues cannot open the link | Access is limited to the domain | Redeploy with "Anyone with Google account". Test with an outside account |
| A deleted requirement is gone for good | The row was deleted in the sheet, not in the app | Restore from version history. Use Delete in the app next time |
| Permissions prompt after a code change | The manifest scopes changed | Run `setup` and approve |

## Collecting information

Ask for:

1. The exact error text, or a screenshot.
2. Which Google account the person is using.
3. Whether it fails for everyone or only them.
4. What changed last (code, sheet or access).
