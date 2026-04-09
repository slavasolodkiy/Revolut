import { pgTable, text, uuid, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit", "transfer", "fx_exchange", "card_payment", "atm", "refund", "topup"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "reversed"]);

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 4 }).notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  merchantName: text("merchant_name"),
  merchantCategory: text("merchant_category"),
  status: transactionStatusEnum("status").notNull().default("completed"),
  counterpartyName: text("counterparty_name"),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
