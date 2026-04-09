// Zod validation schemas generated from the OpenAPI spec.
// TypeScript types are inferred from these schemas via z.infer<>.
//
// We intentionally do NOT re-export from "./generated/types" here.
// That barrel contains TypeScript interfaces with the same names as the Zod
// schema constants (e.g. GetAccountTransactionsParams appears as both a Zod
// const and a TS type). Re-exporting both produces TS2308 (ambiguous
// re-export). Callers who need TypeScript types can use:
//
//   import type { User } from "@workspace/api-zod/src/generated/types";
//   // or more commonly:
//   type User = z.infer<typeof UserSchema>; // inferred from the Zod schema
//
export * from "./generated/api";
