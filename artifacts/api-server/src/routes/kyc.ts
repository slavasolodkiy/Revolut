import { Router, type IRouter } from "express";
import { db, kycChecksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { SubmitKycDocumentBody } from "@workspace/api-zod";

const router: IRouter = Router();

function computeOverallStatus(checks: (typeof kycChecksTable.$inferSelect)[]): string {
  if (checks.length === 0) return "not_started";
  if (checks.every(c => c.status === "passed")) return "approved";
  if (checks.some(c => c.status === "failed")) return "rejected";
  if (checks.some(c => c.status === "in_review" || c.status === "pending")) return "in_review";
  return "pending";
}

function getCheckStatus(checks: (typeof kycChecksTable.$inferSelect)[], type: string): string {
  const check = checks.find(c => c.checkType === type);
  if (!check) return "not_started";
  const map: Record<string, string> = { pending: "pending", in_review: "in_review", passed: "approved", failed: "rejected" };
  return map[check.status] || "not_started";
}

router.get("/kyc/status", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const checks = await db.select().from(kycChecksTable).where(eq(kycChecksTable.userId, user.id));
  const submitted = checks[0]?.createdAt;
  const completed = checks.find(c => c.status === "passed" || c.status === "failed")?.updatedAt;

  res.json({
    userId: user.id,
    overallStatus: computeOverallStatus(checks),
    identityStatus: getCheckStatus(checks, "identity"),
    addressStatus: getCheckStatus(checks, "address"),
    livenessStatus: getCheckStatus(checks, "liveness"),
    submittedAt: submitted,
    completedAt: completed,
  });
});

router.post("/kyc/submit", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = SubmitKycDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { documentType, documentFront, documentBack, selfieImage } = parsed.data;

  // Create identity check
  await db.insert(kycChecksTable).values({
    userId: user.id,
    checkType: "identity",
    status: "in_review",
    documentType: documentType as "passport" | "national_id" | "drivers_license",
    documentFrontUrl: documentFront,
    documentBackUrl: documentBack,
  });

  // Create address check
  await db.insert(kycChecksTable).values({ userId: user.id, checkType: "address", status: "in_review" });

  // Create liveness check if selfie provided
  if (selfieImage) {
    await db.insert(kycChecksTable).values({ userId: user.id, checkType: "liveness", status: "in_review", selfieUrl: selfieImage });
  }

  // Update user KYC status
  await db.update(usersTable).set({ kycStatus: "in_review" }).where(eq(usersTable.id, user.id));

  const checks = await db.select().from(kycChecksTable).where(eq(kycChecksTable.userId, user.id));
  res.status(202).json({
    userId: user.id,
    overallStatus: "in_review",
    identityStatus: getCheckStatus(checks, "identity"),
    addressStatus: getCheckStatus(checks, "address"),
    livenessStatus: getCheckStatus(checks, "liveness"),
    submittedAt: new Date(),
  });
});

router.get("/kyc/checks", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const checks = await db.select().from(kycChecksTable).where(eq(kycChecksTable.userId, user.id));
  res.json(checks.map(c => ({
    checkId: c.id,
    checkType: c.checkType,
    status: c.status,
    result: c.result,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  })));
});

export default router;
