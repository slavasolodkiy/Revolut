import { Router, type IRouter } from "express";
import { db, onboardingSessionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { StartOnboardingBody, SubmitOnboardingStepBody, GetOnboardingSessionParams, GetOnboardingStepsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// Static step definitions for personal onboarding
const personalSteps = [
  { stepId: "welcome", screenName: "Welcome", questionText: "Welcome to NovaPay. Let's get you set up.", questionType: "info", options: [], validationRules: [], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: false, helpText: "This will take about 5 minutes." },
  { stepId: "full_name", screenName: "Your Name", questionText: "What's your full name?", questionType: "text", options: [], validationRules: ["required", "min:2"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true, helpText: "Enter your legal name as it appears on your ID." },
  { stepId: "date_of_birth", screenName: "Date of Birth", questionText: "What's your date of birth?", questionType: "date", options: [], validationRules: ["required", "age:18"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true, helpText: "You must be 18 or older to use NovaPay." },
  { stepId: "phone_number", screenName: "Phone Number", questionText: "What's your phone number?", questionType: "phone", options: [], validationRules: ["required", "e164"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true, helpText: "We'll send a verification code to this number." },
  { stepId: "phone_otp", screenName: "Verify Phone", questionText: "Enter the 6-digit code sent to your phone.", questionType: "otp", options: [], validationRules: ["required", "length:6"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true, helpText: "Didn't receive it? Request a new code." },
  { stepId: "address_country", screenName: "Country of Residence", questionText: "Which country do you live in?", questionType: "country_picker", options: [], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [{ condition: "answer.country === 'US'", nextStepId: "us_ssn" }], isRequired: true },
  { stepId: "employment_status", screenName: "Employment Status", questionText: "What best describes your employment status?", questionType: "select", options: [{ value: "employed", label: "Employed" }, { value: "self_employed", label: "Self-employed" }, { value: "student", label: "Student" }, { value: "retired", label: "Retired" }, { value: "unemployed", label: "Unemployed" }], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [{ condition: "answer === 'self_employed'", nextStepId: "business_income" }], isRequired: true },
  { stepId: "income_source", screenName: "Source of Income", questionText: "What is your primary source of income?", questionType: "select", options: [{ value: "salary", label: "Salary" }, { value: "investments", label: "Investments" }, { value: "savings", label: "Savings" }, { value: "benefits", label: "Benefits" }, { value: "other", label: "Other" }], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "document_type", screenName: "Identity Document", questionText: "Which document will you use to verify your identity?", questionType: "select", options: [{ value: "passport", label: "Passport" }, { value: "national_id", label: "National ID" }, { value: "drivers_license", label: "Driver's License" }], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "document_upload", screenName: "Upload Document", questionText: "Please upload a photo of your identity document.", questionType: "upload", options: [], validationRules: ["required", "image"], requiredDocuments: ["passport|national_id|drivers_license"], countryConstraints: [], branchingLogic: [], isRequired: true, helpText: "Make sure the document is clear and all text is readable." },
  { stepId: "selfie", screenName: "Take a Selfie", questionText: "Take a selfie so we can verify it matches your document.", questionType: "upload", options: [], validationRules: ["required", "image", "liveness"], requiredDocuments: ["selfie"], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "review", screenName: "Review & Submit", questionText: "Please review your information before submitting.", questionType: "info", options: [], validationRules: [], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: false, helpText: "Your information will be verified within 24 hours." },
];

const businessSteps = [
  { stepId: "welcome", screenName: "Business Welcome", questionText: "Set up your NovaPay Business account.", questionType: "info", options: [], validationRules: [], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: false },
  { stepId: "business_name", screenName: "Business Name", questionText: "What is your business name?", questionType: "text", options: [], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "business_type", screenName: "Business Type", questionText: "What type of business is it?", questionType: "select", options: [{ value: "sole_trader", label: "Sole Trader" }, { value: "ltd", label: "Limited Company" }, { value: "llc", label: "LLC" }, { value: "partnership", label: "Partnership" }, { value: "nonprofit", label: "Non-profit" }], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "business_country", screenName: "Country of Registration", questionText: "Where is your business registered?", questionType: "country_picker", options: [], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "registration_number", screenName: "Registration Number", questionText: "What is your company registration number?", questionType: "text", options: [], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "company_docs", screenName: "Company Documents", questionText: "Upload your company registration documents.", questionType: "upload", options: [], validationRules: ["required"], requiredDocuments: ["company_registration", "articles_of_association"], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "director_details", screenName: "Director Details", questionText: "Tell us about the company director.", questionType: "text", options: [], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "ubo_details", screenName: "Ultimate Beneficial Owner", questionText: "Who owns 25% or more of the company?", questionType: "text", options: [], validationRules: ["required"], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: true },
  { stepId: "review", screenName: "Review & Submit", questionText: "Review your business information.", questionType: "info", options: [], validationRules: [], requiredDocuments: [], countryConstraints: [], branchingLogic: [], isRequired: false },
];

router.get("/onboarding/steps", async (req, res): Promise<void> => {
  const query = GetOnboardingStepsQueryParams.safeParse(req.query);
  const type = query.success ? query.data.type : undefined;
  const steps = type === "business" ? businessSteps : type === "personal" ? personalSteps : [...personalSteps];
  res.json(steps);
});

router.post("/onboarding/start", async (req, res): Promise<void> => {
  const parsed = StartOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { type, countryCode } = parsed.data;
  const steps = type === "business" ? businessSteps : personalSteps;

  const [session] = await db
    .insert(onboardingSessionsTable)
    .values({ type: type as "personal" | "business", countryCode, currentStepId: steps[0].stepId, completedSteps: [], answers: {}, status: "in_progress" })
    .returning();

  const nextStep = steps.find(s => s.stepId === session.currentStepId);
  res.json({ sessionId: session.id, type: session.type, currentStepId: session.currentStepId, completedSteps: session.completedSteps, answers: session.answers, status: session.status, nextStep });
});

router.get("/onboarding/session/:sessionId", async (req, res): Promise<void> => {
  const params = GetOnboardingSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }

  const [session] = await db.select().from(onboardingSessionsTable).where(eq(onboardingSessionsTable.id, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Not found", message: "Onboarding session not found" });
    return;
  }

  const steps = session.type === "business" ? businessSteps : personalSteps;
  const nextStep = steps.find(s => s.stepId === session.currentStepId);
  res.json({ sessionId: session.id, type: session.type, currentStepId: session.currentStepId, completedSteps: session.completedSteps, answers: session.answers, status: session.status, nextStep });
});

router.post("/onboarding/session/:sessionId/step", async (req, res): Promise<void> => {
  const params = GetOnboardingSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Validation error", message: params.error.message });
    return;
  }

  const parsed = SubmitOnboardingStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [session] = await db.select().from(onboardingSessionsTable).where(eq(onboardingSessionsTable.id, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Not found", message: "Session not found" });
    return;
  }

  const steps = session.type === "business" ? businessSteps : personalSteps;
  const currentIndex = steps.findIndex(s => s.stepId === parsed.data.stepId);
  const completedSteps = [...(session.completedSteps as string[]), parsed.data.stepId];
  const answers = { ...(session.answers as Record<string, unknown>), [parsed.data.stepId]: parsed.data.answer };

  const nextIndex = currentIndex + 1;
  const isComplete = nextIndex >= steps.length;
  const nextStepId = isComplete ? "completed" : steps[nextIndex].stepId;
  const status = isComplete ? "completed" : "in_progress";

  const [updated] = await db
    .update(onboardingSessionsTable)
    .set({ currentStepId: nextStepId, completedSteps, answers, status: status as "in_progress" | "completed" | "abandoned" })
    .where(eq(onboardingSessionsTable.id, params.data.sessionId))
    .returning();

  const nextStep = isComplete ? undefined : steps.find(s => s.stepId === nextStepId);
  res.json({ sessionId: updated.id, type: updated.type, currentStepId: updated.currentStepId, completedSteps: updated.completedSteps, answers: updated.answers, status: updated.status, nextStep });
});

export default router;
