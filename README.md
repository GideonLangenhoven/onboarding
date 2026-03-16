# ActivityHub Onboarding

Client-facing onboarding flow for new operators signing onto the CapeKayak stack.

## What it does

- Explains the platform, features, onboarding process, and rollout expectations to the client.
- Collects business, operations, policy, branding, FAQ, tour data, confirmed admin email, validated timezones, tenant slug, and onboarding invite code in a guided form.
- Captures WhatsApp and Yoco credentials and saves them through the encrypted Supabase credential RPC flow instead of metadata.
- Creates the core SQL records for a new client when the form is submitted.

## What it creates

- `businesses`
- `admin_users`
- `policies`
- `tours`
- `slots`
- `subscriptions`
- `landing_page_orders` with non-secret onboarding data in `metadata`

## Run locally

```bash
npm ci
npm run dev
```

## Required environment variables

See `.env.example`.

Automatic provisioning requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SETTINGS_ENCRYPTION_KEY`
- `ONBOARDING_INVITE_CODE`

## Operator handoff

Read [`docs/NEW_CLIENT_SETUP.md`](./docs/NEW_CLIENT_SETUP.md) after each submission. It explains the remaining steps for WhatsApp, payment, email, multi-tenant rollout, and live QA.
