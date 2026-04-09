/**
 * Onboarding API quality gates — Sprint 2
 *
 * Test coverage:
 *   1. Auth required — 401 on all protected endpoints without token
 *   2. Ownership isolation — 403 when accessing another user's session
 *   3. Branching engine — non-linear step transitions
 *      - personal + country=US  → us_ssn (not employment_status)
 *      - personal + employment_status=self_employed → business_income (not income_source)
 *      - business + business_type=sole_trader → director_details (skips company_docs)
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { resolveNextStepId, personalSteps, businessSteps } from "../routes/onboarding.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser1 = {
  id: "user-aaa-1",
  email: "alice@novapay.example.com",
  firstName: "Alice",
  lastName: "Smith",
  countryCode: "GB",
  accountType: "personal" as const,
  passwordHash: "hash",
  phone: null,
  kycStatus: "pending" as const,
  onboardingStatus: "not_started" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser2 = {
  ...mockUser1,
  id: "user-bbb-2",
  email: "bob@novapay.example.com",
};

const mockSession = {
  id: "session-111",
  userId: "user-aaa-1",
  type: "personal" as const,
  countryCode: "GB",
  currentStepId: "address_country",
  completedSteps: [] as string[],
  answers: {} as Record<string, unknown>,
  status: "in_progress" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// Mocks (hoisted before dynamic app import below)
// ---------------------------------------------------------------------------

vi.mock("@workspace/db", () => {
  const selectChain = {
    from: () => selectChain,
    where: async () => [{ ...mockSession }],
  };
  const insertChain = {
    values: () => ({ returning: async () => [{ ...mockSession }] }),
  };
  const updateChain = {
    set: () => updateChain,
    where: () => ({ returning: async () => [{ ...mockSession }] }),
  };
  return {
    db: {
      select: () => selectChain,
      insert: () => insertChain,
      update: () => updateChain,
    },
    onboardingSessionsTable: {},
    usersTable: {},
    sessionsTable: {},
  };
});

vi.mock("../lib/auth.js", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    requireAuth: vi.fn(async (req: any, res: any, next: any) => {
      const header = req.headers.authorization ?? "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";
      if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
      if (token === "tok-user1") { req.user = mockUser1; next(); return; }
      if (token === "tok-user2") { req.user = mockUser2; next(); return; }
      res.status(401).json({ error: "Unauthorized" });
    }),
  };
});

// ---------------------------------------------------------------------------
// Load express app AFTER mocks are registered
// ---------------------------------------------------------------------------

let app: Express;
beforeAll(async () => {
  const mod = await import("../app.js");
  app = mod.default;
});

// ---------------------------------------------------------------------------
// 1. Auth required — 401 without token
// ---------------------------------------------------------------------------

describe("onboarding auth required", () => {
  it("POST /api/onboarding/start → 401 without token", async () => {
    const res = await request(app)
      .post("/api/onboarding/start")
      .send({ type: "personal", countryCode: "GB" });
    expect(res.status).toBe(401);
  });

  it("GET /api/onboarding/session/:id → 401 without token", async () => {
    const res = await request(app).get("/api/onboarding/session/session-111");
    expect(res.status).toBe(401);
  });

  it("POST /api/onboarding/session/:id/step → 401 without token", async () => {
    const res = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .send({ stepId: "welcome", answer: null });
    expect(res.status).toBe(401);
  });

  it("GET /api/onboarding/status → 401 without token", async () => {
    const res = await request(app).get("/api/onboarding/status");
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 2. Ownership isolation — 403 when user2 accesses user1's session
// ---------------------------------------------------------------------------

describe("onboarding ownership isolation", () => {
  it("GET /api/onboarding/session/:id → 403 for wrong user", async () => {
    const res = await request(app)
      .get("/api/onboarding/session/session-111")
      .set("Authorization", "Bearer tok-user2");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("POST /api/onboarding/session/:id/step → 403 for wrong user", async () => {
    const res = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user2")
      .send({ stepId: "welcome", answer: null });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("GET /api/onboarding/session/:id → 200 for correct owner", async () => {
    const res = await request(app)
      .get("/api/onboarding/session/session-111")
      .set("Authorization", "Bearer tok-user1");
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe("session-111");
  });
});

// ---------------------------------------------------------------------------
// 3. Branching engine — US country branch
// ---------------------------------------------------------------------------

describe("branching engine — US country branch", () => {
  it("personal: country=US → us_ssn (not employment_status)", () => {
    expect(resolveNextStepId(personalSteps, "address_country", "US")).toBe("us_ssn");
  });

  it("personal: country=GB → employment_status (skips us_ssn)", () => {
    expect(resolveNextStepId(personalSteps, "address_country", "GB")).toBe("employment_status");
  });

  it("personal: country=DE → employment_status (skips us_ssn)", () => {
    expect(resolveNextStepId(personalSteps, "address_country", "DE")).toBe("employment_status");
  });

  it("personal: after us_ssn → employment_status (explicit default)", () => {
    expect(resolveNextStepId(personalSteps, "us_ssn", "123-45-6789")).toBe("employment_status");
  });
});

// ---------------------------------------------------------------------------
// 4. Branching engine — self-employed branch
// ---------------------------------------------------------------------------

describe("branching engine — self-employed branch", () => {
  it("personal: employment=self_employed → business_income (not income_source)", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "self_employed")).toBe("business_income");
  });

  it("personal: employment=employed → income_source (skips business_income)", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "employed")).toBe("income_source");
  });

  it("personal: employment=student → income_source", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "student")).toBe("income_source");
  });

  it("personal: employment=retired → income_source", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "retired")).toBe("income_source");
  });

  it("personal: after business_income → income_source (merges back)", () => {
    expect(resolveNextStepId(personalSteps, "business_income", "Freelance dev, £60k/yr")).toBe("income_source");
  });
});

// ---------------------------------------------------------------------------
// 5. Branching engine — sole trader skips company_docs
// ---------------------------------------------------------------------------

describe("branching engine — sole trader skips company_docs", () => {
  it("business: type=sole_trader → director_details (skips company_docs)", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "sole_trader")).toBe("director_details");
  });

  it("business: type=ltd → business_country (linear; company_docs comes later)", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "ltd")).toBe("business_country");
  });

  it("business: type=partnership → business_country (linear)", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "partnership")).toBe("business_country");
  });

  it("business: type=nonprofit → business_country (linear)", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "nonprofit")).toBe("business_country");
  });
});

// ---------------------------------------------------------------------------
// 6. Branching engine — terminal step handling
// ---------------------------------------------------------------------------

describe("branching engine — terminal steps", () => {
  it("personal: review step → 'completed'", () => {
    expect(resolveNextStepId(personalSteps, "review", null)).toBe("completed");
  });

  it("business: review step → 'completed'", () => {
    expect(resolveNextStepId(businessSteps, "review", null)).toBe("completed");
  });

  it("unknown stepId → 'completed'", () => {
    expect(resolveNextStepId(personalSteps, "nonexistent_step", null)).toBe("completed");
  });
});
