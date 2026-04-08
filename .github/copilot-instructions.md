# WontuFrontend - Copilot Instructions

## Project Overview

**WontuFrontend** is a modern Angular 21 application using standalone components, Tailwind CSS, and Vitest for testing. It follows current Angular best practices with reactive signals and functional routing.

## Technology Stack

- **Framework**: Angular 21.2.6
- **Package Manager**: pnpm (configured in `angular.json`)
- **Testing**: Vitest 4.0.8 with Angular testing utilities
- **Styling**: Tailwind CSS 4.1.12 + PostCSS
- **TypeScript**: 5.9.2
- **Code Style**: Prettier (100 char printWidth, single quotes, Angular HTML parser)

## Project Structure

```
src/
├── app/              # Main application component (standalone)
│   ├── app.ts       # Root component with signals & routing
│   ├── app.routes.ts # Routing configuration
│   ├── app.html     # Root template
│   ├── app.css      # Root styles
│   └── app.spec.ts  # Tests
├── main.ts          # Bootstrap entry point
└── styles.css       # Global styles

public/              # Static assets
```

## Essential Commands

```bash
# Development
pnpm start           # Start dev server (http://localhost:4200)
pnpm run build      # Production build → dist/
pnpm run watch      # Watch mode for incremental builds

# Testing
pnpm test           # Run unit tests with Vitest

# Code generation
pnpm ng generate component component-name
pnpm ng generate directive directive-name
pnpm ng generate pipe pipe-name
pnpm ng generate service service-name
```

## Naming & Conventions

| Item               | Convention                         | Example                            |
| ------------------ | ---------------------------------- | ---------------------------------- |
| Components         | PascalCase, match filename         | `MyComponent` in `my.component.ts` |
| Component selector | Lowercase with dash, `app-` prefix | `<app-my-component>`               |
| Files              | kebab-case                         | `my-component.ts`, `my.pipe.ts`    |
| Services           | PascalCase ending with `Service`   | `UserService`                      |
| Models/Interfaces  | PascalCase                         | `User`, `ApiResponse`              |

## Code Style Requirements

- **Standalone Components**: All new components must use standalone components with explicit `imports` array
- **Signals**: Use `signal()` for reactive state instead of class properties
- **Typing**: Always use TypeScript strict mode; type all function parameters and returns
- **Formatting**: Prettier will auto-format; 100 char line width, single quotes
- **Angular Templates**: Use modern control flow (`@if`, `@for`, `@switch`) instead of ngIf/ngFor directives

### Component Template Example

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [],
  template: `
    <div>
      <h1>{{ title() }}</h1>
      @if (isVisible()) {
        <p>Visible content</p>
      }
    </div>
  `,
  styles: [],
})
export class ExampleComponent {
  protected readonly title = signal('Example');
  protected readonly isVisible = signal(true);
}
```

## Testing Approach

- Use Vitest as the test runner
- Test files: `*.spec.ts` colocated with source files
- Utilize Angular testing utilities from `@angular/core/testing`
- Aim for meaningful tests that verify behavior, not implementation details

## Development Tips

1. **Component Prefix**: Always use `app-` prefix for selectors (configured in `angular.json`)
2. **Import Updates**: When adding dependencies, ensure they're listed in the component's `imports` array
3. **Build Size**: Monitor bundle size—Angular budgets are set at 500kB initial, 1MB max
4. **Hot Reload**: Dev server auto-reloads when source files change
5. **pnpm Usage**: This project uses pnpm lock file; run `pnpm install` to install dependencies

## When Requesting Code Generation or Analysis

- **Specify component type**: Standalone components are the default
- **Include templates**: Provide HTML template together with component logic
- **Type everything**: Ask for full TypeScript typing, no `any` types
- **Style scope**: Components use scoped styles by default; use `:host` for host styles
- **Route changes**: Update `app.routes.ts` for any routing modifications

## File Modification Guidelines

- Angular config: [angular.json](angular.json)
- Root component: [src/app](src/app)
- Global styles: [src/styles.css](src/styles.css)
- Dev environment: [src/main.ts](src/main.ts)
- TypeScript config: [tsconfig.json](tsconfig.json), [tsconfig.app.json](tsconfig.app.json)

## References

- [Angular Documentation](https://angular.dev)
- [Angular CLI](https://angular.dev/tools/cli)
- [Vitest Documentation](https://vitest.dev)
- [Tailwind CSS](https://tailwindcss.com)

## Resources

Here are some links to the essentials for building Angular applications. Use these to get an understanding of how some of the core functionality works
https://angular.dev/essentials/components
https://angular.dev/essentials/signals
https://angular.dev/essentials/templates
https://angular.dev/essentials/dependency-injection

## Best practices & Style guide

Here are the best practices and the style guide information.

### Coding Style guide

Here is a link to the most recent Angular style guide https://angular.dev/style-guide

### TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

### Angular Best Practices

- Always use standalone components over `NgModules`
- Do NOT set `standalone: true` inside the `@Component`, `@Directive` and `@Pipe` decorators
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

### Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` signal instead of decorators, learn more here https://angular.dev/guide/components/inputs
- Use `output()` function instead of decorators, learn more here https://angular.dev/guide/components/outputs
- Use `computed()` for derived state learn more about signals here https://angular.dev/guide/signals.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead, for context: https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings
- Do NOT use `ngStyle`, use `style` bindings instead, for context: https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Do not assume globals like (`new Date()`) are available.
- Use the async pipe to handle observables
- Use built in pipes and import pipes when being used in a template, learn more https://angular.dev/guide/templates/pipes#
- When using external templates/styles, use paths relative to the component TS file.

### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
