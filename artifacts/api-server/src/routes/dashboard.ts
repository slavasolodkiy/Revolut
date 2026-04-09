import { Router, type IRouter } from "express";
import { db, accountsTable, transactionsTable, paymentsTable, notificationsTable, cardsTable } from "@workspace/db";
import { eq, and, gte, desc, count, sum } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f59e0b",
  "Shopping": "#6366f1",
  "Transport": "#10b981",
  "Entertainment": "#ec4899",
  "Health": "#ef4444",
  "Bills & Utilities": "#8b5cf6",
  "Travel": "#06b6d4",
  "Other": "#64748b",
};

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, user.id));
  const pendingPayments = await db.select().from(paymentsTable).where(and(eq(paymentsTable.userId, user.id), eq(paymentsTable.status, "pending")));
  const unreadNotifications = await db.select().from(notificationsTable).where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));

  const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const monthlyTxs = await db
    .select()
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.accountId, defaultAccount?.id || ""),
      gte(transactionsTable.createdAt, startOfMonth),
    ));

  const monthlySpend = monthlyTxs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const monthlyIncome = monthlyTxs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);

  res.json({
    totalBalance: Number(totalBalance.toFixed(2)),
    totalBalanceCurrency: defaultAccount?.currency || "GBP",
    monthlySpend: Number(monthlySpend.toFixed(2)),
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
    accountCount: accounts.length,
    cardCount: cards.length,
    pendingPayments: pendingPayments.length,
    unreadNotifications: unreadNotifications.length,
    kycStatus: user.kycStatus,
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 10) : 10;

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
  const accountIds = accounts.map(a => a.id);

  const allTxs = [];
  for (const accountId of accountIds.slice(0, 3)) {
    const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.accountId, accountId)).orderBy(desc(transactionsTable.createdAt)).limit(5);
    allTxs.push(...txs);
  }

  allTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recent = allTxs.slice(0, limit);

  res.json(recent.map(t => ({
    activityId: t.id,
    type: "transaction",
    title: t.merchantName || t.counterpartyName || t.description || "Transaction",
    description: t.description || t.merchantCategory || "",
    amount: Math.abs(Number(t.amount)),
    currency: t.currency,
    direction: Number(t.amount) > 0 ? "in" : "out",
    iconType: t.type,
    createdAt: t.createdAt,
  })));
});

router.get("/dashboard/spending-breakdown", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
  const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];
  if (!defaultAccount) {
    res.json([]);
    return;
  }

  const txs = await db
    .select()
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.accountId, defaultAccount.id),
      gte(transactionsTable.createdAt, startOfMonth),
    ));

  const debits = txs.filter(t => Number(t.amount) < 0);
  const grouped: Record<string, number> = {};
  for (const t of debits) {
    const cat = t.merchantCategory || "Other";
    grouped[cat] = (grouped[cat] || 0) + Math.abs(Number(t.amount));
  }

  const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
  const result = Object.entries(grouped).map(([category, amount]) => ({
    category,
    amount: Number(amount.toFixed(2)),
    currency: defaultAccount.currency,
    percentage: Number(((amount / total) * 100).toFixed(1)),
    color: CATEGORY_COLORS[category] || "#64748b",
    transactionCount: debits.filter(t => (t.merchantCategory || "Other") === category).length,
  }));

  result.sort((a, b) => b.amount - a.amount);
  res.json(result);
});

export default router;
