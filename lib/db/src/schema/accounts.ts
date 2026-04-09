import { pgTable, text, uuid, timestamp, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accountKindEnum = pgEnum("account_kind", ["current", "savings", "vault", "crypto"]);

export const accountsTable = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  currency: text("currency").notNull(),
  balance: numeric("balance", { precision: 18, scale: 4 }).notNull().default("0"),
  availableBalance: numeric("available_balance", { precision: 18, scale: 4 }).notNull().default("0"),
  accountNumber: text("account_number"),
  sortCode: text("sort_code"),
  iban: text("iban"),
  swift: text("swift"),
  accountType: accountKindEnum("account_type").notNull().default("current"),
  label: text("label"),
  color: text("color"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAccountSchema = createInsertSchema(accountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;
