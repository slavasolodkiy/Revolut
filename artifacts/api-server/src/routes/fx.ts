import { Router, type IRouter } from "express";
import { db, accountsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { ConvertCurrencyBody, GetFxRatesQueryParams, GetFxHistoryQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// Simulated real-ish exchange rates vs USD
const BASE_RATES: Record<string, number> = {
  USD: 1, EUR: 0.921, GBP: 0.786, JPY: 149.2, CHF: 0.899,
  CAD: 1.362, AUD: 1.534, NZD: 1.631, SGD: 1.342, HKD: 7.822,
  NOK: 10.56, SEK: 10.43, DKK: 6.87, PLN: 4.05, CZK: 23.1,
  HUF: 355.2, RON: 4.59, BGN: 1.800, HRK: 7.095, TRY: 32.15,
  INR: 83.12, CNY: 7.24, KRW: 1325.0, MXN: 17.15, BRL: 4.97,
  ZAR: 18.63, NGN: 1580.0, AED: 3.673, SAR: 3.751, ILS: 3.71,
};

function getRateVsBase(from: string, to: string): number {
  const fromRate = BASE_RATES[from] || 1;
  const toRate = BASE_RATES[to] || 1;
  return toRate / fromRate;
}

router.get("/fx/rates", async (req, res): Promise<void> => {
  const query = GetFxRatesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Validation error", message: query.error.message });
    return;
  }

  const { base, targets } = query.data;
  const targetList = targets ? targets.split(",").map(s => s.trim().toUpperCase()) : Object.keys(BASE_RATES);
  const rates: Record<string, number> = {};
  for (const currency of targetList) {
    if (currency !== base) {
      rates[currency] = Number(getRateVsBase(base, currency).toFixed(6));
    }
  }

  res.json({ base, rates, timestamp: new Date() });
});

router.post("/fx/convert", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = ConvertCurrencyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { fromCurrency, toCurrency, amount, fromAccountId, execute } = parsed.data;
  const rate = getRateVsBase(fromCurrency, toCurrency);
  const toAmount = Number((amount * rate).toFixed(4));
  const fee = Number((amount * 0.005).toFixed(4)); // 0.5% fee

  let transactionId: string | undefined;
  if (execute && fromAccountId) {
    const [account] = await db.select().from(accountsTable).where(and(eq(accountsTable.id, fromAccountId), eq(accountsTable.userId, user.id)));
    if (account && Number(account.balance) >= amount) {
      await db.update(accountsTable).set({ balance: (Number(account.balance) - amount - fee).toFixed(4) }).where(eq(accountsTable.id, fromAccountId));
      const [tx] = await db.insert(transactionsTable).values({
        accountId: fromAccountId,
        type: "fx_exchange",
        amount: (-amount).toString(),
        currency: fromCurrency,
        description: `FX Exchange ${fromCurrency} → ${toCurrency}`,
        status: "completed",
      }).returning();
      transactionId = tx.id;
    }
  }

  res.json({ fromCurrency, toCurrency, fromAmount: amount, toAmount, rate: Number(rate.toFixed(6)), fee, executed: !!execute && !!transactionId, transactionId });
});

router.get("/fx/history", async (req, res): Promise<void> => {
  const query = GetFxHistoryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Validation error", message: query.error.message });
    return;
  }

  const { from, to, days = 30 } = query.data;
  const baseRate = getRateVsBase(from, to);
  const history = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const jitter = 1 + (Math.sin(i * 0.3) * 0.02) + ((Math.random() - 0.5) * 0.005);
    history.push({
      date: date.toISOString().slice(0, 10),
      rate: Number((baseRate * jitter).toFixed(6)),
    });
  }

  res.json(history);
});

export default router;
