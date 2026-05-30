<!-- BEGIN:nextjs-agent-rules -->
# Finance Mini App - Coding Guidelines & Rules

> [!IMPORTANT]
> **This is NOT the Next.js you know!**
> This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
> 
> *AI Agent Note:* If fixing slow client-side navigations, `Suspense` alone is not enough. You must also export `unstable_instant` from the route. Read `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx` before making changes.

Welcome! This is a mobile-first financial tracking app built on Next.js 16.2.6 (React 19), Tailwind CSS v4, Material UI v6, and Firebase. To keep the codebase clean, stable, and highly performant, please adhere to these project rules:

## 1. Project Stack & Runtime
- **Package Manager & Runtime**: **Bun** is the official runtime and package manager. Always use `bun` commands instead of `npm`, `yarn`, or `pnpm` (e.g., `bun run dev`, `bun run build`, `bun run lint`, `bun install <package>`).
- **Framework**: Next.js 16.2.6 (React 19) utilizing the **App Router** (`src/app/`).
- **Database**: Firebase Firestore.
- **Authentication**: Firebase Auth (Google Sign-In).

## 2. Directory Structure & Conventions
- **Routing & Views**:
  - `src/app/(auth)/`: Unprotected/public pages (login, vendor connecting).
  - `src/app/(dashboard)/`: Protected dashboard, transactions, reports, and profile pages. Keep layout protection consistent.
- **Components**: Shared and common components reside in `src/components/common/` (e.g., `Navbar.tsx`, `GoogleSignInButton.tsx`).
- **Theme & Registry**: MUI v6 Theme config is in `src/lib/mui/theme.ts`. Avoid ad-hoc styling that violates these global configs.
- **Type Definitions**: All custom TypeScript types (e.g., `Vendor`, `Transaction`, `PeriodBalance`) must be kept in `src/types/index.ts`. Always import these types rather than declaring inline interfaces.

## 3. Styling, Tailwind CSS v4, and MUI v6 Integration
- **CSS Layer Ordering**: We use Tailwind CSS v4 with a custom `@layer` configuration to prevent Tailwind from overriding Material UI styling. In `src/app/globals.css`, the order must always be:
  ```css
  @layer theme, base, mui, components, utilities;
  @import "tailwindcss";
  ```
- **Consistent Design Theme**:
  - Main background is dark violet/space theme (`#0A0A15`).
  - Use glassmorphism classes (`glass`) and specific animation helpers (`gradient-text`, `animate-float-slow`, etc.) for beautiful visuals.
  - Rely on global component customization in `src/lib/mui/theme.ts` for inputs, cards, and bottom navigations.

## 4. Firestore Transactions & Reliability
- **Atomic Balance Updates**: Inserting a transaction in `transactions` and updating the corresponding master saldo in `periodBalances` **MUST** always be atomic. Always execute them together inside a Firestore transaction (`runTransaction`) to guarantee data integrity:
  ```ts
  await runTransaction(db, async (transaction) => {
    // 1. Read the period balances document
    // 2. Compute the new balance based on transaction type (IN/OUT)
    // 3. Write/update period balance and create transaction document
  });
  ```
- **Denormalization**: Store `year` and `month` inside both `transactions` and `periodBalances` to simplify range-based queries and reporting.

## 5. Mobile-First & PWA Conventions
- **Mobile Navigation**: The bottom navbar (`MuiBottomNavigation`) must keep labels visible at all times for enhanced mobile UX (`showLabels` prop enabled).
- **Test Automation / IDs**: Ensure interactive navigation elements have unique, descriptive IDs (e.g., `id="nav-dashboard"`) for reliable testing.
- **Progressive Web App**: The app operates as a PWA. Service Worker is registered via `src/components/common/ServiceWorkerRegistration.tsx` using `src/app/manifest.ts`. Keep offline features and cache-control headers in `next.config.ts` intact.

## 6. React 19 & ESLint Best Practices
- **No Inner/Nested Components**: Never declare components inside the render body of another component (e.g., `const SummaryCard = () => ...` declared inside a Page component). This causes React to recreate the component on every render, resetting internal state and hurting performance. Always declare helper components at the module/file scope.
- **Avoid Synchronous setState in useEffect**: Avoid calling synchronous `setState()` updates directly within the body of a `useEffect` during mounting/renders, as this triggers cascading updates. Leverage event handlers, SWR caching mechanisms, or fetch wrappers to manage state cleanly.
<!-- END:nextjs-agent-rules -->
