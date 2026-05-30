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
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface DashboardData {
  totalIn: number;
  totalOut: number;
  currentBalance: number;
  recentTransactions: Transaction[];
}
