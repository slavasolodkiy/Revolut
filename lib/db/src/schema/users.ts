import { pgTable, text, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accountTypeEnum = pgEnum("account_type", ["personal", "business"]);
export const kycStatusEnum = pgEnum("kyc_status", ["not_started", "pending", "in_review", "approved", "rejected"]);
export const onboardingStatusEnum = pgEnum("onboarding_status", ["not_started", "in_progress", "completed"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  countryCode: text("country_code").notNull(),
  accountType: accountTypeEnum("account_type").notNull().default("personal"),
  passwordHash: text("password_hash").notNull(),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("not_started"),
  onboardingStatus: onboardingStatusEnum("onboarding_status").notNull().default("not_started"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true, kycStatus: true, onboardingStatus: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
