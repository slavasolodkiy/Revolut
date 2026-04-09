import { Router, type IRouter } from "express";
import { db, paymentsTable, accountsTable, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { InitiatePaymentBody, ListPaymentsQueryParams, GetPaymentParams } from "@workspace/api-zod";

const router: IRouter = Router();

function toPayment(p: typeof paymentsTable.$inferSelect) {
  return {
    paymentId: p.id,
    userId: p.userId,
    fromAccountId: p.fromAccountId,
    toAccountId: p.toAccountId,
    type: p.type,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    reference: p.reference,
    recipientName: p.recipientName,
    recipientIban: p.recipientIban,
    recipientBic: p.recipientBic,
    scheduledAt: p.scheduledAt,
    completedAt: p.completedAt,
    createdAt: p.createdAt,
  };
}

router.get("/payments", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const query = ListPaymentsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = query.success ? (query.data.offset ?? 0) : 0;

  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, user.id))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ payments: payments.map(toPayment), total: payments.length, offset, limit });
});

router.post("/payments", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { fromAccountId, type, amount, currency, reference, recipientName, recipientIban, recipientBic, toAccountId } = parsed.data;

  const [account] = await db.select().from(accountsTable).where(and(eq(accountsTable.id, fromAccountId), eq(accountsTable.userId, user.id)));
  if (!account) {
    res.status(404).json({ error: "Not found", message: "Source account not found" });
    return;
  }

  if (Number(account.balance) < amount) {
    res.status(422).json({ error: "Insufficient funds", message: "Insufficient balance" });
    return;
  }

  // Deduct balance
  await db
    .update(accountsTable)
    .set({ balance: (Number(account.balance) - amount).toFixed(4), availableBalance: (Number(account.availableBalance) - amount).toFixed(4) })
    .where(eq(accountsTable.id, fromAccountId));

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      userId: user.id,
      fromAccountId,
      toAccountId,
      type: type as "internal_transfer" | "bank_transfer" | "sepa" | "swift" | "instant",
      amount: amount.toString(),
      currency,
      status: "completed",
      reference,
      recipientName,
      recipientIban,
      recipientBic,
      completedAt: new Date(),
    })
    .returning();

  // Create transaction record
  await db.insert(transactionsTable).values({
    accountId: fromAccountId,
    type: "transfer",
    amount: (-amount).toString(),
    currency,
    description: recipientName ? `Transfer to ${recipientName}` : "Transfer",
    status: "completed",
    counterpartyName: recipientName,
    reference,
  });

  res.status(202).json(toPayment(payment));
});

router.get("/payments/:paymentId", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }
  const [payment] = await db.select().from(paymentsTable).where(and(eq(paymentsTable.id, params.data.paymentId), eq(paymentsTable.userId, user.id)));
  if (!payment) {
    res.status(404).json({ error: "Not found", message: "Payment not found" });
    return;
  }
  res.json(toPayment(payment));
});

export default router;
