# Quity Shopify Theme — Design System Reference

> This document describes the design system, patterns, and conventions used in this Shopify theme so that AI assistants and developers can produce code that stays visually and structurally consistent.

---

## 1. Theme Overview

- **Theme name:** Modern BD (by Bright Data)
- **Platform:** Shopify (Liquid templating)
- **CSS framework:** Bootstrap 4.x (included inline in `snippets/header-css.liquid`) + custom semantic grid in `assets/theme.css`
- **JS libraries:** Swiper 6.7.0, lazysizes, ion.rangeSlider, PhotoSwipe, Ajaxinate
- **Primary font:** Plus Jakarta Sans (Google Fonts, hardcoded in `layout/theme.liquid`), with Shopify fonts Futura (`futura_n4`) and Poppins (`poppins_n4`) as configured defaults
- **Template format:** JSON templates (`.json` files in `templates/`)
---

## 2. Color System

All colors are set via **Shopify theme settings** (`config/settings_schema.json`) and exposed as **CSS custom properties** defined in `snippets/header-css.liquid`.

### 2.1 Core Color Variables

| CSS Variable | Setting ID | Schema Default | Active Value |
|---|---|---|---|
| `--g-main` | `color_primary` | `#ad2c34` | `#222222` |
| `--g-main-2` | `color_secondary` | `#348a5c` | `#e35353` |
| `--g-color-heading` | `color_body_headings` | `#1a1a1a` | `#222222` |
| `--g-font-color-subtop` | `color_sub` | `#030303` | `#e35353` |
| `--color-body-text` | `color_body_text` | `#666` | `#414141` |
| `--color-body` | `color_body_bg` | `#fff` | `#ffffff` |
| `--color-content` | `color_content_bg` | `#fff` | `#ffffff` |
| `--g-cta-button` | `color_cta` | `#000000` | `rgba(0,0,0,0)` (transparent) |
| `--g-cta-text` | `color_button_text` | `#fff` | `#000000` |
| `--color-accent` | Same as `color_primary` | — | `#222222` |

### 2.2 Alert & Message Colors

| Variable | Active Value |
|---|---|
| `--g-alert` | `#000000` |
| `--g-alert-bg` | `#d5f9da` |
| `--g-alert-bd` | `#c3f7ca` |

### 2.3 Shipping Bar Colors

| Setting | Active Value |
|---|---|
| `shipping_bar` (background) | `#e9e9e9` |
| `shipping_active` (progress fill) | `#343a40` |

### 2.4 Text Opacity Helpers

```css
.txt-body     { color: var(--color-body-text); }
.txt-body-50  { color: rgba(var(--color-body-text-rgb), 0.5); }
.txt-body-60  { color: rgba(var(--color-body-text-rgb), 0.6); }
.txt-body-70  { color: rgba(var(--color-body-text-rgb), 0.7); }
.txt-body-80  { color: rgba(var(--color-body-text-rgb), 0.8); }
.txt-heading  { color: rgba(var(--g-color-heading-rgb), 1) !important; }
.bg-gray-01   { background-color: rgba(var(--color-body-text-rgb), 0.05); }
```

### 2.5 Product Label Colors

| Label | Background | Text Color |
|---|---|---|
| Sale | `#84c8bb` | `#ffffff` |
| Hot (tag1) | `#ef374f` | `#ffffff` |
| New (tag2) | `#ff6e81` | `#ffffff` |
| Best Seller (tag3) | `#ffffff` | `#dfa069` |
| Sold Out | `#ffffff` | `#d1512d` |

---

## 3. Typography

### 3.1 Font Families

Two font stacks are used, exposed as CSS variables:

| Variable | Role | Active Config |
|---|---|---|
| `--g-font-1` | Headings / primary | Futura (Shopify `futura_n4`) |
| `--g-font-2` | Body / secondary | Poppins (Shopify `poppins_n4`) |
| `--g-font-3` | Decorative | `Restora-Light` |
| `--g-font-4` | Script | `PadukaScriptfreeversion` |

The `font_family_custom` setting controls whether a custom font ("Butler") or the Shopify font picker fonts are used. Google Fonts can be specified via `font_family_google` / `font_family2_google`.

Plus Jakarta Sans is also hardcoded in `layout/theme.liquid` via Google Fonts import.

### 3.2 Base Typography

| Property | Variable | Active Value |
|---|---|---|
| Base font size | `--g-font-size` | `15px` |
| Body font weight | `--g-font-weight-body` | `400` |
| Body line height | `--g-body-lineheight` | `1.6` |

### 3.3 Heading Scale

All headings use `--g-font-1` and are configurable via theme settings:

| Heading | Size Variable | Active Size | Weight | Line Height | Transform |
|---|---|---|---|---|---|
| Slideshow | `--g-slide-font-size` | `50px` | `400` | `1.2` | `capitalize` |
| H1 | `--g-h1-font-size` | `46px` | `400` | `1.4` | `none` |
| H2 | `--g-h2-font-size` | `38px` | `400` | `1.4` | `capitalize` |
| H3 | `--g-h3-font-size` | `30px` | `400` | `1.4` | `none` |
| H4 | `--g-h4-font-size` | `24px` | `400` | `1.4` | `capitalize` |
| H5 | `--g-h5-font-size` | `20px` | `400` | `1.4` | `none` |
| H6 | `--g-h6-font-size` | `18px` | `500` | `1.4` | `none` |

### 3.4 Subtop / Subtitle Text

```css
--g-font-color-subtop: #e35353;
--g-font-size-subtop: 12px;
--g-font-weight-subtop: 600;
--g-font-spacing-subtop: 0.2em;
```

Used with `.subtop` / `.text-top` classes.

### 3.5 Product Title Typography

Product card titles use dedicated variables:

```css
--g-p-font_family: var(--g-font-1);
--g-p-font-size: 20px;
--g-p-font-weight: 500;
--g-p-font-transform: capitalize;
--g-p-font-lineheight: 1.2;
```

Applied to `.product-card__name` in `snippets/header-css.liquid`.

### 3.6 Font Family CSS Classes

- `.font-family-1` or inherited from body → `var(--g-font-1)` (Futura)
- `.font-family-2` → `var(--g-font-2)` (Poppins)

---

## 4. Layout & Grid

### 4.1 Container

```css
--g-container: 1440px;   /* configurable 1200–1920px */
--g-gutter: 30px;        /* configurable 10–40px */
--g-hgutter: 15px;       /* half gutter, auto-calculated */
```

The `.container` class max-width is overridden at the configured breakpoint in `snippets/header-css.liquid`.

### 4.2 Grid Systems

**Two grid systems coexist:**

1. **Bootstrap 4 grid** (`.row`, `.col-*`, `.col-sm-*`, `.col-md-*`, `.col-lg-*`, `.col-xl-*`)
   Breakpoints: `576px`, `768px`, `992px`, `1200px`

2. **Custom semantic grid** (`.grid` → `.grid__item` with word-based widths)
   Uses `float: left` + `flex-basis`. Classes: `.one-half`, `.one-third`, `.one-quarter`, etc.
   Responsive prefixes: `small--` (≤749px), `medium--` (750–989px), `large--` (≥990px)

**Prefer the Bootstrap grid for new code.** The custom grid is legacy.

### 4.3 Responsive Breakpoints

**Bootstrap 4 breakpoints** (used by `.col-*`, `.d-*`, `.m-*`, `.p-*` responsive classes):

| Prefix | Min-width |
|---|---|
| `sm` | 576px |
| `md` | 768px |
| `lg` | 992px |
| `xl` | 1200px |

**Custom grid breakpoints** (used by `small--`, `medium--`, `large--` prefix classes):

| Prefix | Range |
|---|---|
| `small--` | ≤749px |
| `medium--` | 750–989px |
| `large--` | ≥990px |
| `xlarge--` | ≥1200px |

> **Note:** The two grid systems use different breakpoint values. Bootstrap `lg` starts at 992px, while the custom grid `large--` starts at 990px.

### 4.4 Flex Utilities

Both Bootstrap 4 flex utilities and custom helpers are available:

```css
.flex         { display: flex; width: 100%; }
.flex__item   { flex: 1 1 100%; }
.flex__item--fixed { flex: 0 1 auto; }
.gap-1 { gap: .25rem; }
.gap-2 { gap: .5rem; }
.gap-3 { gap: 1rem; }
.gap-4 { gap: 1.5rem; }
.gap-5 { gap: 3rem; }
```

### 4.5 Spacing

Use Bootstrap 4 spacing utilities: `.m-{0-5}`, `.p-{0-5}`, `.mt-*`, `.mb-*`, etc.
Scale: `0` = `0`, `1` = `.25rem`, `2` = `.5rem`, `3` = `1rem`, `4` = `1.5rem`, `5` = `3rem`.

---

## 5. Buttons

### 5.1 Primary Button — `.btn-theme`

The main CTA button. Uses all button CSS variables:

```css
.btn-theme {
  padding: var(--g-padding-ver-btn) var(--g-padding-hoz-btn);   /* 17px 34px */
  background-color: var(--g-cta-button);                        /* transparent */
  color: var(--g-cta-text);                                     /* #000000 */
  border: 1px solid var(--g-cta-text);
  font-family: var(--g-font-family_btn);
  font-size: var(--g-font-size-btn);                            /* 12px */
  font-weight: var(--g-font-weight-btn);                        /* 600 */
  text-transform: var(--g-text-transform-btn);                  /* uppercase */
  letter-spacing: var(--g-font-spacing-btn);                    /* 0.1em */
  border-radius: var(--g-font-radius-btn);                      /* 40px */
  overflow: hidden;
  position: relative;
}
```

**Hover effect:** An animated `::before` pseudo-element slides up from the bottom. The `::before` has `background: var(--g-main-2)` (secondary color, `#e35353`). On hover, it transforms to cover the button. Text turns `#fff` and border changes to `var(--g-main-2)`.

```css
.btn-theme:before {
  background: var(--g-main-2);
  transform: rotate3d(0,0,1,4deg) translate3d(-1em,108%,0);  /* hidden below */
  transition: transform 0.2s cubic-bezier(.17,.67,.83,.67);
}
.btn-theme:hover:before {
  transform: rotate3d(0,0,1,0) translateZ(0);  /* slides up to cover */
}
```

This effect can be disabled via the `enable_button_hover` theme setting.

### 5.2 Outline Button — `.btn-outline`

Same variable-driven styling as `.btn-theme` but with `background-color: transparent`. Uses the same `::before` hover animation. Slightly less vertical padding: `calc(var(--g-padding-ver-btn) - 4px)`.

### 5.3 White Button — `.btn-theme.btn-white`

White background variant for use on dark banners/images. Hover changes text color to `var(--g-main)`.

### 5.4 Small Button — `.btn-sm`

```css
.btn-sm { padding: 0.7rem 1rem !important; }
```

### 5.5 Button Variables Summary

| Variable | Active Value |
|---|---|
| `--g-text-transform-btn` | `uppercase` |
| `--g-font-weight-btn` | `600` |
| `--g-font-size-btn` | `12px` |
| `--g-font-spacing-btn` | `0.1em` |
| `--g-font-radius-btn` | `40px` |
| `--g-padding-ver-btn` | `17px` |
| `--g-padding-hoz-btn` | `34px` |
| `--g-height-border-btnline` | `1px` |

### 5.6 Usage Examples

```liquid
<a href="/collections/all" class="btn btn-theme">Shop Now</a>
<a href="/collections/all" class="btn btn-outline">Learn More</a>
<button class="btn btn-theme btn-white">White CTA</button>
<button class="btn btn-theme btn-sm">Small Button</button>
```

---

## 6. Form Inputs

```css
--g-input-height: 50px;
--g-input-radius: 5px;
--g-input-bg: (setting);
--g-input-border: (setting);
```

Bootstrap 4 `.form-control` is the base class. Form groups use `.form-group`.

Additional form styling variables:
```css
--color-form: #f4f4f4;
--color-form-text: #333;
--color-error: #ec523e;
--color-error-bg: #ec523e;
```

---

## 7. Components

### 7.1 Product Card

The product card is the most complex component. Rendered by `snippets/product-card.liquid` with **10 style variants** controlled by the `productgrid` setting.

**Current setting:** `product-5`

#### Card Structure

```html
<div class="product-card js-product-card product-card--style{N}" data-price="{{ product.price }}">
  <div class="product-card__image-wr">
    <a class="product-card__image js image-content__image-wrapper {size_class}"
       href="{{ product.url }}"
       style="padding-top: {{ aspect_ratio }}%;">
      <img class="lazyload scale-in first-image"
           data-src="{{ img_url }}"
           data-sizes="auto"
           data-widths="[180, 360, 540, 720]">
      <!-- optional second image on hover via snippets/second-image.liquid -->
    </a>
    <!-- product labels: snippets/product-label.liquid -->
    <div class="product-card__overlay d-flex justify-content-center flex-column">
      <!-- overlay action buttons: wishlist, quickview, compare, add-to-cart -->
    </div>
  </div>
  <div class="product-card__info">
    <a class="product-card__type">{{ vendor }}</a>
    <a class="product-card__name" href="{{ product.url }}">{{ title }}</a>
    <div class="product-card__price">{{ price }}</div>
    <!-- optional: reviews badge, color swatches, countdown -->
  </div>
</div>
```

#### Key CSS Classes

| Class | Purpose |
|---|---|
| `.product-card` | Root container |
| `.product-card--style{1-10}` | Style variant modifier |
| `.product-card__image-wr` | Image wrapper |
| `.product-card__image` | Image link (aspect-ratio container) |
| `.product-card__overlay` | Hover overlay with action buttons |
| `.product-card__overlay-btn` | Individual action button in overlay |
| `.product-card__info` | Text content area (title, price, etc.) |
| `.product-card__name` | Product title (styled via `--g-p-*` vars) |
| `.product-card__price` | Price display |
| `.product-card__pricesale` | Sale price modifier |
| `.product-card__type` | Vendor label |
| `.product-label` | Label container (sale, new badges) |
| `.product-tag--absolute` | Absolute-positioned label |
| `.product-card-cart` | Add-to-cart area (some variants) |

#### Style Variants

| Setting Value | Class | Notes |
|---|---|---|
| `product-1` | `.product-card--style1` | Overlay buttons on hover, vertical stack |
| `product-2` | `.product-card--style2` | Alternate overlay layout |
| `product-3` | `.product-card--style3` | Minimal with bottom actions |
| `product-4` | `.product-card--style4` | Actions below image |
| `product-5` | `.product-card--style5` | **Currently active** |
| `product-6` | `.product-card--style6` | Split layout |
| `product-7` | `.product-card--style7` | Full-width card |
| `product-8` | `.product-card--style8` | Compact grid-friendly |
| `product-9` | `.product-card--style9` | With inline cart button |
| `product-10` | `.product-card--style10` | Extended info |

#### Overlay Button Pattern

```liquid
<span class="btn btn-theme gradient-theme-vertical product-card__overlay-btn js-btn-wishlist"
      data-handle="{{ product.handle }}"
      title="{{ 'products.product.wishlist_text' | t }}">
  {%- render 'icon-heart-2' -%}
</span>
```

#### Image Loading Pattern

All product images use **lazysizes**:
```html
<img class="lazyload scale-in first-image"
     data-src="{{ img_url }}"
     src="{{ image | image_url: width: 1, height: 1 }}"
     data-sizes="auto"
     data-widths="[180, 360, 540, 720]"
     loading="lazy"
     width="{{ image.width }}"
     height="{{ image.height }}"
     alt="{{ image.alt | escape }}">
```

### 7.2 Section Heading

Rendered by `snippets/section-heading.liquid`. Two styles controlled by the `sectionheading` setting.

#### heading-1 (currently active)

Full-featured heading with optional countdown, image, subtitle, title, description, and CTA. Supports AOS animations.

```html
<div class="section-header text-{{ alignment }}">
  <div class="subtop text-top mb-3" data-aos="{{ animation }}" data-aos-duration="300">
    {{ subtitle }}
  </div>
  <h3 class="section-title-1 mb-2" data-aos="{{ animation }}" data-aos-duration="500">
    <span>{{ title }}</span>
  </h3>
  <div class="font-family-2 des-header txt-body-70 mb-4" data-aos="{{ animation }}" data-aos-duration="800">
    {{ description }}
  </div>
  <div class="button-header mb-5">
    <a href="{{ link }}" class="btn btn-theme">{{ button_text }}</a>
  </div>
</div>
```

#### heading-2

Simpler centered heading without AOS:

```html
<div class="subtop text-center text-top">{{ subtitle }}</div>
<h3 class="section-title-2 mb-2"><span>{{ title }}</span></h3>
<p class="font-family-2 mb-5 txt-body-70">{{ description }}</p>
```

#### Key Classes

| Class | Purpose |
|---|---|
| `.section-header` | Section heading container |
| `.section-title-1` | H3 title for heading style 1 |
| `.section-title-2` | H3 title for heading style 2 |
| `.subtop` / `.text-top` | Subtitle text above heading |
| `.des-header` | Description text below heading |
| `.button-header` | CTA button wrapper |

### 7.3 Icons

SVG icons are rendered as Liquid snippets with the pattern `snippets/icon-{name}.liquid`.

Available icons: `arrow-left`, `arrow-right`, `arrow-down`, `arrow-up`, `cart`, `cart-product`, `caret`, `close`, `close-small`, `close-solid`, `comment`, `date`, `discount`, `down`, `email`, `envelope`, `exchange`, `facebook`, `filter`, `gift`, `globe-europe`, `heart`, `heart-2`, `heart-solid`, `home`, `instagram`, `lock`, `minus`, `mobile-phone`, `note`, `pin`, `pinterest`, `play`, `plus`, `quickview`, `search`, `shipping`, `shopify-logo`, `snapchat`, `tag`, `tick`, `tiktok`, `truck`, `tumblr`, `twitter`, `unavailable`, `up`, `user`, `view`, `vimeo`, `youtube`.

**Usage:**
```liquid
{%- render 'icon-heart-2' -%}
{%- render 'icon-cart' -%}
{%- render 'icon-search' -%}
```

### 7.4 Breadcrumb

Rendered by `snippets/breadcrumb.liquid`. Visibility per template type is controlled by settings: `enable_breadcrumb`, `enable_collection`, `enable_product`.

---

## 8. Page Structure

### 8.1 Layout (`layout/theme.liquid`)

```
<html lang="{{ shop.locale }}">
  <head>
    <!-- Customer gating redirect (unauthenticated → /account/login) -->
    <!-- meta, preconnect, Google Fonts, favicon -->
    {%- render 'header-css' -%}        <!-- Bootstrap + CSS variables + inline styles -->
    <script src="global.js" defer></script>
  </head>
  <body class="template-{{ template | replace: '.', ' ' | truncatewords: 1, '' | handle }} body-theme">
    {%- render 'loading' -%}
    {%- section 'announcement-bar-slide' -%}
    {%- section 'header' -%}
    {%- section 'store-messages' -%}
    <div class="page-container page-element is-moved-by-drawer">
      {%- render 'breadcrumb' -%}
      <main class="main-content" id="MainContent" role="main">
        <!-- optional: #js-scroll + data-scroll-section wrapper (if enable_animationscroll) -->
        {%- render 'slideshow' -%}
        {%- render 'customer-gate-status' -%}   <!-- conditional: customer + gated template -->
        {{ content_for_layout }}
        {%- render 'customer-gate-status-end' -%}
      </main>
      {%- section 'banner-footer' -%}
      {%- section 'newsletter-footer' -%}
      {%- section 'footer' -%}
      {%- section 'pnewsletter' -%}         <!-- conditional: index or design_mode only -->
      {%- section 'product-suggest' -%}
      {%- section 'cookie-policy' -%}
      {%- section 'custom-color' -%}
    </div>
    {%- render 'back-to-top' -%}
    {%- render 'menu-mobile' -%}
    {%- render 'bottom-contents' -%}
    {%- render 'quickview' -%}
    {%- render 'popup-compare' -%}
    {%- render 'header-js' -%}
  </body>
</html>
```

### 8.2 Body Classes

```html
<body class="template-{{ template | replace: '.', ' ' | truncatewords: 1, '' | handle }} body-theme">
```

This expression strips the template suffix (e.g. `product.thumb-left` → `template-product`). Some product page layouts add `.product-hide-breadcrumb`.

### 8.3 Customer Gating

The theme redirects unauthenticated users away from collection, product, search, and list-collections templates to `/account/login`:

```liquid
{%- unless customer -%}
  {%- if template.name == 'collection' or template.name == 'product' ... -%}
    <script>window.location.replace('/account/login?return_url=...');</script>
  {%- endif -%}
{%- endunless -%}
```

Gated content is wrapped in `{%- render 'customer-gate-status' -%}` / `{%- render 'customer-gate-status-end' -%}`.

---

## 9. Template & Section Patterns

### 9.1 JSON Templates

All templates use Shopify's **JSON template** format (Online Store 2.0):

```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "blocks": { ... },
      "block_order": [ ... ],
      "settings": { ... }
    }
  },
  "order": ["main"]
}
```

### 9.2 Template Variants

Many alternate templates are provided:

- **Product:** 17+ variants (`product.json`, `product.thumb-left.json`, `product.collage-s1.json`, `product.tab-accordion.json`, `product.variant-image.json`, etc.)
- **Collection:** 16+ variants (`collection.json`, `collection.collection-drawer-filter.json`, `collection.collection-infinity.json`, etc.)
- **Blog:** 14 variants
- **Article:** 6 variants
- **Page:** 15+ custom page templates (including `page.quity-home.json`)

### 9.3 Section Schema Pattern

Sections define settings in a `{% schema %}` JSON block:

```liquid
{% schema %}
{
  "name": "Section Name",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "..." }
  ],
  "blocks": [ ... ],
  "presets": [{ "name": "Section Name" }]
}
{% endschema %}
```

### 9.4 Common Section Settings

Most sections follow a consistent pattern for these settings:

| Setting | Type | Purpose |
|---|---|---|
| `title` | `text` | Section heading |
| `title_top` | `text` | Subtitle above heading |
| `des` | `richtext` | Description below heading |
| `align-heading` | `select` | Heading alignment (`left`, `center`, `right`) |
| `animation` | `select` | AOS animation type |
| `padding_top` | `range` | Top padding (px) |
| `padding_bottom` | `range` | Bottom padding (px) |

---

## 10. JavaScript Patterns

### 10.1 Custom Elements (Web Components)

| Tag | File | Purpose |
|---|---|---|
| `<quantity-input>` | `global.js` | +/- quantity stepper with `change` event |
| `<product-model>` | `product-model.js` | 3D model viewer |
| `<pickup-availability>` | `pickup-availability.js` | Store pickup info |
| `<predictive-search>` | `predictive-search.js` | Search autocomplete |

### 10.2 Global Utility Functions (`assets/global.js`)

| Function | Purpose |
|---|---|
| `trapFocus(container)` | Traps keyboard focus within modal/drawer |
| `removeTrapFocus()` | Releases focus trap |
| `pauseAllMedia()` | Pauses all YouTube, Vimeo, HTML5 video, 3D models |
| `onKeyUpEscape(event)` | Closes `<details>` on Escape key |
| `debounce(fn, wait)` | Standard debounce utility |
| `fetchConfig(type)` | Returns `{ method: 'POST', headers: {...} }` for JSON requests |

### 10.3 Shopify JS Namespace (`global.js`)

| Function | Purpose |
|---|---|
| `Shopify.formatMoney(cents, format)` | Format cents to money string |
| `Shopify.resizeImage(src, size)` | Generate resized image URL |
| `Shopify.setSelectorByValue(sel, val)` | Set `<select>` by value |

### 10.4 JS Hook Classes

Prefix JS-only classes with `js-`:

| Class | Purpose |
|---|---|
| `.js-product-card` | Product card JS targeting |
| `.js-btn-wishlist` | Wishlist toggle (`data-handle`) |
| `.js-btn-quickview` | Quick view trigger (`data-handle`, `data-toggle="modal"`) |
| `.js-btn-compare` | Compare toggle (`data-handle`) |
| `.js-grid-cart` | Add-to-cart from product grid |
| `.js-countdown` | Countdown timer (`data-time`) |
| `.js-youtube` / `.js-vimeo` | Video embed elements |
| `.js-scroll` | Scroll animation container |
| `.js-free-shipping` | Free shipping bar |

### 10.5 Lazy Loading

Uses **lazysizes** library:

```html
<img class="lazyload"
     data-src="{{ image_url }}"
     src="{{ 1x1_placeholder }}"
     data-sizes="auto"
     data-widths="[180, 360, 540, 720]"
     loading="lazy"
     alt="{{ alt }}">
```

The class `.lazyloaded` is applied when the image finishes loading.

---

## 11. Animation

### 11.1 AOS (Animate On Scroll)

Sections use AOS via data attributes:

```html
<div data-aos="fade-up" data-aos-duration="500">...</div>
```

Common values: `fade-up`, `fade-in`, `fade-left`, `fade-right`, `zoom-in`.

### 11.2 CSS Transition Durations

```css
--duration-short: .1s;
--duration-default: .2s;
--duration-long: .5s;
```

### 11.3 Loading Effects

Controlled by the `loading` setting: `"border"` (spinner-border) or `"grow"` (spinner-grow). Color inherits from `--g-color-heading`.

---

## 12. Asset Organization

```
assets/
├── theme.css              # Main stylesheet (custom grid, theme styles; also contains a duplicate of some Bootstrap grid rules)
├── global.js              # Core JS: utilities, custom elements, Shopify helpers
├── theme.js / theme.min.js   # Additional theme JS
├── vendor.js              # Third-party vendor scripts
├── facets.js              # Collection filtering
├── predictive-search.js   # Search autocomplete
├── component-*.css        # Scoped component styles (loaded on demand)
├── *.min.js               # Minified vendor libraries (lazysizes, Swiper, ion.rangeSlider, etc.)
├── patient-intake-form.*  # Custom page-specific assets
└── *.svg.liquid           # Liquid-processed SVG assets
```

### Conditionally Loaded Component CSS

| File | Purpose |
|---|---|
| `component-card.css` | Product card supplementary styles |
| `component-facets.css` | Collection filter/facet styles |
| `component-pagination.css` | Pagination styles |
| `component-predictive-search.css` | Search dropdown styles |
| `component-rte.css` | Rich text editor content styles |
| `component-product-model.css` | 3D model viewer styles |
| `cart-draw.css` | Cart drawer styles |
| `account-dashboard.css` | Account pages styles |

---

## 13. Conventions & Best Practices

### 13.1 Naming Conventions

- **CSS classes:** BEM-influenced (`product-card__name`, `product-card--style1`)
- **JS hooks:** `js-` prefix (`.js-product-card`, `.js-btn-wishlist`)
- **Settings IDs:** `snake_case` (`color_primary`, `font_size_product`)
- **CSS variables:** `--g-` prefix for global theme variables
- **Snippet filenames:** `kebab-case` (`product-card.liquid`, `section-heading.liquid`)
- **Section filenames:** `kebab-case` (`featured-collections-1.liquid`)

### 13.2 Liquid Patterns

- Use `{%- -%}` whitespace-stripping tags for control flow
- Use `{% render 'snippet-name' %}` to include snippets (never `{% include %}`)
- Use `{% section 'section-name' %}` for static sections
- Use `{%- liquid ... -%}` for multi-line logic blocks
- Capture complex HTML into variables with `{% capture var_name %}`

### 13.3 Responsive Design Notes

- Not consistently mobile-first — many styles target desktop with `max-width` overrides
- Use Bootstrap 4 responsive classes (`.d-none`, `.d-md-block`, `.col-lg-6`, etc.)
- The custom grid uses `small--`, `medium--`, `large--` prefixes
- Product grids commonly use Swiper for mobile carousel behavior

### 13.4 Image Best Practices

- Always use Shopify's `image_url` filter for responsive images
- Use lazysizes with `lazyload` class for lazy loading
- Include `width` and `height` attributes to prevent CLS
- Use `data-widths="[180, 360, 540, 720]"` for responsive srcset
- Maintain aspect ratios via `padding-top` percentage technique:
  ```liquid
  style="padding-top:{{ 1 | divided_by: image.aspect_ratio | times: 100 }}%;"
  ```

### 13.5 Shopify API Interactions

- Cart operations: `fetchConfig('json')` → POST to `/cart/add.js`, `/cart/change.js`
- Product data: GET `/products/{handle}.js`
- Predictive search: GET `/search/suggest.json`

---

## 14. Key Files Quick Reference

| Purpose | File(s) |
|---|---|
| Theme settings schema | `config/settings_schema.json` |
| Current settings values | `config/settings_data.json` |
| CSS variables & inline CSS | `snippets/header-css.liquid` |
| Main stylesheet | `assets/theme.css` |
| Core JS | `assets/global.js` |
| Main layout | `layout/theme.liquid` |
| Product card component | `snippets/product-card.liquid` |
| Section heading component | `snippets/section-heading.liquid` |
| Header navigation | `sections/header.liquid` + `snippets/header-logo-*.liquid` |
| Footer | `sections/footer.liquid` |
| Cart drawer | `sections/cart-template.liquid` + `assets/cart-draw.css` |
| Quick view modal | `snippets/quickview.liquid` |
| Font loading | `snippets/font-custom.liquid` + `snippets/font-icon.liquid` |
| JS initialization | `snippets/header-js.liquid` |
| Translations | `locales/en.default.json` |
