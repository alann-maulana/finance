export interface Vendor {
  id: string;
  name: string;
  code: string;
  createdAt: Date | null;
  createdBy: string;
}

export interface VendorMember {
  id: string;
  vendorId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date | null;
}

export interface PeriodBalance {
  id: string;
  vendorId: string;
  year: number;
  month: number;
  balance: number;
}

export interface Category {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  created_by: string;
  created_at: Date | null;
}

export interface Transaction {
  id: string;
  vendorId: string;
  type: 'IN' | 'OUT';
  amount: number;
  period: string;
  year: number;
  month: number;
  note?: string;
  createdBy: string;
  createdByName?: string | null;
  createdAt: Date | null;
  /** Firestore document ID of the linked category (stored as Reference on Firestore) */
  categoryId?: string | null;
  /** Denormalized category name for fast display without extra reads */
  categoryName?: string | null;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Represents a document in the `users` Firestore collection. */
export interface AppUserProfile {
  uid: string;
  email: string;
  name: string;
  verified: boolean;
}

export interface DashboardData {
  totalIn: number;
  totalOut: number;
  currentBalance: number;
  recentTransactions: Transaction[];
}

export interface CategorySpending {
  categoryName: string;
  total: number;
}

export interface ReportData {
  initialBalance: number;
  totalIn: number;
  totalOut: number;
  finalBalance: number;
  /** OUT transactions grouped by category, sorted highest → lowest */
  categoryBreakdown: CategorySpending[];
}

// ─── Balance Adjustment ───────────────────────────────────────────────────────

/** One funding source entry inside a balance adjustment */
export interface AdjustmentItem {
  /** Row number (1-based), auto-generated on display */
  no: number;
  /** Name of the funding source, e.g. "Rekening BCA" */
  sourceName: string;
  /** Balance amount for this source */
  amount: number;
}

/**
 * Represents one document in the `balanceAdjustments` Firestore collection.
 * status:
 *   - "draft"     = saved items only, no OUT transaction created yet
 *   - "submitted" = draft + OUT transaction committed to balance
 */
export interface BalanceAdjustment {
  id: string;
  vendorId: string;
  /** Funding source rows */
  items: Omit<AdjustmentItem, 'no'>[];
  /** Sum of all items[].amount */
  totalSources: number;
  /** The period balance (saldo akhir kas) at the time of submission */
  balanceAtSubmit: number | null;
  /**
   * Selisih = balanceAtSubmit - totalSources
   * Positive → added as OUT transaction (balance was over the sources total)
   * Negative → would add IN transaction, but for now we create OUT with abs value
   */
  selisih: number | null;
  /** Firestore ID of the OUT transaction created on submit (null if draft) */
  transactionId: string | null;
  status: 'draft' | 'submitted';
  /** year and month of the period used when submitting */
  year: number | null;
  month: number | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date | null;
  submittedAt: Date | null;
}
