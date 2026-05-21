# WontuFrontend Copilot Instructions

## Stack

- Angular 21 (standalone APIs)
- pnpm
- Vitest
- Angular Material (required for UI components, theming, and system variables)

## Core Rules

- Use standalone components/directives/pipes (no NgModules for app features).
- Use signals (`signal`, `computed`, `input`, `output`) for local state.
- Use Signal Forms (`@angular/forms/signals`), not Reactive Forms or Template-driven forms.
- Use inject() for DI, not constructor injection.
- Use modern control flow (`@if`, `@for`, `@switch`).
- Set `ChangeDetectionStrategy.OnPush` on components.
- Keep strict typing; avoid `any`.
- Do not add code explanation comments unless explicitly instructed to. If you do, make them in English, concise, and only for non-obvious code.
- Always use the defined API environment variable (e.g., from `environment.ts`) as a prefix to all API routes.
- Use the PageHeaderService to set page titles, breadcrumbs, and optional mobile "more" menu items in each route component, and the BottomBarService to add custom action buttons to the bottom bar.

## Naming

- Components should not be suffixed with "Component" in both the file name and class name (e.g., `user-profile.ts`, not `user-profile-component.ts`, and `UserProfile`, not `UserProfileComponent`).
- Prefer concise domain names: `user-profile.ts`, `auth-service.ts`, `currency-format.ts`; classes like `UserProfile`, `AuthService`, `CurrencyFormat`.

## Project Structure (Respect This Layout)

- Keep app code under `src/app` with `core`, `shared`, `features`, and `app.*`.
- `core`: app-wide singleton concerns only (auth, guards, interceptors, cross-app services).
- `shared`: reusable UI/components/directives/pipes used by multiple features.
- `features`: domain folders (for example `admin`, `user`, `products`) with local components/services/routes.
- Add state logic under `src/app/features/state` (`actions`, `reducers`) when needed.
- Keep `assets`, `environments`, `styles`, `main.ts`, and `index.html` at `src` root.
- Prefer lazy loading for feature routes.
- Keep files grouped by feature to reduce coupling and merge conflicts.

## Styling and Theming (Angular Material & Custom Grid)

- Use Angular Material for base UI primitives (buttons, inputs, dialogs, menus, tables, etc.).
- Prioritize Angular Material's built-in system tokens (e.g., `var(--mat-sys-...)`) and custom overrides (e.g. `@include mat....-overrides((...));`) for styling (see [Theming your components](https://material.angular.dev/guide/theming-your-components) and [Theming guide](https://material.angular.dev/guide/theming)).
- Use the global variables defined in `src/material-theme.scss` for consistent app-wide styling.
- **Buttons:** Always use Angular Material 3's new button API format (e.g., `matButton="filled | outlined | tonal | text | elevated"`). For button sizing and coloring, use our custom directives: `appButtonSize="xs | sm | md"` (defaults to 'sm') and `appButtonColor="primary | error"` (defaults to 'primary'). For icon button variants, use `matIconButton` with `appIconButtonVariant="filled | outlined | tonal | text | elevated"` directive.
- Do **not** use Tailwind CSS. Rely on pure SCSS/CSS and Material's design system tokens.
- **Containers:** Use `<app-pane>` elements as the main containers for each part of the screen.
- Keep shared app-level styles in `src/material-theme.scss`; keep component-specific styles local.
- Do not replace Material components with custom HTML unless there is a clear product reason.

## Material Design Tokens & Utilities Reference

Use CSS variables (`var(--mat-sys-*)`) in styles or utility classes (`.mat-*`) in templates. Custom styles should be used for interactive or complex elements. Utility classes should be used for simple or one-off styling tasks. All support light/dark mode automatically.

### Color Tokens

**Background Colors**

- `.mat-bg-primary` / `--mat-sys-primary` — Key components
- `.mat-bg-primary-container` / `--mat-sys-primary-container` — Prominent containers
- `.mat-bg-secondary` / `--mat-sys-secondary` — Secondary components
- `.mat-bg-secondary-container` / `--mat-sys-secondary-container` — Secondary emphasis
- `.mat-bg-error` / `--mat-sys-error` — Error states
- `.mat-bg-error-container` / `--mat-sys-error-container` — Error emphasis
- `.mat-bg-surface` / `--mat-sys-surface` — General surfaces
- `.mat-bg-surface-variant` / `--mat-sys-surface-variant` — Surface distinction
- `.mat-bg-surface-container-lowest` / `--mat-sys-surface-container-lowest` — Lowest emphasis
- `.mat-bg-surface-container-low` / `--mat-sys-surface-container-low` — Low emphasis
- `.mat-bg-surface-container` / `--mat-sys-surface-container` — Medium emphasis
- `.mat-bg-surface-container-high` / `--mat-sys-surface-container-high` — High emphasis
- `.mat-bg-surface-container-highest` / `--mat-sys-surface-container-highest` — Highest emphasis
- `.mat-bg-inverse-surface` / `--mat-sys-inverse-surface` — Notifications/tooltips
- `.mat-bg-disabled` / `--mat-sys-on-surface 12%` — Disabled components

**Text Colors**

- `.mat-text-primary` / `--mat-sys-primary` — Prominent text
- `.mat-text-secondary` / `--mat-sys-secondary` — Secondary text
- `.mat-text-error` / `--mat-sys-error` — Error messages
- `.mat-text-on-primary` / `--mat-sys-on-primary` — Text on primary backgrounds
- `.mat-text-on-primary-container` / `--mat-sys-on-primary-container` — Text on primary-container
- `.mat-text-on-secondary` / `--mat-sys-on-secondary` — Text on secondary backgrounds
- `.mat-text-on-secondary-container` / `--mat-sys-on-secondary-container` — Text on secondary-container
- `.mat-text-on-error` / `--mat-sys-on-error` — Text on error backgrounds
- `.mat-text-on-error-container` / `--mat-sys-on-error-container` — Text on error-container
- `.mat-text-on-surface` / `--mat-sys-on-surface` — Text on surfaces
- `.mat-text-on-surface-variant` / `--mat-sys-on-surface-variant` — Subheadings, captions, hints
- `.mat-text-inverse-on-surface` / `--mat-sys-inverse-on-surface` — Text on inverse surfaces
- `.mat-text-disabled` / `--mat-sys-on-surface 38%` — Disabled text

### Typography Tokens

**Font Classes** (combine `.mat-font-*` with either CSS or template utility)

- `.mat-font-display-lg/md/sm` — Large headings, hero sections
- `.mat-font-headline-lg/md/sm` — Page/section titles
- `.mat-font-title-lg/md/sm` — Card/section headers
- `.mat-font-body-lg/md/sm` — Body text, lists, table data
- `.mat-font-label-lg/md/sm` — Button labels, badges, chips

**CSS Variables for Typography**

- `--mat-sys-display-*`, `--mat-sys-headline-*`, `--mat-sys-title-*`, `--mat-sys-body-*`, `--mat-sys-label-*`
- Each includes `-tracking` variant for letter-spacing

### Shape Tokens

- `.mat-corner-full` / `--mat-sys-corner-full` — Circular (badges, avatars)
- `.mat-corner-xl` / `--mat-sys-corner-extra-large` — Buttons, dialogs
- `.mat-corner-lg` / `--mat-sys-corner-large` — Cards, FABs
- `.mat-corner-md` / `--mat-sys-corner-medium` — Medium rounding (buttons, cards)
- `.mat-corner-sm` / `--mat-sys-corner-small` — Input fields, chips
- `.mat-corner-xs` / `--mat-sys-corner-extra-small` — Snackbars, tooltips

### Elevation Tokens

**Borders**

- `.mat-border` / `--mat-sys-outline` — Visible border
- `.mat-border-subtle` / `--mat-sys-outline-variant` — Subtle dividers

**Shadows**

- `.mat-shadow-1` / `--mat-sys-level1` — Slightly raised
- `.mat-shadow-2` / `--mat-sys-level2` — Raised (menus, selects)
- `.mat-shadow-3` / `--mat-sys-level3` — More raised (FABs)
- `.mat-shadow-4` / `--mat-sys-level4` — Interaction states (hover/focus)
- `.mat-shadow-5` / `--mat-sys-level5` — Maximum elevation

### Usage Examples

**In templates** (one-off styling):

```html
<div class="mat-bg-surface mat-text-on-surface mat-corner-md mat-shadow-1"></div>
<h2 class="mat-font-headline-md"></h2>
```

**In component styles** (component-specific):

```scss
.custom-card {
  background-color: var(--mat-sys-surface-container);
  color: var(--mat-sys-on-surface);
  border-radius: var(--mat-sys-corner-large);
  box-shadow: var(--mat-sys-level2);
}
```

## Accessibility

- Must pass AXE checks.
- Must meet WCAG AA contrast and keyboard/focus requirements.
- Prefer accessible Material components before building custom equivalents.

## Commands

```bash
pnpm start
pnpm run build
pnpm run watch
pnpm test
```

## File Guide

- App entry: `src/main.ts`
- Root app: `src/app/app.ts`
- Routes: `src/app/app.routes.ts`
- Global styles: `src/styles.css`
- Material theme: `src/material-theme.scss`
- Config: `angular.json`, `tsconfig.json`, `tsconfig.app.json`

## References

- Angular docs: https://angular.dev
- Angular style guide: https://angular.dev/style-guide
- Angular Material docs: https://material.angular.dev
- Vitest docs: https://vitest.dev
