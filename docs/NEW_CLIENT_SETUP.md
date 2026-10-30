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
3. The client answers twelve short screens, with a live preview of their booking site beside them.
   Every answer autosaves onto the real tenant as they advance, so a refresh or a dropped call
   resumes where they left off.
4. The review screen summarises everything with an Edit link per section. Pressing Go live turns the
   tenant on and emails the client a password link for `{subdomain}.admin.bookingtours.co.za`.
   After that the wizard is read-only, because the server refuses edits to a live business.
5. The finish screen links to the booking site and the client's own dashboard, and lists what is
   left: set a password, connect Yoco in dashboard Settings (the wizard no longer takes the key,
   the edge function refuses it), and make a paid test booking. The wizard polls for that booking
   and closes the invite once it lands.
6. WhatsApp is display only. The client is never asked for a token. The platform owner connects the
   number separately.

## What the agent should watch for on the call

- The address screen can look the business up on Google. If that comes back empty or unavailable,
  the client types their address in by hand and nothing is lost.
- The brand screen can read an existing website. Same story, it degrades to picking colours.
- The tours screen shows a live count of the departures about to be created. Sanity check it with
  the client before pressing Next, especially the end date.
- A tour that already has departures starts with no new date ranges, so pressing Next again does not
  pile duplicate slots onto the calendar.

## After the call

The token is single use and expires. If a client needs to change something later, they do it in the
admin dashboard, not here.
