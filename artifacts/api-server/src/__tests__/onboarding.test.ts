/**
 * Onboarding API quality gates — Sprint 2 + Sprint 3
 *
 * Sections:
 *   1. Auth required            — 401 on every protected endpoint without a token
 *   2. Ownership isolation      — 403 when a different user accesses the session
 *   3. Integrity guards (new)   — INVALID_STEP_ID (400), STEP_OUT_OF_ORDER (409),
 *                                 SESSION_COMPLETED (409)
 *   4. Branching engine         — US, self-employed, sole-trader, terminal steps
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { resolveNextStepId, personalSteps, businessSteps } from "../routes/onboarding.js";

// ---------------------------------------------------------------------------
// Mutable session state — tests can override this per-case
// ---------------------------------------------------------------------------

const baseSession = {
  id: "session-111",
  userId: "user-aaa-1",
  type: "personal" as "personal" | "business",
  countryCode: "GB",
  currentStepId: "address_country",
  completedSteps: [] as string[],
  answers: {} as Record<string, unknown>,
  status: "in_progress" as "in_progress" | "completed" | "abandoned",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// The mock DB reads from this at call time, so tests can mutate it
let sessionState = { ...baseSession };

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

const mockUser2 = { ...mockUser1, id: "user-bbb-2", email: "bob@novapay.example.com" };

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@workspace/db", () => {
  const selectChain = {
    from: () => selectChain,
    // Read sessionState at call time so tests can mutate it
    where: async () => [{ ...sessionState }],
  };
  const insertChain = {
    values: () => ({ returning: async () => [{ ...sessionState }] }),
  };
  const updateChain = {
    set: () => updateChain,
    where: () => ({ returning: async () => [{ ...sessionState }] }),
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
// Load app after mocks
// ---------------------------------------------------------------------------

let app: Express;
beforeAll(async () => {
  const mod = await import("../app.js");
  app = mod.default;
});

// Reset session state before each test so tests are independent
beforeEach(() => {
  sessionState = { ...baseSession };
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
// 2. Ownership isolation
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
      .send({ stepId: "address_country", answer: "GB" });
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
// 3. Integrity guards
// ---------------------------------------------------------------------------

describe("onboarding integrity — INVALID_STEP_ID", () => {
  it("submitting a non-existent stepId → 400 INVALID_STEP_ID", async () => {
    // session is at address_country; submit a step that doesn't exist at all
    const res = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user1")
      .send({ stepId: "totally_made_up_step", answer: "GB" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_STEP_ID");
    expect(res.body.message).toContain("totally_made_up_step");
  });

  it("jumping to 'review' before reaching it → exact 409 STEP_OUT_OF_ORDER", async () => {
    // "review" is a valid step (not caught by INVALID_STEP_ID) but session is at
    // "address_country", so it must be rejected as STEP_OUT_OF_ORDER, not 400.
    const res = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user1")
      .send({ stepId: "review", answer: null });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("STEP_OUT_OF_ORDER");
  });
});

describe("onboarding integrity — STEP_OUT_OF_ORDER", () => {
  it("submitting wrong (but valid) stepId → 409 STEP_OUT_OF_ORDER", async () => {
    // session.currentStepId = "address_country"; submit "employment_status"
    const res = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user1")
      .send({ stepId: "employment_status", answer: "employed" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("STEP_OUT_OF_ORDER");
    expect(res.body.message).toContain("address_country");
    expect(res.body.message).toContain("employment_status");
  });

  it("submitting the correct stepId → 200 (sanity check)", async () => {
    // address_country is the current step — submitting it should succeed
    const res = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user1")
      .send({ stepId: "address_country", answer: "GB" });
    expect(res.status).toBe(200);
  });

  it("re-submitting a step after transition → 409 STEP_OUT_OF_ORDER", async () => {
    // Round 1: submit the current step — must succeed
    const res1 = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user1")
      .send({ stepId: "address_country", answer: "GB" });
    expect(res1.status).toBe(200);

    // Advance mock session state as the DB would after accepting the step
    sessionState = {
      ...sessionState,
      currentStepId: "employment_status",
      completedSteps: ["address_country"],
    };

    // Round 2: re-submit the stale step — must be rejected because the session
    // has advanced; the client must always use the step the server sends back
    const res2 = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user1")
      .send({ stepId: "address_country", answer: "GB" });
    expect(res2.status).toBe(409);
    expect(res2.body.error).toBe("STEP_OUT_OF_ORDER");
  });
});

describe("onboarding integrity — SESSION_COMPLETED", () => {
  it("submitting a step on a completed session → 409 SESSION_COMPLETED", async () => {
    sessionState = { ...baseSession, status: "completed", currentStepId: "completed" };
    const res = await request(app)
      .post("/api/onboarding/session/session-111/step")
      .set("Authorization", "Bearer tok-user1")
      .send({ stepId: "welcome", answer: null });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("SESSION_COMPLETED");
  });

  it("GET session still works on a completed session (read-only)", async () => {
    sessionState = { ...baseSession, status: "completed" };
    const res = await request(app)
      .get("/api/onboarding/session/session-111")
      .set("Authorization", "Bearer tok-user1");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// 4. Branching engine — pure unit tests (no HTTP)
// ---------------------------------------------------------------------------

describe("branching engine — US country branch", () => {
  it("personal: country=US → us_ssn (not employment_status)", () => {
    expect(resolveNextStepId(personalSteps, "address_country", "US")).toBe("us_ssn");
  });
  it("personal: country=GB → employment_status (skips us_ssn)", () => {
    expect(resolveNextStepId(personalSteps, "address_country", "GB")).toBe("employment_status");
  });
  it("personal: country=DE → employment_status", () => {
    expect(resolveNextStepId(personalSteps, "address_country", "DE")).toBe("employment_status");
  });
  it("personal: after us_ssn → employment_status (explicit default)", () => {
    expect(resolveNextStepId(personalSteps, "us_ssn", "123-45-6789")).toBe("employment_status");
  });
});

describe("branching engine — self-employed branch", () => {
  it("personal: employment=self_employed → business_income", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "self_employed")).toBe("business_income");
  });
  it("personal: employment=employed → income_source", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "employed")).toBe("income_source");
  });
  it("personal: employment=student → income_source", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "student")).toBe("income_source");
  });
  it("personal: employment=retired → income_source", () => {
    expect(resolveNextStepId(personalSteps, "employment_status", "retired")).toBe("income_source");
  });
  it("personal: after business_income → income_source (merges back)", () => {
    expect(resolveNextStepId(personalSteps, "business_income", "Freelance dev")).toBe("income_source");
  });
});

describe("branching engine — sole trader skips company_docs", () => {
  it("business: type=sole_trader → director_details", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "sole_trader")).toBe("director_details");
  });
  it("business: type=ltd → business_country (includes company_docs later)", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "ltd")).toBe("business_country");
  });
  it("business: type=partnership → business_country", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "partnership")).toBe("business_country");
  });
  it("business: type=nonprofit → business_country", () => {
    expect(resolveNextStepId(businessSteps, "business_type", "nonprofit")).toBe("business_country");
  });
});

describe("branching engine — terminal steps", () => {
  it("personal: review → 'completed'", () => {
    expect(resolveNextStepId(personalSteps, "review", null)).toBe("completed");
  });
  it("business: review → 'completed'", () => {
    expect(resolveNextStepId(businessSteps, "review", null)).toBe("completed");
  });
  it("unknown stepId → 'completed'", () => {
    expect(resolveNextStepId(personalSteps, "nonexistent_step", null)).toBe("completed");
  });
});
