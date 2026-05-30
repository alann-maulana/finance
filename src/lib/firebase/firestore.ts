import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
  runTransaction,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Transaction, DashboardData } from '@/types';

export interface VendorInfo {
  vendorId: string;
  role: 'admin' | 'member';
  vendorCode: string;
  vendorName: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

async function isCodeUnique(code: string): Promise<boolean> {
  const q = query(collection(db, 'vendors'), where('code', '==', code));
  const snap = await getDocs(q);
  return snap.empty;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    if (await isCodeUnique(code)) return code;
  }
  throw new Error('Gagal membuat kode unik. Coba lagi.');
}

/** Converts a Firestore Timestamp or Date-like value to a JS Date (or null). */
function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return null;
}

/** Formats a period string from year + month numbers: "2025-5" */
function periodKey(year: number, month: number): string {
  return `${year}-${month}`;
}

/** Firestore doc ID for a period balance: "${vendorId}_${year}-${month}" */
function balanceDocId(vendorId: string, year: number, month: number): string {
  return `${vendorId}_${periodKey(year, month)}`;
}

// ─── Vendor API ──────────────────────────────────────────────────────────────

/**
 * Returns the vendor info for a given user UID, or null if none.
 */
export async function getUserVendor(userId: string): Promise<VendorInfo | null> {
  const q = query(
    collection(db, 'vendorMembers'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const memberData = snap.docs[0].data();
  const vendorSnap = await getDoc(doc(db, 'vendors', memberData.vendorId));
  if (!vendorSnap.exists()) return null;

  const vendorData = vendorSnap.data();
  return {
    vendorId: memberData.vendorId,
    role: memberData.role as 'admin' | 'member',
    vendorCode: vendorData.code ?? '',
    vendorName: vendorData.name ?? '',
  };
}

/**
 * Finds a vendor by its 6-character join code.
 */
export async function getVendorByCode(
  code: string
): Promise<{ id: string; name: string; code: string } | null> {
  const q = query(
    collection(db, 'vendors'),
    where('code', '==', code.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, name: d.data().name, code: d.data().code };
}

/**
 * Creates a new vendor and adds the creator as admin.
 * Returns the new vendorId and generated code.
 */
export async function createVendor(
  name: string,
  userId: string
): Promise<{ vendorId: string; code: string }> {
  const code = await generateUniqueCode();

  const vendorRef = doc(collection(db, 'vendors'));
  await setDoc(vendorRef, {
    name: name.trim(),
    code,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });

  const memberRef = doc(collection(db, 'vendorMembers'));
  await setDoc(memberRef, {
    vendorId: vendorRef.id,
    userId,
    role: 'admin',
    joinedAt: serverTimestamp(),
  });

  return { vendorId: vendorRef.id, code };
}

/**
 * Joins an existing vendor as a member.
 * No-op if user is already a member.
 */
export async function joinVendor(
  vendorId: string,
  userId: string
): Promise<void> {
  const existing = await query(
    collection(db, 'vendorMembers'),
    where('userId', '==', userId),
    where('vendorId', '==', vendorId)
  );
  const existingSnap = await getDocs(existing);
  if (!existingSnap.empty) return;

  const memberRef = doc(collection(db, 'vendorMembers'));
  await setDoc(memberRef, {
    vendorId,
    userId,
    role: 'member',
    joinedAt: serverTimestamp(),
  });
}

// ─── Period Balance API ───────────────────────────────────────────────────────

/**
 * Gets or creates the period balance document for a given vendor + period.
 *
 * - If it exists, returns the current balance.
 * - If it doesn't exist, seeds the balance from the previous period (or 0).
 */
export async function getOrCreatePeriodBalance(
  vendorId: string,
  year: number,
  month: number
): Promise<number> {
  const balRef = doc(db, 'periodBalances', balanceDocId(vendorId, year, month));
  const balSnap = await getDoc(balRef);

  if (balSnap.exists()) {
    return balSnap.data().balance as number;
  }

  // Find the balance from the previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevRef = doc(db, 'periodBalances', balanceDocId(vendorId, prevYear, prevMonth));
  const prevSnap = await getDoc(prevRef);
  const initialBalance = prevSnap.exists() ? (prevSnap.data().balance as number) : 0;

  // Create the doc
  await setDoc(balRef, {
    vendorId,
    year,
    month,
    balance: initialBalance,
  });

  return initialBalance;
}

/**
 * Atomically inserts a transaction document AND updates the period balance
 * using a Firestore transaction (read-modify-write).
 *
 * @param vendorId - The vendor's Firestore ID.
 * @param year     - Transaction year.
 * @param month    - Transaction month.
 * @param amount   - Positive amount.
 * @param type     - "IN" or "OUT".
 * @param note     - Optional note.
 * @param createdBy - UID of the user creating the transaction.
 */
export async function updateBalanceForTransaction(
  vendorId: string,
  year: number,
  month: number,
  amount: number,
  type: 'IN' | 'OUT',
  note: string,
  createdBy: string
): Promise<string> {
  const period = periodKey(year, month);
  const balRef = doc(db, 'periodBalances', balanceDocId(vendorId, year, month));
  const txRef = doc(collection(db, 'transactions'));

  await runTransaction(db, async (txn) => {
    const balSnap = await txn.get(balRef);

    // Determine current balance (seed from previous period if first time)
    let currentBalance: number;
    if (balSnap.exists()) {
      currentBalance = balSnap.data().balance as number;
    } else {
      // Seed from previous period (outside transaction is fine here — race is acceptable for creation)
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevRef = doc(db, 'periodBalances', balanceDocId(vendorId, prevYear, prevMonth));
      const prevSnap = await txn.get(prevRef);
      currentBalance = prevSnap.exists() ? (prevSnap.data().balance as number) : 0;
    }

    const newBalance =
      type === 'IN' ? currentBalance + amount : currentBalance - amount;

    // Write balance doc (create or update)
    txn.set(
      balRef,
      { vendorId, year, month, balance: newBalance },
      { merge: true }
    );

    // Write transaction doc
    txn.set(txRef, {
      vendorId,
      type,
      amount,
      period,
      year,
      month,
      note: note.trim(),
      createdBy,
      createdAt: serverTimestamp(),
    });
  });

  return txRef.id;
}

// ─── Dashboard API ────────────────────────────────────────────────────────────

/**
 * Fetches dashboard data for the given vendor and period:
 *  - Total IN amount
 *  - Total OUT amount
 *  - Current balance from periodBalances
 *  - 5 most recent transactions (any type)
 */
export async function getDashboardData(
  vendorId: string,
  year: number,
  month: number
): Promise<DashboardData> {
  const period = periodKey(year, month);

  // Parallel fetches: period transactions + recent 5
  const [periodSnap, recentSnap, balSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'transactions'),
        where('vendorId', '==', vendorId),
        where('period', '==', period)
      )
    ),
    getDocs(
      query(
        collection(db, 'transactions'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
    ),
    getDoc(doc(db, 'periodBalances', balanceDocId(vendorId, year, month))),
  ]);

  let totalIn = 0;
  let totalOut = 0;
  periodSnap.forEach((d) => {
    const data = d.data();
    if (data.type === 'IN') totalIn += data.amount as number;
    else totalOut += data.amount as number;
  });

  const currentBalance = balSnap.exists() ? (balSnap.data().balance as number) : 0;

  const recentTransactions: Transaction[] = recentSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      vendorId: data.vendorId,
      type: data.type as 'IN' | 'OUT',
      amount: data.amount as number,
      period: data.period,
      year: data.year,
      month: data.month,
      note: data.note,
      createdBy: data.createdBy,
      createdAt: toDate(data.createdAt),
    };
  });

  return { totalIn, totalOut, currentBalance, recentTransactions };
}
