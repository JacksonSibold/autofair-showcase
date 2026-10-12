# AutoFair — vehicle-shopping application prototype

A personal full-stack project combining vehicle search, comparable-listing analysis, and a negotiation workflow. This public snapshot contains the application source; private configuration and original Git history are excluded.

## Implemented structure

- Next.js App Router, React, TypeScript, Tailwind and reusable UI components.
- Supabase authentication, dashboard pages and relational schema.
- MarketCheck listing integration and vehicle decoding/search routes.
- Negotiation orchestration with email/SMS adapters and OpenAI integration.
- Stripe checkout and webhook routes.

## Local setup

Use Node.js 20.9 or newer. Run `npm ci`, copy `.env.example` to `.env.local`, configure your own service accounts, then run `npm run dev`. The schema is in `supabase-schema.sql`.

Every external service has a fallback for local work: without a MarketCheck key the pricing engine uses heuristics, and without SendGrid or Twilio credentials outbound messages are logged instead of sent. Stripe, Supabase and OpenAI calls need real test-mode credentials.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint over the project |
| `npx tsc --noEmit` | Type-check the project |
| `npm test` | Run the Vitest unit tests once |
| `npm run test:watch` | Run Vitest in watch mode |

## Testing

Unit tests live next to the code they cover as `*.test.ts` files under `src/`. They cover the pure logic: tax and fee estimation, pricing statistics and heuristics, utility formatting, negotiation message templates and reply parsing, email address handling, and the request validation helpers used by API routes. OpenAI is mocked in the agent tests, and the email suite relies on SendGrid being unconfigured. The tests make no network calls.

Route handlers are not yet covered by automated tests. Adding them would need a Supabase and Stripe test double.

External integrations require credentials and provider setup. Do not add credentials to Git. This repository is a source-code portfolio snapshot, not a deployed service.

## Known gaps

- The SMS and email inbound webhooks (`/api/agent/sms-inbound`, `/api/agent/email-inbound`) do not verify Twilio or SendGrid signatures, so anyone who knows an alias address can post a fake dealer reply.
- Outbound negotiation templates in `src/lib/negotiation/agent.ts` are signed as "Alex" without an AI disclosure. The system prompt requires disclosure for model-written replies only.
- `/api/negotiate` is not authenticated. It only acts on negotiations that have a paid status, but it should check the caller or an internal secret.
- The VIN decoder and make/model lookups depend on NHTSA, and upstream outages are returned as 502 responses.
- The tax and fee tables are dated approximations, as described below.

## Honest limitations

Tax/fee estimates contain dated heuristic tables, not verified current tax calculations. Missing communication credentials can trigger mock responses. The prototype still needs a production security review of inbound webhooks, authorization and external integrations. No live payments, dealer messages or negotiations were run during publication. The public demo prompt was adjusted to require disclosure of its AI identity.

## Validation

See `PUBLICATION_CHECKS.md` for the checks actually run. The public snapshot documentation and cleanup were prepared with AI assistance; no production-use or revenue claim is made here.
