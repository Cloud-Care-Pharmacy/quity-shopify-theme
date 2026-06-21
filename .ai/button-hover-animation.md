# Button Hover Animation — "Slide-Up Fill" (portable spec)

> Self-contained reference for the primary button hover effect used in the Quity
> Shopify theme (`.btn-theme`). Use this to reproduce the exact animation on other
> properties (e.g. **brand.quity.com.au**) that do **not** share this theme's CSS.
>
> **Source of truth:** `assets/theme.css` (lines ~2076–2295, the `.btn-theme`
> rules) + the CSS custom properties in `snippets/header-css.liquid`.

---

## 1. What it does

On hover, a coloured panel slides up diagonally from below the button and fills it,
while the label flips to white and the border switches to the accent colour.

- **Pure CSS — no JavaScript.** The effect is a single `::before` pseudo-element
  that is transformed on `:hover` / `:focus` / `:active`.
- The panel starts tilted `4deg` and pushed fully below the button, then untilts
  and slides into place to cover it.
- It is clipped to the button's rounded shape via `overflow: hidden` on the button.

### How the mechanics work

| Piece | Role |
|---|---|
| Button: `position: relative; z-index: 1; overflow: hidden` | Anchors and clips the fill; keeps the label above it |
| `::before`: `position: absolute; z-index: -1` | The coloured fill panel, sitting **behind** the label |
| `::before` size `120% × 110%` | Oversized so the rotated rectangle still covers the corners |
| `::before` start transform `rotate3d(0,0,1,4deg) translate3d(-1em,108%,0)` | Tilts 4° and parks the panel just below the button (hidden) |
| `transform-origin: 0% 100%` | Pivots from the bottom-left so the tilt reads naturally |
| Hover transform `rotate3d(0,0,1,0) translateZ(0)` | Flattens + slides the panel up to fill the button |
| `transition: transform 0.2s cubic-bezier(.17,.67,.83,.67)` | The slide easing (fast-out feel) |
| Button `transition: 0.4s` | Eases the label colour + border change |

---

## 2. Drop-in CSS (concrete values — works anywhere)

These are the **active brand values** baked in, so this snippet works without any
CSS variables present. Apply the class to any `<a>` or `<button>`.

```css
/* ============================================================
   Quity — Button Hover "Slide-Up Fill"  (pure CSS, no JS)
   ============================================================ */

.btn-fill {
  position: relative;          /* anchor for the ::before fill   */
  z-index: 1;                  /* keep the label above the fill  */
  overflow: hidden;            /* clip the fill to the button     */
  display: inline-block;
  vertical-align: middle;

  padding: 17px 34px;          /* vertical / horizontal padding   */
  border: 1px solid #000000;   /* button text/border colour       */
  border-radius: 40px;         /* pill shape                      */
  background-color: transparent;

  color: #000000;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 1;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  -webkit-user-select: none;
          user-select: none;
  transition: 0.4s;            /* label colour / border ease      */
}

/* The coloured fill, parked below the button */
.btn-fill::before {
  content: "";
  display: block;
  position: absolute;
  z-index: -1;
  top: 0; right: 0; bottom: 0; left: 0;
  width: 120%;
  height: 110%;
  background: #e35353;         /* accent / secondary colour       */
  transform: rotate3d(0, 0, 1, 4deg) translate3d(-1em, 108%, 0);
  transform-origin: 0% 100%;
  will-change: transform;
  transition: transform 0.2s cubic-bezier(.17, .67, .83, .67);
}

/* Hover / focus / active — slide the fill up to cover the button */
.btn-fill:hover,
.btn-fill:focus,
.btn-fill:active {
  color: #ffffff;
  border-color: #e35353;
}
.btn-fill:hover::before,
.btn-fill:focus::before,
.btn-fill:active::before {
  transform: rotate3d(0, 0, 1, 0) translateZ(0);
}

/* Disabled — no fill */
.btn-fill[disabled],
.btn-fill.disabled {
  cursor: default;
  color: #757575;
  background-color: #d5d5d5;
  border-color: #d5d5d5;
}
.btn-fill[disabled]::before,
.btn-fill.disabled::before {
  display: none;
}

/* Respect users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn-fill,
  .btn-fill::before {
    transition: none;
  }
}
```

```html
<a href="/shop" class="btn-fill">Shop Now</a>
<button class="btn-fill">Add to Cart</button>
```

---

## 3. Themeable version (CSS variables)

Identical effect, but driven by custom properties so you can re-skin it per brand.
The defaults below match the live Quity site.

```css
:root {
  --btn-bg:        transparent;   /* button background            */
  --btn-text:      #000000;       /* label + border colour        */
  --btn-fill:      #e35353;       /* hover fill / accent colour    */
  --btn-text-hover:#ffffff;       /* label colour on hover         */
  --btn-pad-y:     17px;
  --btn-pad-x:     34px;
  --btn-radius:    40px;
  --btn-size:      12px;
  --btn-weight:    600;
  --btn-spacing:   0.1em;
  --btn-transform: uppercase;
}

.btn-fill {
  position: relative; z-index: 1; overflow: hidden;
  display: inline-block; vertical-align: middle;
  padding: var(--btn-pad-y) var(--btn-pad-x);
  border: 1px solid var(--btn-text);
  border-radius: var(--btn-radius);
  background-color: var(--btn-bg);
  color: var(--btn-text);
  font-size: var(--btn-size);
  font-weight: var(--btn-weight);
  letter-spacing: var(--btn-spacing);
  text-transform: var(--btn-transform);
  line-height: 1; text-align: center; text-decoration: none;
  white-space: nowrap; cursor: pointer; appearance: none;
  -webkit-user-select: none; user-select: none;
  transition: 0.4s;
}
.btn-fill::before {
  content: ""; display: block; position: absolute; z-index: -1;
  top: 0; right: 0; bottom: 0; left: 0; width: 120%; height: 110%;
  background: var(--btn-fill);
  transform: rotate3d(0,0,1,4deg) translate3d(-1em,108%,0);
  transform-origin: 0% 100%; will-change: transform;
  transition: transform 0.2s cubic-bezier(.17,.67,.83,.67);
}
.btn-fill:hover, .btn-fill:focus, .btn-fill:active {
  color: var(--btn-text-hover); border-color: var(--btn-fill);
}
.btn-fill:hover::before, .btn-fill:focus::before, .btn-fill:active::before {
  transform: rotate3d(0,0,1,0) translateZ(0);
}
```

---

## 4. Exact source values (live Quity site)

These map the portable values above back to the theme variables and settings.

| Property | Theme variable | Setting ID | Live value |
|---|---|---|---|
| Hover fill colour | `--g-main-2` | `color_secondary` | `#e35353` |
| Button background | `--g-cta-button` | `color_cta` | `rgba(0,0,0,0)` (transparent) |
| Text + border colour | `--g-cta-text` | `color_button_text` | `#000000` |
| Vertical padding | `--g-padding-ver-btn` | `padding_vertical_btn` | `17px` |
| Horizontal padding | `--g-padding-hoz-btn` | `padding_hoz_btn` | `34px` |
| Border radius | `--g-font-radius-btn` | `border_radius_btn` | `40px` |
| Font size | `--g-font-size-btn` | `base_size_button` | `12px` |
| Font weight | `--g-font-weight-btn` | `font_weight_button` | `600` |
| Letter spacing | `--g-font-spacing-btn` | `letter_spacing_button` | `0.1em` |
| Text transform | `--g-text-transform-btn` | `text_transform_btn` | `uppercase` |
| Border width | `--g-height-border-btnline` | `height_border_btn` | `1px` |

> In the theme, the effect can be turned off via the `enable_button_hover` setting,
> which simply sets `display: none` on the `::before` (see `snippets/header-css.liquid`).

---

## 5. Tunable parameters (what to change for a different feel)

| Want to change… | Edit |
|---|---|
| Slide speed | `transition: transform 0.2s …` on `::before` (raise/lower the `0.2s`) |
| Slide easing | the `cubic-bezier(.17,.67,.83,.67)` value |
| Tilt amount | the `4deg` in the start transform (use `0deg` for a straight vertical wipe) |
| Slide direction | the `translate3d(-1em, 108%, 0)` — positive Y = from below, negative Y = from above |
| Fill colour | `--btn-fill` / `#e35353` |
| Label colour on hover | `--btn-text-hover` / `#ffffff` |
| Pill vs square | `--btn-radius` / `border-radius` |

---

## 6. Notes / gotchas when porting

- The button **must** keep `position: relative`, `overflow: hidden`, and a stacking
  context where the label sits above the fill (`z-index: 1` on the button,
  `z-index: -1` on `::before`). Drop any of these and the fill won't clip or will
  cover the text.
- `overflow: hidden` means **no child can visually escape the button** (e.g. tooltips
  or dropdowns anchored inside the button will be clipped).
- The fill is intentionally oversized (`120% × 110%`) so the rotated rectangle covers
  the corners — don't shrink it to `100%` or corners will show through during the slide.
- This is `:hover`-driven, so on touch devices the fill appears on tap/focus rather
  than true hover; the included `:focus`/`:active` rules keep it usable there.
