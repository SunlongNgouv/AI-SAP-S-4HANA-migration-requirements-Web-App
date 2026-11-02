# Triage rules

These rules decide how a requirement is rated and labelled. They are examples. Adapt the names to your organization and agree them as a team.

## Priority

| Level | Use when | Example |
|---|---|---|
| **High** | Needed for legal or regulatory compliance, financial control, a customer commitment, safety, go-live or a critical end-to-end process, and no acceptable workaround exists | A tax rule that must be right on every invoice. A billing control. The delivery date promised to a customer |
| **Medium** | Important for efficiency, control, user experience or process quality, but the business can operate for now with a reasonable manual workaround | Automating approvals that people now chase by email. Better exception handling. Operational dashboards |
| **Low** | A helpful enhancement, convenience, optimization, reporting refinement or rare edge case that can wait with little business risk | Cosmetic report changes. An extra filter. A low-volume convenience feature |

**Questions to ask**
1. If this is not done at go-live, is there a legal, financial or customer problem?
2. Is there a workaround that people can live with for a while?
3. How often does it happen, and how many people does it affect?

Yes to 1 and no to 2 means High. A workaround that exists but is slow or risky means Medium. Rare, cosmetic or optional means Low.

**Watch for:** a High list longer than about a quarter of the backlog. Most requirements are Medium.

## Dependencies

Put the areas that must also work, most important first, in the **Order behavior / dependency of rule** column. Separate them with commas.

| Dependency | Practical boundary |
|---|---|
| Product setup | How products are configured, quoted and priced. Engineering and sourcing rules sit downstream |
| Master data | Shared records: customers, materials, suppliers, addresses, quality rules and who looks after them |
| Planning | Forecasting, supply planning, capacity, scenarios and lead times |
| Order to cash | Order entry, stock checks, delivery, invoicing, payments and collections |
| Procure to pay | Suppliers, purchase orders, receiving and paying supplier invoices |
| Delivery and shipping | Moving goods to customers: picking, carriers, tracking and customs |
| Operations | The day-to-day work in warehouses and with partners: inventory, builds and shipments. Not the same as planning |
| Finance | Accounting and financial control: receivables, payables, ledger, cost, assets and reporting |
| Returns | Return approval, receipt, repair, resale or disposal, and the money that follows |

**Example:** "Confirm a delivery date when the order is saved" depends mainly on Order to cash (the order and the stock check), then Planning (lead times). Write `Order to cash, Planning`.

## Data level

| Value | Meaning | Test |
|---|---|---|
| Main/Master Data | Attributes of a shared thing that many processes use | "Is this a record I could look up by name or number, such as a customer, material or address?" |
| Transactional Data | A business event or document | "Does it happen once per order, shipment, return or invoice?" |
| Grocery/Lookup Data | A rule, mapping or list other records look up | "Is it a table of values or rules, such as order types, reason codes or templates?" |

Choose the level the requirement mostly changes. If it truly spans two, choose the one where the work happens.

## Duplicates

Two requirements are duplicates when they describe the same business need, under the same conditions, with the same expected outcome, even if different stakeholders used different words.

| Test | Ask whether both have the same |
|---|---|
| Persona | User or business role |
| Trigger | Event that starts the process |
| Process step | Where in the process it happens |
| Capability | Business function needed |
| Outcome | Result the business expects |
| Acceptance | Conditions for calling it complete |

If most match and there is no meaningful difference in scope, rule, exception, timing or data, treat them as duplicates.

**Not duplicates**
- Same topic, different outcome. "Check stock when an order is placed" and "reassign stock after a delivery is late".
- One contains the other. Treat as parent and child.
- Same need, different system layer. One business need can trace to several technical items.
- Different timing. "Cancel before shipping" and "cancel after shipping" follow different rules.

**What to do**
1. Keep the most complete requirement as the canonical one.
2. Set the other one to **Duplicated** and note `Duplicate of REQ_x (canonical)` in Notes. Do not delete it.
3. Add `Also raised as REQ_y` to the canonical requirement's notes.
4. Keep who raised it, when and where it came from.
5. If they overlap only in part, rewrite both so each has its own outcome.
6. Ask the business owner to confirm before you close or merge anything. Take material disagreements to your project office.

## Routing to teams (example)

Some projects also assign each requirement to the team that will own it. A simple way to decide:

1. Read the persona. A sales assistant points to Sales Operations. A warehouse lead points to Warehouse Operations. A shipping coordinator points to Shipping and Customs.
2. If the persona is unclear, use the process and process area.
3. If another team clearly owns it, such as planning, product setup or master data, say so instead of forcing it into one of your teams.
4. Mark your confidence. Low means it could reasonably sit with more than one team.
