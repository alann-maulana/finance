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
  writeBatch,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './config';
import type { Transaction, DashboardData, ReportData, Category } from '@/types';

export type TransactionCursor = QueryDocumentSnapshot<DocumentData> | null;

export interface TransactionPage {
  transactions: Transaction[];
  cursor: TransactionCursor;
  hasMore: boolean;
}

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
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/** Firestore doc ID for a period balance: "${vendorId}_${year}-${month}" */
function balanceDocId(vendorId: string, year: number, month: number): string {
  return `${vendorId}_${periodKey(year, month)}`;
}

// ─── User Profile API ────────────────────────────────────────────────────────

/**
 * Creates or updates a document in the `users` collection.
 * Called on every login; sets `verified=false` only on first creation (merge).
 * @param uid   Firebase Auth UID
 * @param email User's email address
 * @param name  User's display name
 */
export async function createOrUpdateUserProfile(
  uid: string,
  email: string,
  name: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  // Only set verified=false if document does NOT yet exist
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, { uid, email, name, verified: false });
  } else {
    // Update mutable fields but never overwrite `verified`
    await setDoc(userRef, { uid, email, name }, { merge: true });
  }
}

/**
 * Returns the `verified` flag for the given UID from the `users` collection.
 * Returns `false` if the document doesn't exist yet.
 */
export async function getUserVerifiedStatus(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return false;
  return (snap.data().verified as boolean) ?? false;
}

/**
 * Saves (or clears) the FCM push token for a user.
 * Called after the browser grants notification permission.
 */
export async function saveFcmToken(uid: string, token: string | null): Promise<void> {
  await setDoc(doc(db, 'users', uid), { fcmToken: token ?? null }, { merge: true });
}

/**
 * Collects valid FCM tokens for all vendor members EXCEPT the given excludeUid.
 * Tokens that are null/empty are filtered out.
 */
export async function getVendorMemberFcmTokens(
  vendorId: string,
  excludeUid: string
): Promise<string[]> {
  const membersSnap = await getDocs(
    query(collection(db, 'vendorMembers'), where('vendorId', '==', vendorId))
  );
  if (membersSnap.empty) return [];

  const tokens: string[] = [];
  await Promise.all(
    membersSnap.docs
      .map((d) => d.data().userId as string)
      .filter((uid) => uid !== excludeUid)
      .map(async (uid) => {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          const token = userSnap.data().fcmToken as string | undefined | null;
          if (token) tokens.push(token);
        }
      })
  );
  return tokens;
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

  const memberRef = doc(db, 'vendorMembers', userId);
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

  const memberRef = doc(db, 'vendorMembers', userId);
  await setDoc(memberRef, {
    vendorId,
    userId,
    role: 'member',
    joinedAt: serverTimestamp(),
  });
}

export interface VendorMemberWithUser {
  id: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date | null;
  name: string;
  email: string;
}

/**
 * Fetches all members of a given vendor, including their user profiles.
 */
export async function getVendorMembers(vendorId: string): Promise<VendorMemberWithUser[]> {
  const membersQuery = query(collection(db, 'vendorMembers'), where('vendorId', '==', vendorId));
  const membersSnap = await getDocs(membersQuery);
  if (membersSnap.empty) return [];

  const members: VendorMemberWithUser[] = [];
  
  for (const docSnap of membersSnap.docs) {
    const data = docSnap.data();
    const userId = data.userId;
    let name = 'Unknown';
    let email = '';
    
    // Fetch user profile
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      name = userData.name || userData.displayName || 'Unknown';
      email = userData.email || '';
    }

    members.push({
      id: docSnap.id,
      userId,
      role: data.role as 'admin' | 'member',
      joinedAt: toDate(data.joinedAt),
      name,
      email,
    });
  }
  
  // Sort admins first, then by name
  return members.sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Category API ─────────────────────────────────────────────────────────────

const SEED_CATEGORIES = [
  { name: 'Belanja', description: 'Kebutuhan belanja sehari-hari' },
  { name: 'Obat', description: 'Pembelian obat dan keperluan kesehatan' },
  { name: 'Nabung', description: 'Tabungan rutin' },
  { name: 'Les', description: 'Biaya les atau kursus' },
  { name: 'Jajan', description: 'Jajan dan makanan ringan' },
  { name: 'Laundry', description: 'Biaya laundry' },
  { name: 'Bensin', description: 'Biaya bahan bakar kendaraan' },
  { name: 'Internet', description: 'Tagihan internet' },
  { name: 'Air', description: 'Tagihan air' },
  { name: 'Kos', description: 'Biaya kos / sewa tempat tinggal' },
];

/**
 * Fetches all categories for a given vendor, ordered by name.
 */
export async function getCategories(vendorId: string): Promise<Category[]> {
  const q = query(
    collection(db, 'categories'),
    where('vendorId', '==', vendorId),
    orderBy('name', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      vendorId: data.vendorId,
      name: data.name as string,
      description: data.description as string,
      created_by: data.created_by as string,
      created_at: toDate(data.created_at),
    };
  });
}

/**
 * Seeds the 10 default categories for a vendor if none exist yet.
 * Safe to call multiple times — no-op if categories already exist.
 */
export async function seedCategories(vendorId: string, createdBy: string): Promise<void> {
  const q = query(collection(db, 'categories'), where('vendorId', '==', vendorId), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) return; // already seeded

  const batch = writeBatch(db);
  for (const cat of SEED_CATEGORIES) {
    const catRef = doc(collection(db, 'categories'));
    batch.set(catRef, {
      vendorId,
      name: cat.name,
      description: cat.description,
      created_by: createdBy,
      created_at: serverTimestamp(),
    });
  }
  await batch.commit();
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
  createdBy: string,
  createdByName?: string | null,
  categoryRef?: DocumentReference | null,
  categoryName?: string | null
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
      createdByName: createdByName ?? null,
      createdAt: serverTimestamp(),
      categoryRef: categoryRef ?? null,
      categoryName: categoryName ?? null,
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
        where('period', '==', period),
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
      categoryName: data.categoryName ?? null,
    };
  });

  return { totalIn, totalOut, currentBalance, recentTransactions };
}

// ─── Cash-In Paginated Query ──────────────────────────────────────────────────

/**
 * Fetches a paginated page of IN transactions for the given vendor + period.
 * Pass `cursor` (the last document from the previous page) to get the next page.
 */
export async function getCashInTransactions(
  vendorId: string,
  year: number,
  pageSize: number,
  cursor?: TransactionCursor
): Promise<TransactionPage> {
  const constraints: QueryConstraint[] = [
    where('vendorId', '==', vendorId),
    where('type', '==', 'IN'),
    where('year', '==', year),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  ];

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(collection(db, 'transactions'), ...constraints);
  const snap = await getDocs(q);

  const transactions: Transaction[] = snap.docs.map((d) => {
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
      createdByName: data.createdByName ?? null,
      createdAt: toDate(data.createdAt),
    };
  });

  const lastDoc: TransactionCursor =
    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    transactions,
    cursor: lastDoc,
    hasMore: snap.docs.length === pageSize,
  };
}

/**
 * Fetches a paginated page of OUT transactions for the given vendor + period.
 * Pass `cursor` (the last document from the previous page) to get the next page.
 */
export async function getCashOutTransactions(
  vendorId: string,
  period: string,
  pageSize: number,
  cursor?: TransactionCursor
): Promise<TransactionPage> {
  const constraints: QueryConstraint[] = [
    where('vendorId', '==', vendorId),
    where('type', '==', 'OUT'),
    where('period', '==', period),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  ];

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(collection(db, 'transactions'), ...constraints);
  const snap = await getDocs(q);

  const transactions: Transaction[] = snap.docs.map((d) => {
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
      createdByName: data.createdByName ?? null,
      createdAt: toDate(data.createdAt),
      categoryName: data.categoryName ?? null,
    };
  });

  const lastDoc: TransactionCursor =
    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    transactions,
    cursor: lastDoc,
    hasMore: snap.docs.length === pageSize,
  };
}

/**
 * Fetches report data for a specific vendor and period.
 */
export async function getReportData(
  vendorId: string,
  year: number,
  month: number
): Promise<ReportData> {
  const period = periodKey(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [periodSnap, balSnap, prevBalSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'transactions'),
        where('vendorId', '==', vendorId),
        where('period', '==', period)
      )
    ),
    getDoc(doc(db, 'periodBalances', balanceDocId(vendorId, year, month))),
    getDoc(doc(db, 'periodBalances', balanceDocId(vendorId, prevYear, prevMonth))),
  ]);

  let totalIn = 0;
  let totalOut = 0;
  periodSnap.forEach((d) => {
    const data = d.data();
    if (data.type === 'IN') totalIn += data.amount as number;
    else totalOut += data.amount as number;
  });

  const finalBalance = balSnap.exists() ? (balSnap.data().balance as number) : 0;
  const initialBalance = prevBalSnap.exists() ? (prevBalSnap.data().balance as number) : 0;

  return { initialBalance, totalIn, totalOut, finalBalance };
}

// ─── Single Transaction API ───────────────────────────────────────────────────

/**
 * Fetches a single transaction document by ID.
 */
export async function getTransaction(
  transactionId: string
): Promise<Transaction | null> {
  const snap = await getDoc(doc(db, 'transactions', transactionId));
  if (!snap.exists()) return null;
  const data = snap.data();
  // categoryRef is stored as a DocumentReference; extract its ID for the UI
  const categoryRef = data.categoryRef as DocumentReference | null | undefined;
  return {
    id: snap.id,
    vendorId: data.vendorId,
    type: data.type as 'IN' | 'OUT',
    amount: data.amount as number,
    period: data.period,
    year: data.year,
    month: data.month,
    note: data.note,
    createdBy: data.createdBy,
    createdByName: data.createdByName ?? null,
    createdAt: toDate(data.createdAt),
    categoryId: categoryRef?.id ?? data.categoryId ?? null,
    categoryName: data.categoryName ?? null,
  };
}

/**
 * Atomically updates a cash-out transaction's amount and/or note,
 * and adjusts the period balance by the difference.
 *
 * selisih = oldAmount - newAmount
 * - If selisih > 0 (decreased): add back to balance (periodBalance += selisih)
 * - If selisih < 0 (increased): subtract more from balance (periodBalance -= |selisih|)
 */
export async function updateCashOutTransaction(
  transactionId: string,
  vendorId: string,
  year: number,
  month: number,
  oldAmount: number,
  newAmount: number,
  note: string,
  categoryRef?: DocumentReference | null,
  categoryName?: string | null
): Promise<void> {
  const txRef = doc(db, 'transactions', transactionId);
  const balRef = doc(db, 'periodBalances', balanceDocId(vendorId, year, month));

  await runTransaction(db, async (txn) => {
    const balSnap = await txn.get(balRef);
    const currentBalance = balSnap.exists() ? (balSnap.data().balance as number) : 0;

    // selisih = saldo lama - saldo baru
    const selisih = oldAmount - newAmount;
    // selisih > 0  → amount decreased → balance goes up
    // selisih < 0  → amount increased → balance goes down
    const newBalance = currentBalance + selisih;

    txn.set(balRef, { vendorId, year, month, balance: newBalance }, { merge: true });
    txn.update(txRef, {
      amount: newAmount,
      note: note.trim(),
      categoryRef: categoryRef ?? null,
      categoryName: categoryName ?? null,
    });
  });
}

/**
 * Atomically deletes a cash-out transaction document and restores the
 * period balance (adds back the transaction amount).
 */
export async function deleteCashOutTransaction(
  transactionId: string,
  vendorId: string,
  year: number,
  month: number,
  amount: number
): Promise<void> {
  const txRef = doc(db, 'transactions', transactionId);
  const balRef = doc(db, 'periodBalances', balanceDocId(vendorId, year, month));

  const batch = writeBatch(db);

  // Read current balance first (outside batch — we need the value)
  const balSnap = await getDoc(balRef);
  const currentBalance = balSnap.exists() ? (balSnap.data().balance as number) : 0;
  const newBalance = currentBalance + amount; // restore the OUT amount

  batch.set(balRef, { vendorId, year, month, balance: newBalance }, { merge: true });
  batch.delete(txRef);

  await batch.commit();
}
