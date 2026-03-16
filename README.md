# ActivityHub Onboarding

Client-facing onboarding flow for new operators signing onto the ActivityHub stack.

## What it does

- Explains the platform, features, onboarding process, and rollout expectations to the client.
- Collects business, operations, policy, branding, FAQ, tour, tenant slug, and protected credential placeholder data in a guided form.
- Creates the core SQL records for a new client when the form is submitted.
- Generates a fallback SQL migration script from the same form data for manual execution if automated provisioning is unavailable.

## What it creates

- `businesses`
- `admin_users`
- `policies`
- `tours`
- `slots`
- `subscriptions`
- `landing_page_orders` with the full onboarding payload in `metadata`

## Run locally

```bash
npm ci
npm run dev
```

## Required environment variables

See `.env.example`.

This onboarding deployment uses server-side Supabase credentials from `.env.example` to provision new client rows. That provisioning path is isolated to the onboarding app and does not modify the existing ActivityHub or booking runtimes.

## Operator handoff

Read [`docs/NEW_CLIENT_SETUP.md`](./docs/NEW_CLIENT_SETUP.md) after each submission. It explains the remaining steps for WhatsApp, payment, email, multi-tenant rollout, and live QA.
