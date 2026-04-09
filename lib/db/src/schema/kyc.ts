import { pgTable, text, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kycCheckTypeEnum = pgEnum("kyc_check_type", ["identity", "address", "liveness", "sanctions", "pep"]);
export const kycCheckStatusEnum = pgEnum("kyc_check_status", ["pending", "in_review", "passed", "failed"]);
export const kycDocTypeEnum = pgEnum("kyc_doc_type", ["passport", "national_id", "drivers_license", "utility_bill", "bank_statement", "company_registration"]);

export const kycChecksTable = pgTable("kyc_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  checkType: kycCheckTypeEnum("check_type").notNull(),
  status: kycCheckStatusEnum("status").notNull().default("pending"),
  result: text("result"),
  documentType: kycDocTypeEnum("document_type"),
  documentFrontUrl: text("document_front_url"),
  documentBackUrl: text("document_back_url"),
  selfieUrl: text("selfie_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertKycCheckSchema = createInsertSchema(kycChecksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKycCheck = z.infer<typeof insertKycCheckSchema>;
export type KycCheck = typeof kycChecksTable.$inferSelect;
