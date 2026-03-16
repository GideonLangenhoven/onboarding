# New Client Setup

## What the onboarding app does automatically

When a client completes the ActivityHub onboarding form and submits it:

- The request is rejected unless it includes the correct onboarding invite code.
- A `businesses` row is created using the live fields currently present in the CapeKayak Supabase project.
- Tenant secrets are stored through `set_app_settings_encryption_key` and `set_business_credentials` when the client supplies WhatsApp or Yoco credentials.
- A `MAIN_ADMIN` user is created in `admin_users` using the password the client entered in the onboarding flow.
- A `policies` row is created with cancellation, loyalty, and group discount defaults.
- One or more `tours` are created.
- Initial `slots` are generated from the tour date ranges, weekdays, and departure times in the form.
- An active `subscriptions` row is created for the selected plan.
- A `landing_page_orders` row is created when requested, and its `metadata` stores the non-secret onboarding payload so the raw client answers remain available in SQL even if the current schema has no dedicated columns yet.
- If provisioning fails after validation, the UI exposes a raw SQL fallback script for manual recovery. That script starts with `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.

## What the onboarding app does not fully automate yet

These are platform limitations in the current CapeKayak and booking codebases, not gaps in the form itself:

- Resend sender configuration is still deployment-level.
- The public booking site and chat functions are not yet fully tenant-aware. Some flows still assume a single business or contain Cape Kayak specific text.

## Exact operator workflow for a new client

1. Send the onboarding form to the client.
2. Wait for the client to complete the form and submit it.
3. Open Supabase and verify:
   - `businesses` row created
   - encrypted credentials saved on `businesses` if supplied
   - `admin_users` row created with `MAIN_ADMIN`
   - `policies` row created
   - `tours` rows created
   - `slots` rows created
   - `subscriptions` row created
   - `landing_page_orders` row created, if requested
4. Open the new `landing_page_orders.metadata` JSON.
   - This contains the onboarding dossier, including FAQs, operations, brand settings, tenant slug, tour notes, and manual setup reminders.
   - Admin passwords, invite codes, WhatsApp tokens, and Yoco secrets are intentionally excluded from metadata.
5. If the submission failed and you need the fallback script:
   - copy the SQL from the onboarding UI
   - verify the script begins with `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
   - review existing rows first to avoid duplicate businesses or admins
   - run any credential RPC calls only in a secure service-role session
6. Configure remaining deployment secrets for the target environment:
   - `WA_VERIFY_TOKEN`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
7. Point the correct booking/admin deployment at the client business.
   - Today this still requires deployment-specific configuration or additional tenant-resolution work.
8. Review and update any client-specific copy still hardcoded in:
   - `Desktop/CapeKayak/capekayak/supabase/functions/web-chat/index.ts`
   - `Desktop/CapeKayak/capekayak/supabase/functions/wa-webhook/index.ts`
   - `Desktop/booking/app/components/ThemeProvider.tsx`
   - `Desktop/booking/app/layout.tsx`
9. Verify the client can sign in with the confirmed admin email and password from the onboarding form.
10. Run one end-to-end test:
   - create booking
   - pay booking
   - receive confirmation
   - test reminder flow
   - test cancellation or reschedule path
11. Only then mark the client live.

## Required environment variables for the onboarding app

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SETTINGS_ENCRYPTION_KEY`
- `ONBOARDING_INVITE_CODE`

Without `SUPABASE_SERVICE_ROLE_KEY`, `SETTINGS_ENCRYPTION_KEY`, and `ONBOARDING_INVITE_CODE`, the onboarding UI still renders, but secure automated client creation will fail.

## Notes about the current schema

The live `businesses` table currently exposes these fields:

- `name`
- `business_name`
- `business_tagline`
- `chatbot_avatar`
- `color_bg`
- `color_cta`
- `color_hover`
- `color_main`
- `color_nav`
- `color_secondary`
- `cookies_policy`
- `directions`
- `hero_eyebrow`
- `hero_subtitle`
- `hero_title`
- `logo_url`
- `operator_email`
- `privacy_policy`
- `terms_conditions`
- `timezone`

The onboarding app maps directly to those fields and puts the remaining non-secret data into `landing_page_orders.metadata` so you still have the complete client record in SQL.

## Recommended next refactor

If you want this to become a true multi-client self-service platform, the next engineering step should be:

1. Add tenant resolution by domain or slug in the public booking app.
2. Finish tenant resolution by slug or domain in the booking app and admin app.
3. Replace remaining Cape Kayak hardcoded text in the edge functions with business-specific data loaded from SQL.
