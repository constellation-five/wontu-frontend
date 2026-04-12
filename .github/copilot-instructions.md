# WontuFrontend Copilot Instructions

## Stack

- Angular 21 (standalone APIs)
- pnpm
- Vitest
- Tailwind CSS 4
- Angular Material (required for UI components and theming)

## Core Rules

- Use standalone components/directives/pipes (no NgModules for app features).
- Use signals (`signal`, `computed`, `input`, `output`) for local state.
- Use Signal Forms (`@angular/forms/signals`), not Reactive Forms or Template-driven forms.
- Use modern control flow (`@if`, `@for`, `@switch`).
- Set `ChangeDetectionStrategy.OnPush` on components.
- Keep strict typing; avoid `any`.

## Project Structure (Respect This Layout)

- Keep app code under `src/app` with `core`, `shared`, `features`, and `app.*`.
- `core`: app-wide singleton concerns only (auth, guards, interceptors, cross-app services).
- `shared`: reusable UI/components/directives/pipes used by multiple features.
- `features`: domain folders (for example `admin`, `user`, `products`) with local components/services/routes.
- Add state logic under `src/app/features/state` (`actions`, `reducers`) when needed.
- Keep `assets`, `environments`, `styles`, `main.ts`, and `index.html` at `src` root.
- Prefer lazy loading for feature routes.
- Keep files grouped by feature to reduce coupling and merge conflicts.

### Target Tree

```text
src/
	app/
		core/
			interceptors/
			guards/
			auth.service.ts
			user.service.ts
		shared/
			components/
				navbar/
				sidebar/
			directives/
			pipes/
			shared.module.ts
		features/
			admin/
				components/
				services/
				admin.module.ts
				admin-routing.module.ts
			user/
				components/
				services/
				user.module.ts
				user-routing.module.ts
			products/
				components/
				services/
				products.module.ts
				products-routing.module.ts
			state/
				reducers/
				actions/
		app.*
	assets/
	environments/
	styles/
	main.ts
	index.html
```

## Styling and Theming (Material + Tailwind)

- Use Angular Material for base UI primitives (buttons, inputs, dialogs, menus, tables, etc.).
- Use Tailwind for layout, spacing, sizing, responsive rules, and utility-level polish.
- Theme from Material first: define/extend tokens and palettes in `src/material-theme.scss`.
- Keep shared app-level styles in `src/styles.css`; keep component-specific styles local.
- Do not replace Material components with custom HTML unless there is a clear product reason.
- Ensure custom Tailwind utilities respect Material density, typography, and color tokens.

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
- Tailwind docs: https://tailwindcss.com
- Vitest docs: https://vitest.dev
