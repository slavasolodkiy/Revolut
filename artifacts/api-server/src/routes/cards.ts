import { Router, type IRouter } from "express";
import { db, cardsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { IssueCardBody, GetCardParams, UpdateCardParams, UpdateCardBody } from "@workspace/api-zod";

const router: IRouter = Router();

function toCard(c: typeof cardsTable.$inferSelect) {
  return {
    cardId: c.id,
    userId: c.userId,
    accountId: c.accountId,
    cardType: c.cardType,
    cardNetwork: c.cardNetwork,
    lastFour: c.lastFour,
    expiryMonth: c.expiryMonth,
    expiryYear: c.expiryYear,
    cardholderName: c.cardholderName,
    status: c.status,
    spendingLimit: c.spendingLimit ? Number(c.spendingLimit) : undefined,
    currency: c.currency,
    color: c.color,
    createdAt: c.createdAt,
  };
}

router.get("/cards", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, user.id));
  res.json(cards.map(toCard));
});

router.post("/cards", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = IssueCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { accountId, cardType, cardNetwork, spendingLimit } = parsed.data;

  const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
  const now = new Date();
  const expiryYear = now.getFullYear() + 3;
  const expiryMonth = now.getMonth() + 1;

  const [card] = await db
    .insert(cardsTable)
    .values({
      userId: user.id,
      accountId,
      cardType: cardType as "virtual" | "physical",
      cardNetwork: cardNetwork as "visa" | "mastercard",
      lastFour,
      expiryMonth,
      expiryYear,
      cardholderName: `${user.firstName} ${user.lastName}`.toUpperCase(),
      status: "active",
      spendingLimit: spendingLimit?.toString(),
      currency: "GBP",
      color: ["#1e1b4b", "#0f172a", "#064e3b"][Math.floor(Math.random() * 3)],
    })
    .returning();

  res.status(201).json(toCard(card));
});

router.get("/cards/:cardId", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = GetCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }
  const [card] = await db.select().from(cardsTable).where(and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.userId, user.id)));
  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }
  res.json(toCard(card));
});

router.patch("/cards/:cardId", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = UpdateCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }
  const parsed = UpdateCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const updates: Partial<typeof cardsTable.$inferInsert> = {};
  if (parsed.data.status) updates.status = parsed.data.status as "active" | "frozen";
  if (parsed.data.spendingLimit !== undefined) updates.spendingLimit = parsed.data.spendingLimit?.toString();

  const [card] = await db
    .update(cardsTable)
    .set(updates)
    .where(and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.userId, user.id)))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }
  res.json(toCard(card));
});

export default router;
