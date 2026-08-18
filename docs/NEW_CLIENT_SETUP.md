# New client setup

## What this app is

A one-question-per-screen wizard the client fills in on their own machine while a support agent
walks them through it on a call. It holds no secrets and has no server routes of its own. Every
action goes through a single token-gated edge function, `onboarding-wizard`, called with the
Supabase anon key.

## Environment variables

Only two, and both are public:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

There is no service-role key, no encryption key and no mail provider key on this deployment. If you
find yourself adding one, something has gone wrong. All privileged work happens inside the
`onboarding-wizard` edge function in the platform repo.

## The flow

1. A super admin generates an invite token in the platform admin. That creates a skeleton tenant and
   returns a link of the form `https://onboarding.bookingtours.co.za?token=<uuid>`.
2. Send the client that link and get them on a call.
3. The client answers roughly nineteen short screens. Every answer autosaves onto the real tenant as
   they advance, so a refresh or a dropped call resumes where they left off.
4. The client pastes their own Yoco secret key on the payments screen. The edge function encrypts it
   and registers the payment webhook. A `pending` webhook is not a failure and does not block them.
5. WhatsApp is display only. The client is never asked for a token. The platform owner connects the
   number separately.
6. The go-live screen turns the tenant on and reports what is ready.
7. The finish screen asks the client to make a real, paid test booking while still on the call. The
   wizard polls for it and celebrates when it lands, then marks the setup complete.

## What the agent should watch for on the call

- The address screen can look the business up on Google. If that comes back empty or unavailable,
  the client types their address in by hand and nothing is lost.
- The colours screen can read an existing website. Same story, it degrades to picking colours.
- The tours screen shows a live count of the departures about to be created. Sanity check it with
  the client before pressing Next, especially the end date.
- A tour that already has departures starts with no new date ranges, so pressing Next again does not
  pile duplicate slots onto the calendar.

## After the call

The token is single use and expires. If a client needs to change something later, they do it in the
admin dashboard, not here.
