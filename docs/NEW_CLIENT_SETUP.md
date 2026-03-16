# New Client Setup

## What the onboarding app does automatically

When a client completes the ActivityHub onboarding form and submits it:

- A `businesses` row is created using the live fields currently present in the ActivityHub Supabase project.
- A `MAIN_ADMIN` user is created in `admin_users` using the password the client entered in the onboarding flow.
- A `policies` row is created with cancellation, loyalty, and group discount defaults.
- Client-specific SOPs and operational playbooks are captured in onboarding metadata for the new business only.
- The client defines a tenant slug that can later be used for domain-or-slug tenant resolution.
- One or more `tours` are created.
- Initial `slots` are generated from the tour date ranges, weekdays, and departure times in the form.
- An active `subscriptions` row is created for the selected plan.
- A `landing_page_orders` row is created when requested, and its `metadata` stores the full onboarding payload so the raw client answers remain available in SQL even if the current schema has no dedicated columns yet.
- `WA_ACCESS_TOKEN` and `YOCO_SECRET_KEY` can be captured in the form and stored in metadata as protected values or placeholders for later tenant-specific runtime wiring.
- A manual SQL fallback script can be downloaded from the success state if an automated provisioning request cannot be completed in production.

## Isolation rules

- The onboarding route is intended to create a brand new tenant only.
- It refuses to proceed if the business name, operator email, or admin email already match an existing tenant record.
- It does not update any existing `businesses`, `admin_users`, `tours`, `slots`, `policies`, `subscriptions`, or `landing_page_orders` rows.
- If provisioning fails partway through, it performs a scoped cleanup of the newly created `business_id` so the request does not leave partial data behind.
- Existing business data stays isolated. New client content should be supplied through the onboarding form and stored against the new tenant only.

## What the onboarding app does not fully automate yet

These are rollout tasks in the shared platform, not changes performed by the onboarding form itself:

- WhatsApp Cloud API credentials still need to be assigned to the correct client runtime.
- Yoco keys still need to be assigned to the correct client runtime.
- Resend sender configuration still needs to be assigned to the correct client runtime.
- The shared public booking site and chat functions still need full domain-or-slug tenant resolution and SQL-driven business loading before multiple businesses should share one runtime.

## Exact operator workflow for a new client

1. Send the onboarding form to the client.
2. Wait for the client to complete the form and submit it.
3. Open Supabase and verify:
   - `businesses` row created
   - `admin_users` row created with `MAIN_ADMIN`
   - `policies` row created
   - `tours` rows created
   - `slots` rows created
   - `subscriptions` row created
   - `landing_page_orders` row created, if requested
4. Open the new `landing_page_orders.metadata` JSON.
   - This contains the full onboarding dossier, including the tenant slug, FAQs, operations, brand settings, tour notes, protected secret placeholders or encrypted values, and manual setup reminders.
5. Configure deployment secrets for the client:
   - `WA_ACCESS_TOKEN`
   - `WA_PHONE_NUMBER_ID`
   - `WA_VERIFY_TOKEN`
   - `YOCO_SECRET_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
6. Point the correct booking/admin deployment at the client business.
   - Use the tenant slug and final domain mapping for that client only.
7. If the automated POST fails in production, use the downloaded fallback SQL script from the success or error state.
   - Review the script first. It includes duplicate guards and only inserts a brand new tenant.
8. Verify the client can sign in with the admin email and password from the onboarding form.
9. Run one end-to-end test:
   - create booking
   - pay booking
   - receive confirmation
   - test reminder flow
   - test cancellation or reschedule path
10. Only then mark the client live.

## Required environment variables for the onboarding app

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These credentials should be configured on the onboarding deployment only. They are not part of the existing core or booking app builds.

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

The onboarding app maps directly to those fields and puts everything else into `landing_page_orders.metadata` so you still have the complete client record in SQL.

## Recommended next refactor

These should be treated as mandatory multi-tenant hardening work before multiple businesses share the same public booking and automation stack:

1. Add tenant resolution by domain or slug in the public booking app.
2. Move WhatsApp, chat prompt, and payment credentials into per-business tables or encrypted secrets storage.
3. Replace remaining hardcoded text in the edge functions with business-specific data loaded from SQL.
