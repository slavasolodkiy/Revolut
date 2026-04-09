import { Router, type IRouter } from "express";
import { db, onboardingSessionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { StartOnboardingBody, SubmitOnboardingStepBody, GetOnboardingSessionParams, GetOnboardingStepsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Step definitions
//
// Each step carries an explicit `defaultNextStepId` (null = completed) so the
// branching engine does NOT rely on array position.  Branching rules override
// the default.  This allows non-linear flows without ambiguity.
// ---------------------------------------------------------------------------

export interface BranchRule {
  condition: string;
  nextStepId: string;
}

export interface StepDef {
  stepId: string;
  screenName: string;
  questionText: string;
  questionType: string;
  options: { value: string; label: string }[];
  validationRules: string[];
  requiredDocuments: string[];
  countryConstraints: string[];
  branchingLogic: BranchRule[];
  defaultNextStepId: string | null;
  isRequired: boolean;
  helpText?: string;
}

export const personalSteps: StepDef[] = [
  {
    stepId: "welcome",
    screenName: "Welcome",
    questionText: "Welcome to NovaPay. Let's get you set up.",
    questionType: "info",
    options: [],
    validationRules: [],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "full_name",
    isRequired: false,
    helpText: "This will take about 5 minutes.",
  },
  {
    stepId: "full_name",
    screenName: "Your Name",
    questionText: "What's your full name?",
    questionType: "text",
    options: [],
    validationRules: ["required", "min:2"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "date_of_birth",
    isRequired: true,
    helpText: "Enter your legal name as it appears on your ID.",
  },
  {
    stepId: "date_of_birth",
    screenName: "Date of Birth",
    questionText: "What's your date of birth?",
    questionType: "date",
    options: [],
    validationRules: ["required", "age:18"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "phone_number",
    isRequired: true,
    helpText: "You must be 18 or older to use NovaPay.",
  },
  {
    stepId: "phone_number",
    screenName: "Phone Number",
    questionText: "What's your phone number?",
    questionType: "phone",
    options: [],
    validationRules: ["required", "e164"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "phone_otp",
    isRequired: true,
    helpText: "We'll send a verification code to this number.",
  },
  {
    stepId: "phone_otp",
    screenName: "Verify Phone",
    questionText: "Enter the 6-digit code sent to your phone.",
    questionType: "otp",
    options: [],
    validationRules: ["required", "length:6"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "address_country",
    isRequired: true,
    helpText: "Didn't receive it? Request a new code.",
  },
  {
    stepId: "address_country",
    screenName: "Country of Residence",
    questionText: "Which country do you live in?",
    questionType: "country_picker",
    options: [],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    // US residents must provide SSN; all others skip to employment_status
    branchingLogic: [{ condition: "answer === 'US'", nextStepId: "us_ssn" }],
    defaultNextStepId: "employment_status",
    isRequired: true,
  },
  {
    stepId: "us_ssn",
    screenName: "Social Security Number",
    questionText: "Please enter your Social Security Number (US residents only).",
    questionType: "text",
    options: [],
    validationRules: ["required", "pattern:^\\d{3}-?\\d{2}-?\\d{4}$"],
    requiredDocuments: [],
    countryConstraints: ["US"],
    branchingLogic: [],
    defaultNextStepId: "employment_status",
    isRequired: true,
    helpText: "Required for US tax compliance (FATCA). Format: XXX-XX-XXXX.",
  },
  {
    stepId: "employment_status",
    screenName: "Employment Status",
    questionText: "What best describes your employment status?",
    questionType: "select",
    options: [
      { value: "employed", label: "Employed" },
      { value: "self_employed", label: "Self-employed" },
      { value: "student", label: "Student" },
      { value: "retired", label: "Retired" },
      { value: "unemployed", label: "Unemployed" },
    ],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    // Self-employed must describe their business; others skip to income_source
    branchingLogic: [{ condition: "answer === 'self_employed'", nextStepId: "business_income" }],
    defaultNextStepId: "income_source",
    isRequired: true,
  },
  {
    stepId: "business_income",
    screenName: "Business Income",
    questionText: "Describe your self-employed business and estimated annual income.",
    questionType: "text",
    options: [],
    validationRules: ["required", "min:10"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "income_source",
    isRequired: true,
    helpText: "For example: 'Freelance software developer, £60,000/year'.",
  },
  {
    stepId: "income_source",
    screenName: "Source of Income",
    questionText: "What is your primary source of income?",
    questionType: "select",
    options: [
      { value: "salary", label: "Salary" },
      { value: "investments", label: "Investments" },
      { value: "savings", label: "Savings" },
      { value: "benefits", label: "Benefits" },
      { value: "other", label: "Other" },
    ],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "document_type",
    isRequired: true,
  },
  {
    stepId: "document_type",
    screenName: "Identity Document",
    questionText: "Which document will you use to verify your identity?",
    questionType: "select",
    options: [
      { value: "passport", label: "Passport" },
      { value: "national_id", label: "National ID" },
      { value: "drivers_license", label: "Driver's License" },
    ],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "document_upload",
    isRequired: true,
  },
  {
    stepId: "document_upload",
    screenName: "Upload Document",
    questionText: "Please upload a photo of your identity document.",
    questionType: "upload",
    options: [],
    validationRules: ["required", "image"],
    requiredDocuments: ["passport|national_id|drivers_license"],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "selfie",
    isRequired: true,
    helpText: "Make sure the document is clear and all text is readable.",
  },
  {
    stepId: "selfie",
    screenName: "Take a Selfie",
    questionText: "Take a selfie so we can verify it matches your document.",
    questionType: "upload",
    options: [],
    validationRules: ["required", "image", "liveness"],
    requiredDocuments: ["selfie"],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "review",
    isRequired: true,
  },
  {
    stepId: "review",
    screenName: "Review & Submit",
    questionText: "Please review your information before submitting.",
    questionType: "info",
    options: [],
    validationRules: [],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: null, // terminal step → completed
    isRequired: false,
    helpText: "Your information will be verified within 24 hours.",
  },
];

export const businessSteps: StepDef[] = [
  {
    stepId: "welcome",
    screenName: "Business Welcome",
    questionText: "Set up your NovaPay Business account.",
    questionType: "info",
    options: [],
    validationRules: [],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "business_name",
    isRequired: false,
  },
  {
    stepId: "business_name",
    screenName: "Business Name",
    questionText: "What is your business name?",
    questionType: "text",
    options: [],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "business_type",
    isRequired: true,
  },
  {
    stepId: "business_type",
    screenName: "Business Type",
    questionText: "What type of business is it?",
    questionType: "select",
    options: [
      { value: "sole_trader", label: "Sole Trader" },
      { value: "ltd", label: "Limited Company" },
      { value: "llc", label: "LLC" },
      { value: "partnership", label: "Partnership" },
      { value: "nonprofit", label: "Non-profit" },
    ],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    // Sole traders don't have company registration docs; skip company_docs
    branchingLogic: [{ condition: "answer === 'sole_trader'", nextStepId: "director_details" }],
    defaultNextStepId: "business_country",
    isRequired: true,
  },
  {
    stepId: "business_country",
    screenName: "Country of Registration",
    questionText: "Where is your business registered?",
    questionType: "country_picker",
    options: [],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "registration_number",
    isRequired: true,
  },
  {
    stepId: "registration_number",
    screenName: "Registration Number",
    questionText: "What is your company registration number?",
    questionType: "text",
    options: [],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "company_docs",
    isRequired: true,
  },
  {
    stepId: "company_docs",
    screenName: "Company Documents",
    questionText: "Upload your company registration documents.",
    questionType: "upload",
    options: [],
    validationRules: ["required"],
    requiredDocuments: ["company_registration", "articles_of_association"],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "director_details",
    isRequired: true,
  },
  {
    stepId: "director_details",
    screenName: "Director Details",
    questionText: "Tell us about the company director.",
    questionType: "text",
    options: [],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "ubo_details",
    isRequired: true,
  },
  {
    stepId: "ubo_details",
    screenName: "Ultimate Beneficial Owner",
    questionText: "Who owns 25% or more of the company?",
    questionType: "text",
    options: [],
    validationRules: ["required"],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: "review",
    isRequired: true,
  },
  {
    stepId: "review",
    screenName: "Review & Submit",
    questionText: "Review your business information.",
    questionType: "info",
    options: [],
    validationRules: [],
    requiredDocuments: [],
    countryConstraints: [],
    branchingLogic: [],
    defaultNextStepId: null, // terminal step → completed
    isRequired: false,
  },
];

// ---------------------------------------------------------------------------
// Branching engine
//
// Resolution order:
//   1. Evaluate branching rules (first match wins)
//   2. Fall back to step.defaultNextStepId
//   3. "completed" if defaultNextStepId is null or step not found
// ---------------------------------------------------------------------------

export function resolveNextStepId(
  steps: StepDef[],
  currentStepId: string,
  answer: unknown,
  _allAnswers?: Record<string, unknown>,
): string {
  const currentStep = steps.find((s) => s.stepId === currentStepId);
  if (!currentStep) return "completed";

  // Evaluate branching rules against the submitted answer
  for (const rule of currentStep.branchingLogic) {
    // String equality: `answer === 'VALUE'`
    if (typeof answer === "string" && rule.condition === `answer === '${answer}'`) {
      const branchTarget = steps.find((s) => s.stepId === rule.nextStepId);
      if (branchTarget) return rule.nextStepId;
    }
    // Object field check: `answer.FIELD === 'VALUE'`
    if (typeof answer === "object" && answer !== null) {
      const obj = answer as Record<string, string>;
      const match = rule.condition.match(/^answer\.(\w+) === '([^']+)'$/);
      if (match) {
        const [, field, val] = match;
        if (obj[field] === val) {
          const branchTarget = steps.find((s) => s.stepId === rule.nextStepId);
          if (branchTarget) return rule.nextStepId;
        }
      }
    }
  }

  // Use explicit default next step (not array position)
  return currentStep.defaultNextStepId ?? "completed";
}

// ---------------------------------------------------------------------------
// GET /onboarding/steps — public, returns step catalogue for a given type
// ---------------------------------------------------------------------------

router.get("/onboarding/steps", async (req, res): Promise<void> => {
  const query = GetOnboardingStepsQueryParams.safeParse(req.query);
  const type = query.success ? query.data.type : undefined;
  const steps = type === "business" ? businessSteps : type === "personal" ? personalSteps : [...personalSteps];
  res.json(steps);
});

// ---------------------------------------------------------------------------
// POST /onboarding/start  — requires auth
// ---------------------------------------------------------------------------

router.post("/onboarding/start", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const parsed = StartOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { type, countryCode } = parsed.data;
  const steps = type === "business" ? businessSteps : personalSteps;

  const [session] = await db
    .insert(onboardingSessionsTable)
    .values({
      userId,
      type: type as "personal" | "business",
      countryCode,
      currentStepId: steps[0].stepId,
      completedSteps: [],
      answers: {},
      status: "in_progress",
    })
    .returning();

  const nextStep = steps.find((s) => s.stepId === session.currentStepId);
  res.json({
    sessionId: session.id,
    type: session.type,
    currentStepId: session.currentStepId,
    completedSteps: session.completedSteps,
    answers: session.answers,
    status: session.status,
    nextStep,
  });
});

// ---------------------------------------------------------------------------
// GET /onboarding/session/:sessionId  — requires auth + ownership
// ---------------------------------------------------------------------------

router.get("/onboarding/session/:sessionId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const params = GetOnboardingSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.id, params.data.sessionId));

  if (!session) {
    res.status(404).json({ error: "Not found", message: "Onboarding session not found" });
    return;
  }

  if (session.userId !== userId) {
    res.status(403).json({ error: "Forbidden", message: "You do not have access to this onboarding session" });
    return;
  }

  const steps = session.type === "business" ? businessSteps : personalSteps;
  const nextStep = steps.find((s) => s.stepId === session.currentStepId);
  res.json({
    sessionId: session.id,
    type: session.type,
    currentStepId: session.currentStepId,
    completedSteps: session.completedSteps,
    answers: session.answers,
    status: session.status,
    nextStep,
  });
});

// ---------------------------------------------------------------------------
// POST /onboarding/session/:sessionId/step  — requires auth + ownership
// ---------------------------------------------------------------------------

router.post("/onboarding/session/:sessionId/step", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const params = GetOnboardingSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }

  // Ownership check BEFORE body validation so we return 403 (not 400) for unauthorised users
  const [session] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.id, params.data.sessionId));

  if (!session) {
    res.status(404).json({ error: "Not found", message: "Session not found" });
    return;
  }

  if (session.userId !== userId) {
    res.status(403).json({ error: "Forbidden", message: "You do not have access to this onboarding session" });
    return;
  }

  const parsed = SubmitOnboardingStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  if (session.status === "completed") {
    res.status(400).json({ error: "Bad request", message: "Onboarding session is already completed" });
    return;
  }

  const steps = session.type === "business" ? businessSteps : personalSteps;
  const completedSteps = [...(session.completedSteps as string[]), parsed.data.stepId];
  const answers = { ...(session.answers as Record<string, unknown>), [parsed.data.stepId]: parsed.data.answer };

  const nextStepId = resolveNextStepId(steps, parsed.data.stepId, parsed.data.answer, answers);
  const isComplete = nextStepId === "completed";
  const status: "in_progress" | "completed" | "abandoned" = isComplete ? "completed" : "in_progress";

  const [updated] = await db
    .update(onboardingSessionsTable)
    .set({ currentStepId: nextStepId, completedSteps, answers, status })
    .where(eq(onboardingSessionsTable.id, params.data.sessionId))
    .returning();

  if (isComplete) {
    await db
      .update(usersTable)
      .set({ onboardingStatus: "completed" })
      .where(eq(usersTable.id, userId));
  }

  const nextStep = isComplete ? undefined : steps.find((s) => s.stepId === nextStepId);
  res.json({
    sessionId: updated.id,
    type: updated.type,
    currentStepId: updated.currentStepId,
    completedSteps: updated.completedSteps,
    answers: updated.answers,
    status: updated.status,
    nextStep,
  });
});

// ---------------------------------------------------------------------------
// GET /onboarding/status  — requires auth
// ---------------------------------------------------------------------------

router.get("/onboarding/status", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  res.json({ onboardingStatus: user.onboardingStatus, userId: user.id });
});

export default router;
