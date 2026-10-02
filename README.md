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

External integrations require credentials and provider setup. Do not add credentials to Git. This repository is a source-code portfolio snapshot, not a deployed service.

## Honest limitations

Tax/fee estimates contain dated heuristic tables, not verified current tax calculations. Missing communication credentials can trigger mock responses. The prototype still needs a production security review of inbound webhooks, authorization and external integrations. No live payments, dealer messages or negotiations were run during publication. The public demo prompt was adjusted to require disclosure of its AI identity.

## Validation

See `PUBLICATION_CHECKS.md` for the checks actually run. The public snapshot documentation and cleanup were prepared with AI assistance; no production-use or revenue claim is made here.
