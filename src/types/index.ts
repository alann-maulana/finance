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

export interface ReportData {
  initialBalance: number;
  totalIn: number;
  totalOut: number;
  finalBalance: number;
}
