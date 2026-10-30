# BookingTours onboarding wizard

The guided setup a new operator fills in, one question per screen, while a support agent walks them
through it on a call. It lives at `onboarding.bookingtours.co.za` and is opened with an invite token:

```
https://onboarding.bookingtours.co.za?token=<uuid>
```

## Zero secrets

This app has no server routes and no privileged credentials. Everything goes through one token-gated
edge function, `onboarding-wizard`, called with the Supabase anon key. The only environment
variables are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. See `.env.example`.

If you are about to add a service-role key, an encryption key or a mail provider key here, put it in
the edge function instead.

## Shape of the code

```
app/page.tsx                  reads ?token, hands off to Gate
app/components/Gate.tsx       validates the token, then the wizard or a dead-end screen
app/components/Wizard.tsx     step machine, progress, autosave, error surface
app/components/steps/*.tsx    one thin component per question screen
app/components/Preview.tsx    live miniature of the booking site, shown beside the questions
app/lib/api.ts                supabase client and callWizard()
app/lib/steps.ts              step definitions and per-step validation
app/lib/onboarding.ts         shared types, timezones, slot-count preview
```

Answers autosave when the client advances a screen, and on a debounce while they type. The resume
position comes from `localStorage` first, then from the server's `wizard_step`, never from the URL.

## Run locally

```bash
npm ci
npm run dev
```

## Operator handoff

Read [`docs/NEW_CLIENT_SETUP.md`](./docs/NEW_CLIENT_SETUP.md) before running a setup call.
