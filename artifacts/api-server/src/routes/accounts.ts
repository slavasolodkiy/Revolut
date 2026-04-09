import { Router, type IRouter } from "express";
import { db, accountsTable, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { CreateAccountBody, GetAccountParams, GetAccountTransactionsParams, GetAccountTransactionsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function toAccount(a: typeof accountsTable.$inferSelect) {
  return {
    accountId: a.id,
    userId: a.userId,
    currency: a.currency,
    balance: Number(a.balance),
    availableBalance: Number(a.availableBalance),
    accountNumber: a.accountNumber,
    sortCode: a.sortCode,
    iban: a.iban,
    swift: a.swift,
    accountType: a.accountType,
    label: a.label,
    color: a.color,
    isDefault: a.isDefault,
    createdAt: a.createdAt,
  };
}

router.get("/accounts", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id)).orderBy(desc(accountsTable.isDefault), desc(accountsTable.createdAt));
  res.json(accounts.map(toAccount));
});

router.post("/accounts", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { currency, accountType, label } = parsed.data;

  // Generate fake IBAN/SWIFT
  const iban = `GB${Math.random().toString().slice(2, 4)}NOVA${Math.random().toString(36).slice(2, 14).toUpperCase()}`;
  const swift = "NOVAUK2L";

  const [account] = await db
    .insert(accountsTable)
    .values({ userId: user.id, currency, accountType: accountType as "current" | "savings" | "vault", label, iban, swift, balance: "0", availableBalance: "0", color: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"][Math.floor(Math.random() * 4)] })
    .returning();

  res.status(201).json(toAccount(account));
});

router.get("/accounts/:accountId", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = GetAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }
  const [account] = await db.select().from(accountsTable).where(and(eq(accountsTable.id, params.data.accountId), eq(accountsTable.userId, user.id)));
  if (!account) {
    res.status(404).json({ error: "Not found", message: "Account not found" });
    return;
  }
  res.json(toAccount(account));
});

router.get("/accounts/:accountId/transactions", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = GetAccountTransactionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }
  const query = GetAccountTransactionsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = query.success ? (query.data.offset ?? 0) : 0;

  const [account] = await db.select().from(accountsTable).where(and(eq(accountsTable.id, params.data.accountId), eq(accountsTable.userId, user.id)));
  if (!account) {
    res.status(404).json({ error: "Not found", message: "Account not found" });
    return;
  }

  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.accountId, params.data.accountId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const total = txs.length;
  res.json({
    transactions: txs.map(t => ({
      transactionId: t.id,
      accountId: t.accountId,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      description: t.description,
      merchantName: t.merchantName,
      merchantCategory: t.merchantCategory,
      status: t.status,
      createdAt: t.createdAt,
      counterpartyName: t.counterpartyName,
      reference: t.reference,
    })),
    total,
    offset,
    limit,
  });
});

export default router;
