# Source files

| File | Where it goes in Apps Script |
|---|---|
| `Code.gs` | The default **Code.gs** file |
| `Index.html` | An HTML file named exactly **Index** (capital I). Apps Script adds `.html` |
| `appsscript.json` | The manifest. Turn it on under Project Settings, **Show "appsscript.json" manifest file in editor** |

Before you paste `Code.gs`, change the first Owner in the `CFG` block:

```js
OWNERS: ['your.name@example.com'],
```

Full steps: [../docs/setup.md](../docs/setup.md).

## Rules when you edit the code

Apps Script serves the page through an HTML service that is fussy about a few things:

- Do not put `//` or `/* */` inside strings or regular expressions in `Index.html`.
- Do not use the spread operator inside the `STEPS` list.
- After any change, create a **New version** under Deploy, Manage deployments, then reload with Ctrl+Shift+R.
