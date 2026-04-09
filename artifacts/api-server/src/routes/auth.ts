import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, requireAuth, type AuthRequest } from "../lib/auth";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { email, phone, firstName, lastName, countryCode, accountType, passcode } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Conflict", message: "Email already registered" });
    return;
  }

  const passwordHash = hashPassword(passcode);
  const [user] = await db
    .insert(usersTable)
    .values({ email, phone, firstName, lastName, countryCode, accountType: accountType as "personal" | "business", passwordHash })
    .returning();

  const sessionToken = await createSession(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      countryCode: user.countryCode,
      accountType: user.accountType,
      kycStatus: user.kycStatus,
      onboardingStatus: user.onboardingStatus,
      createdAt: user.createdAt,
    },
    sessionToken,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { email, passcode } = parsed.data;
  const passwordHash = hashPassword(passcode);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== passwordHash) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const sessionToken = await createSession(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      countryCode: user.countryCode,
      accountType: user.accountType,
      kycStatus: user.kycStatus,
      onboardingStatus: user.onboardingStatus,
      createdAt: user.createdAt,
    },
    sessionToken,
  });
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  res.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    countryCode: user.countryCode,
    accountType: user.accountType,
    kycStatus: user.kycStatus,
    onboardingStatus: user.onboardingStatus,
    createdAt: user.createdAt,
  });
});

export default router;
