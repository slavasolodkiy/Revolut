import { pgTable, text, uuid, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cardTypeEnum = pgEnum("card_type", ["virtual", "physical"]);
export const cardNetworkEnum = pgEnum("card_network", ["visa", "mastercard"]);
export const cardStatusEnum = pgEnum("card_status", ["active", "frozen", "cancelled", "pending_activation"]);

export const cardsTable = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  accountId: uuid("account_id").notNull(),
  cardType: cardTypeEnum("card_type").notNull(),
  cardNetwork: cardNetworkEnum("card_network").notNull(),
  lastFour: text("last_four").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cardholderName: text("cardholder_name").notNull(),
  status: cardStatusEnum("status").notNull().default("active"),
  spendingLimit: numeric("spending_limit", { precision: 18, scale: 4 }),
  currency: text("currency").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
