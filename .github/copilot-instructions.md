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

## Naming

- Do not use type suffixes in file names (no `.component`, `.service`, `.pipe`, `.directive`, `.guard`, `.interceptor`, `.module`, `.routing`).
- Do not use type suffixes in class names (no `Component`, `Service`, `Pipe`, `Directive`, `Guard`, `Interceptor`, `Module`).
- Prefer concise domain names: `user-profile.ts`, `auth.ts`, `currency-format.ts`; classes like `UserProfile`, `Auth`, `CurrencyFormat`.

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
- **Buttons:** Always use Angular Material 3's new button API format (e.g., `[matButton]="'filled'"`, `[matButton]="'outlined'"`, `[matButton]="'tonal'"`). For button sizing and coloring, use our custom directives: `appButtonSize="xs | sm | md"` (defaults to 'sm') and `appButtonColor="primary | error"` (defaults to 'primary').
- Do **not** use Tailwind CSS. Rely on pure SCSS/CSS and Material's design system tokens.
- **Layouting:** Use the custom grid system with `.col-span.#` classes (per user directives on the span of each element).
- **Containers:** Use the `<app-pane>` (or `pane` component) elements as the main containers for each part of the screen.
- Keep shared app-level styles in `src/styles.css`; keep component-specific styles local.
- Do not replace Material components with custom HTML unless there is a clear product reason.

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
