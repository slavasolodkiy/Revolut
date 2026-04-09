import { pgTable, text, uuid, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentTypeEnum = pgEnum("payment_type", ["internal_transfer", "bank_transfer", "sepa", "swift", "instant", "scheduled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "cancelled"]);

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  fromAccountId: uuid("from_account_id").notNull(),
  toAccountId: uuid("to_account_id"),
  type: paymentTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 4 }).notNull(),
  currency: text("currency").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  reference: text("reference"),
  recipientName: text("recipient_name"),
  recipientIban: text("recipient_iban"),
  recipientBic: text("recipient_bic"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
