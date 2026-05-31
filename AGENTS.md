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

<!-- BEGIN:Gemini-CLI-Directives -->
# context-mode — MANDATORY routing rules

context-mode MCP tools available. Rules protect context window from flooding. One unrouted command dumps 56 KB into context. Antigravity has NO hooks — these instructions are ONLY enforcement. Follow strictly.

## Think in Code — MANDATORY

Analyze/count/filter/compare/search/parse/transform data: **write code** via `mcp__context-mode__ctx_execute(language, code)`, `console.log()` only the answer. Do NOT read raw data into context. PROGRAM the analysis, not COMPUTE it. Pure JavaScript — Node.js built-ins only (`fs`, `path`, `child_process`). `try/catch`, handle `null`/`undefined`. One script replaces ten tool calls.

## BLOCKED — do NOT use

### curl / wget — FORBIDDEN
Do NOT use `curl`/`wget` via `run_command`. Dumps raw HTTP into context.
Use: `mcp__context-mode__ctx_fetch_and_index(url, source)` or `mcp__context-mode__ctx_execute(language: "javascript", code: "const r = await fetch(...)")`

### Inline HTTP — FORBIDDEN
No `node -e "fetch(..."`, `python -c "requests.get(..."` via `run_command`. Bypasses sandbox.
Use: `mcp__context-mode__ctx_execute(language, code)` — only stdout enters context

### Direct web fetching — FORBIDDEN
No `read_url_content` for large pages. Raw HTML can exceed 100 KB.
Use: `mcp__context-mode__ctx_fetch_and_index(url, source)` then `mcp__context-mode__ctx_search(queries)`

## REDIRECTED — use sandbox

### Shell (>20 lines output)
`run_command` ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`.
Otherwise: `mcp__context-mode__ctx_batch_execute(commands, queries)` or `mcp__context-mode__ctx_execute(language: "shell", code: "...")`

### File reading (for analysis)
Reading to **edit** → `view_file`/`replace_file_content` correct. Reading to **analyze/explore/summarize** → `mcp__context-mode__ctx_execute_file(path, language, code)`.

### Search (large results)
Use `mcp__context-mode__ctx_execute(language: "shell", code: "grep ...")` in sandbox.

## Tool selection

1. **GATHER**: `mcp__context-mode__ctx_batch_execute(commands, queries)` — runs all commands, auto-indexes, returns search. ONE call replaces 30+. Each command: `{label: "header", command: "..."}`.
2. **FOLLOW-UP**: `mcp__context-mode__ctx_search(queries: ["q1", "q2", ...])` — all questions as array, ONE call.
3. **PROCESSING**: `mcp__context-mode__ctx_execute(language, code)` | `mcp__context-mode__ctx_execute_file(path, language, code)` — sandbox, only stdout enters context.
4. **WEB**: `mcp__context-mode__ctx_fetch_and_index(url, source)` then `mcp__context-mode__ctx_search(queries)` — raw HTML never enters context.
5. **INDEX**: `mcp__context-mode__ctx_index(content, source)` — store in FTS5 for later search.

## Parallel I/O batches

For multi-URL fetches or multi-API calls, **always** include `concurrency: N` (1-8):

- `mcp__context-mode__ctx_batch_execute(commands: [3+ network commands], concurrency: 5)` — gh, curl, dig, docker inspect, multi-region cloud queries
- `mcp__context-mode__ctx_fetch_and_index(requests: [{url, source}, ...], concurrency: 5)` — multi-URL batch fetch

**Use concurrency 4-8** for I/O-bound work (network calls, API queries). **Keep concurrency 1** for CPU-bound (npm test, build, lint) or commands sharing state (ports, lock files, same-repo writes).

GitHub API rate-limit: cap at 4 for `gh` calls.

## Output

Write artifacts to FILES — never inline. Return: file path + 1-line description.
Descriptive source labels for `search(source: "label")`.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call `stats` MCP tool, display full output verbatim |
| `ctx doctor` | Call `doctor` MCP tool, run returned shell command, display as checklist |
| `ctx upgrade` | Call `upgrade` MCP tool, run returned shell command, display as checklist |
| `ctx purge` | Call `purge` MCP tool with confirm: true. Warns before wiping knowledge base. |

After /clear or /compact: knowledge base and session stats preserved. Use `ctx purge` to start fresh.
<!-- END:Gemini-CLI-Directives -->