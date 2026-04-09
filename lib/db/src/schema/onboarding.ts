import { pgTable, text, uuid, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onboardingTypeEnum = pgEnum("onboarding_type", ["personal", "business"]);
export const sessionStatusEnum = pgEnum("session_status", ["in_progress", "completed", "abandoned"]);

export const onboardingSessionsTable = pgTable("onboarding_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  type: onboardingTypeEnum("type").notNull(),
  countryCode: text("country_code").notNull(),
  currentStepId: text("current_step_id").notNull().default("welcome"),
  completedSteps: text("completed_steps").array().notNull().default([]),
  answers: jsonb("answers").notNull().default({}),
  status: sessionStatusEnum("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOnboardingSessionSchema = createInsertSchema(onboardingSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOnboardingSession = z.infer<typeof insertOnboardingSessionSchema>;
export type OnboardingSession = typeof onboardingSessionsTable.$inferSelect;
