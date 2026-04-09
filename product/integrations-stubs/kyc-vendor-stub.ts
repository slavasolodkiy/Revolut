/**
 * KYC Vendor Integration Stub (Onfido-compatible interface)
 *
 * Replace this with real Onfido/Sumsub SDK calls in production.
 * This stub simulates the async webhook-based KYC flow.
 *
 * Real integration: https://documentation.onfido.com
 */

export interface KycApplicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  address?: {
    country: string;
    street?: string;
    city?: string;
    postcode?: string;
  };
}

export interface KycDocumentUpload {
  applicantId: string;
  documentType: "passport" | "national_identity_card" | "driving_licence";
  side: "front" | "back";
  fileData: Buffer | string; // base64 or Buffer
}

export interface KycCheck {
  id: string;
  applicantId: string;
  status: "in_progress" | "awaiting_applicant" | "complete";
  result?: "clear" | "consider";
  subResults?: {
    identity: "clear" | "consider" | "unidentified";
    faceComparison: "clear" | "consider" | "unidentified";
    watchlistSanctions: "clear" | "consider";
  };
  downloadUri?: string;
}

export interface KycWebhookPayload {
  payload: {
    resource_type: "check";
    action: "check.completed" | "check.started";
    object: {
      id: string;
      status: "complete" | "in_progress";
      completed_at: string;
      href: string;
    };
  };
}

/**
 * Stub: Create a KYC applicant.
 * In production: POST https://api.onfido.com/v3.6/applicants
 */
export async function createApplicant(applicant: KycApplicant): Promise<{ id: string }> {
  // STUB: Return a fake applicant ID
  console.log("[KYC Stub] Creating applicant:", applicant.email);
  return { id: `stub-applicant-${Date.now()}` };
}

/**
 * Stub: Upload a document for an applicant.
 * In production: POST https://api.onfido.com/v3.6/documents
 */
export async function uploadDocument(doc: KycDocumentUpload): Promise<{ id: string }> {
  console.log("[KYC Stub] Uploading document:", doc.documentType, doc.side, "for", doc.applicantId);
  return { id: `stub-doc-${Date.now()}` };
}

/**
 * Stub: Trigger a KYC check.
 * In production: POST https://api.onfido.com/v3.6/checks
 */
export async function triggerCheck(applicantId: string, reportNames: string[]): Promise<KycCheck> {
  console.log("[KYC Stub] Triggering check for applicant:", applicantId, "reports:", reportNames);
  return {
    id: `stub-check-${Date.now()}`,
    applicantId,
    status: "in_progress",
  };
}

/**
 * Stub: Process incoming KYC webhook.
 * In production: validate HMAC signature, parse payload, update DB.
 */
export async function processWebhook(
  payload: KycWebhookPayload,
  rawBody: string,
  signature: string,
): Promise<{ checkId: string; status: string; result?: string }> {
  console.log("[KYC Stub] Processing webhook:", payload.payload.action);
  // In production: validate HMAC-SHA256 signature against raw body
  // const expectedSig = crypto.createHmac('sha256', ONFIDO_WEBHOOK_SECRET).update(rawBody).digest('hex');
  // if (signature !== `sha256=${expectedSig}`) throw new Error('Invalid webhook signature');
  return {
    checkId: payload.payload.object.id,
    status: payload.payload.object.status,
  };
}
