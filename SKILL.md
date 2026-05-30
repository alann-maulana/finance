# Finance Mini App - AI Agent Skill Guide (`SKILL.md`)

> [!NOTE]
> This guide is a specialized "skills" index for AI agents working on the Finance Mini App. It defines core patterns, architectures, API schemas, and strict constraints that MUST be followed when coding, debugging, or adding features to this codebase.

---

## 1. Project Stack & Environment

Always develop, build, and maintain the application using these specific library versions and runtime environments:

| Technology | Role / Component | Version | Custom Notes / Details |
| :--- | :--- | :--- | :--- |
| **Bun** | Runtime & Package Manager | Latest | Avoid `npm`, `yarn`, or `pnpm`. Use `bun run dev`, `bun run build`. |
| **Next.js** | Web Framework (App Router) | `16.2.6` | Running on React 19. Has breaking changes. |
| **React** | Core Library | `19.2.4` | Strict rules regarding hook rendering and state updates. |
| **Tailwind CSS** | Styling | `v4` | Integrated via PostCSS. Custom theme variables in `globals.css`. |
| **Material UI (MUI)** | UI Component Library | `v6` | Theme configured in `src/lib/mui/theme.ts`. |
| **Firebase** | DB, Auth & Server SDK | `^12.14.0` | Uses Firebase Firestore and Firebase Google Auth. |

---

## 2. Developer Command Reference

Always use `bun` commands. Do not run arbitrary package managers.

```bash
# Start local development server
bun run dev

# Run ESLint validation checks
bun run lint

# Build the production PWA bundle
bun run build

# Start the built production app
bun run start
```

---

## 3. Database Schema & Data Models

All TypeScript interfaces must be imported from `src/types/index.ts`. Do not define local duplicate interfaces.

```typescript
// From src/types/index.ts

export interface Vendor {
  id: string;          // Firestore Document ID (Unique 6-char random uppercase code)
  name: string;        // Vendor name
  code: string;        // Shareable join code
  createdAt: Date | null;
  createdBy: string;   // UID of the admin
}

export interface VendorMember {
  id: string;
  vendorId: string;    // Reference to vendors.id
  userId: string;      // Firebase Auth UID
  role: 'admin' | 'member';
  joinedAt: Date | null;
}

export interface PeriodBalance {
  id: string;          // Formatted as: `${vendorId}_${year}-${month}` (zero-padded month, e.g., "vendorXYZ_2026-05")
  vendorId: string;
  year: number;
  month: number;
  balance: number;     // Master saldo at the end of the period
}

export interface Transaction {
  id: string;
  vendorId: string;
  type: 'IN' | 'OUT';
  amount: number;      // Always positive
  period: string;      // Formatted as: `${year}-${month}` (zero-padded)
  year: number;        // Denormalized for filter query support
  month: number;
  note?: string;
  createdBy: string;   // User UID
  createdByName?: string | null;
  createdAt: Date | null;
}
```

---

## 4. Firestore Transactional Reliability Pattern

Inserting a transaction and updating the corresponding master saldo **MUST** always be atomic. If either write fails, the entire transaction must roll back.

### The Firestore `runTransaction` Rule
Implement mutations using the following atomic read-modify-write pattern, defined in `src/lib/firebase/firestore.ts`:

```typescript
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { db } from './config';

export async function updateBalanceForTransaction(
  vendorId: string,
  year: number,
  month: number,
  amount: number,
  type: 'IN' | 'OUT',
  note: string,
  createdBy: string,
  createdByName?: string | null
): Promise<string> {
  const period = `${year}-${month.toString().padStart(2, '0')}`;
  const balRef = doc(db, 'periodBalances', `${vendorId}_${period}`);
  const txRef = doc(collection(db, 'transactions'));

  await runTransaction(db, async (txn) => {
    // 1. READ current period balance first
    const balSnap = await txn.get(balRef);

    let currentBalance: number;
    if (balSnap.exists()) {
      currentBalance = balSnap.data().balance as number;
    } else {
      // Seed balance from the previous period (handled inside or cleanly resolved)
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevPeriod = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
      const prevRef = doc(db, 'periodBalances', `${vendorId}_${prevPeriod}`);
      const prevSnap = await txn.get(prevRef);
      currentBalance = prevSnap.exists() ? (prevSnap.data().balance as number) : 0;
    }

    // 2. COMPUTE new balance based on transaction type
    const newBalance = type === 'IN' ? currentBalance + amount : currentBalance - amount;

    // 3. WRITE balance doc
    txn.set(
      balRef,
      { vendorId, year, month, balance: newBalance },
      { merge: true }
    );

    // 4. WRITE transaction doc
    txn.set(txRef, {
      vendorId,
      type,
      amount,
      period,
      year,
      month,
      note: note.trim(),
      createdBy,
      createdByName: createdByName ?? null,
      createdAt: serverTimestamp(),
    });
  });

  return txRef.id;
}
```

---

## 5. Styling Layering & UI Tokens

### CSS Cascade Ordering
Tailwind CSS v4 is configured with layer boundaries to avoid overriding Material UI components.
In `src/app/globals.css`, the imports and layer order **MUST** be exactly as follows:

```css
@layer theme, base, mui, components, utilities;
@import "tailwindcss";
```

### Visual & Theme Tokens
Keep designs premium and modern by relying on these global tokens and styles instead of raw default colors:

- **Theme Background**: Dark Violet / Space Theme (`#0A0A15`)
- **Card Background**: Glassmorphism helper class `glass`
  ```css
  .glass {
    background: rgba(19, 19, 43, 0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(124, 58, 237, 0.2);
  }
  ```
- **Text Gradient**: Use `.gradient-text` for highlighting titles.
- **Animations**: Use `.animate-float-slow`, `.animate-float-medium`, `.animate-pulse-glow` for beautiful ambient elements.

---

## 6. React 19 & Next.js 16 Guardrails

### ❌ NO Inner / Nested Component Declarations
Never define a component inside the render function of another component.

```typescript
// 🔴 BAD: Summarizer is recreated on every single parent render, resetting local state
const DashboardPage = () => {
  const Summarizer = () => {
    return <div>...</div>;
  };
  return <Summarizer />;
};

// 🟢 GOOD: Components defined at the module/file scope
const Summarizer = () => {
  return <div>...</div>;
};

const DashboardPage = () => {
  return <Summarizer />;
};
```

### ❌ AVOID Synchronous setState in useEffect
Never call a synchronous state setter directly on render/mount within `useEffect` if it triggers recursive layout cascading updates. Instead, use events, handlers, SWR caching hooks, or pre-fetched server state.

---

## 7. PWA, Mobile Navigation & Test Requirements

1. **Bottom Navigation**: Keep menu labels visible on mobile devices at all times. The `MuiBottomNavigation` component must have `showLabels` set to `true`:
   ```typescript
   <BottomNavigation showLabels ...>
   ```
2. **Automation Tests**: Ensure interactive links, buttons, and navigation elements have unique `id` attributes (e.g., `id="nav-dashboard"`, `id="btn-add-transaction"`) for reliable integration testing.
3. **PWA Registrations**: The service worker is loaded via `src/components/common/ServiceWorkerRegistration.tsx`. Do not interrupt or bypass this hook.
