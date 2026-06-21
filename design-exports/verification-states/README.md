# Customer Verification States — HTML Export

Standalone, framework-free HTML export of the customer **verification gate**
that the theme shows on gated pages, provided so the states can be redesigned
in a plain browser without running Shopify/Liquid.

Open **[`index.html`](./index.html)** for a tabbed gallery of every state, or
open any individual file directly.

## What this maps to in the theme

The gate is rendered by `snippets/customer-gate-status.liquid`, driven by the
customer metafield `customer.metafields.customer.status`:

| Metafield status        | State                     | Background | File |
|-------------------------|---------------------------|------------|------|
| _not logged in_         | Account Required          | light      | [`account-required.html`](./account-required.html) |
| `Pending` _or blank_    | Verification In Progress  | light      | [`verification-pending.html`](./verification-pending.html) |
| `Declined`              | Access Denied             | dark       | [`access-denied.html`](./access-denied.html) |
| `Expired`               | Access Expired            | dark       | [`access-expired.html`](./access-expired.html) |
| `Approved`              | _(page renders normally)_ | —          | [`approved.html`](./approved.html) |

> `Declined` and `Expired` share the same dark `customer-gate--denied` variant
> and differ only in heading + copy.

## Files

```
design-exports/verification-states/
├── index.html                  Tabbed gallery / review surface (loads the files in an iframe)
├── styles.css                  Shared styles — the redesign target
├── account-required.html       Not logged in
├── verification-pending.html   Pending / awaiting review
├── access-denied.html          Declined
├── access-expired.html         Prescription expired
├── approved.html               Pass-through placeholder (no gate in production)
└── README.md
```

Each state file is self-contained except for two shared, same-folder links:
the Google Fonts stylesheet and `styles.css`. Edit `styles.css` once and the
change shows across every state and in the gallery.

## Notes for redesign

- **Tokens are resolved but named.** `styles.css` defines the theme's active
  design tokens (`--g-main`, `--g-main-2`, fonts, button vars, …) in `:root`
  with their real values, keeping the original `--g-*` names so changes port
  back cleanly. See `.ai/design.md` for the full token reference.
- **Fonts.** Production uses Futura (headings) / Poppins (body). Futura isn't
  freely hostable, so the preview loads **Jost** (a close geometric substitute)
  for headings and **Poppins** for body via Google Fonts.
- **Buttons.** `.btn-theme` / `.btn-outline` (incl. the sliding `::before`
  hover fill) are mirrored from `assets/theme.css`. Hover a button to see it.
- **Full-bleed.** These exports use `min-height: 100vh` so each state fills the
  window. In the live theme the gate sits inside the page chrome at `65vh`.

## Porting changes back

1. Markup → `snippets/customer-gate-status.liquid` (match the right
   `customer-gate--*` block).
2. Styles → `assets/customer-gate-status.css` (and `assets/theme.css` for
   button changes). Use the `var(--g-*)` token names, not the hard-coded
   hex values, so the theme settings keep driving them.
