# Publication checks

TypeScript: tsc --noEmit --incremental false completed successfully using the existing local dependency installation. No production build, live provider requests, payment or messaging flow was run. No claim of production readiness is made.

Public snapshot preparation removed local credentials, delivery state and personal configuration. A pattern scan for common provider tokens, private keys, JWTs, credential-bearing URLs and the known personal phone/address found no matches in the selected publication files. This is a bounded scan, not a comprehensive security audit.

## Validation run on 2026-10-12

- `npm ci` completed on Node 22.23.2. npm reported 17 advisories from the existing dependency tree; none were addressed in this pass.
- `npx tsc --noEmit` passes.
- `npm run lint` passes with no errors. One `react-hooks/exhaustive-deps` warning remains in `src/app/search/SearchPageClient.tsx`.
- `npm test` runs 52 Vitest unit tests across tax, pricing, utilities, negotiation templates, email helpers and request validation. All pass.
- `npm run build` completes. Routes were compiled but not exercised against live services.

No live provider requests, Stripe payments, email or SMS sends were made.
