# BookingTours — Getting Started Guide

Welcome to BookingTours! This guide walks you through everything you need to go from sign-up to accepting your first booking.

---

## What You've Just Set Up

When you completed the onboarding form, we automatically created:

- **Your booking website** — a professional, mobile-ready page where customers browse tours, check availability, and pay online
- **Your admin dashboard** — your daily command centre for managing bookings, check-ins, and communication
- **Your AI assistant** — a 24/7 virtual host on your website and WhatsApp that answers questions and helps customers book
- **Automated messaging** — booking confirmations, reminders, waiver prompts, and review requests

---

## Step 1: Log Into Your Dashboard

1. Go to your admin dashboard URL (provided after onboarding)
2. Enter the email and password you chose during setup
3. You'll see your dashboard with today's overview, weather, and action items

**Tip:** Bookmark your dashboard URL for quick access.

---

## Step 2: Check Your Tours

1. Click **Settings** in the sidebar
2. Open the **Tours & Activities** section
3. Verify each tour has the correct:
   - Name and description
   - Price per person
   - Duration
   - Capacity (max group size)
   - Image (paste an image URL)
4. Tours marked as "Hidden" won't show on your booking page

---

## Step 3: Set Up Your Schedule

1. Go to **Slots** in the sidebar
2. Click **Add Slots** to generate your booking availability
3. Choose:
   - Which tour
   - Date range (start and end dates)
   - Days of the week (e.g., Mon–Sat)
   - Departure times (e.g., 09:00, 14:00)
   - Capacity per slot
4. Click **Generate** — your calendar fills with bookable time slots

**Tip:** You can always adjust individual slots later (change capacity, price, or close for weather).

---

## Step 4: Connect Payments (Yoco)

Without this step, customers can't pay online.

1. Log in to [merchant.yoco.com](https://merchant.yoco.com)
2. Go to **Settings → API Keys**
3. Copy your **Secret Key** (starts with `sk_live_`)
4. Copy your **Webhook Signing Secret** (starts with `whsec_`)
5. In your dashboard, go to **Settings → Integration Credentials → Yoco**
6. Paste both keys and click **Save**
7. Test with a small booking (R1) to verify

---

## Step 5: Connect WhatsApp (Optional)

Enables automated WhatsApp messages to your customers.

1. You need a **Meta Business Account** with WhatsApp Business API access
2. Get your **Access Token** and **Phone Number ID** from the Meta Developer Portal
3. In your dashboard, go to **Settings → Integration Credentials → WhatsApp**
4. Paste both values and click **Save**

**Need help?** Email support@bookingtours.co.za — we'll walk you through it.

---

## Step 6: Customize Your AI Assistant

Your AI virtual host is already loaded with the FAQs you provided during onboarding. To fine-tune it:

1. Go to **Settings** → scroll to the AI section
2. Edit the **System Prompt** to adjust the AI's tone and personality
3. Add more FAQ pairs anytime — the AI automatically uses them
4. The AI also knows your tour details, meeting point, and what to bring

---

## Step 7: Share Your Booking Link

Your booking page is live! Share it everywhere:

- **Social media** — post the link on Facebook, Instagram, etc.
- **Google Business Profile** — add it as your booking URL
- **Your existing website** — add a "Book Now" button linking to it
- **Email signature** — include it in every email
- **WhatsApp status** — pin it for customers to find

---

## Feature Guide

### Booking Website
Your customers visit your booking page to browse tours, check availability, and pay online. It's available 24/7, mobile-friendly, and supports promo codes and gift vouchers.

### AI Chat Assistant
Your virtual host answers questions and helps customers book — on your website and WhatsApp. It's trained on your FAQs and tour info. When a customer needs a human, it routes to your Inbox.

### Dashboard & Bookings
See today's bookings, check guests in, create manual bookings for walk-ins, send payment links, and manage the full booking lifecycle.

### Automated Messages
The system automatically sends:
- Booking confirmation (email + WhatsApp)
- Day-before reminder
- Waiver signing reminder
- Post-trip review request

### Weather Operations
Monitor live conditions with the Windguru widget. Cancel slots with one click — all affected customers are notified automatically with reschedule/refund options.

### Gift Vouchers
Sell gift vouchers from your booking site. Customers buy online, recipients get a code by email, and they redeem it at checkout.

### Marketing & Email Campaigns
Built-in email marketing with drag-and-drop builder, contact management (CSV/Excel import), audience segmentation, automated drip campaigns, and promo code generation.

### Reports
Revenue, attendance, marketing attribution, and waiver reports — all exportable to CSV.

---

## Troubleshooting

**"My booking page looks blank"**
Check Settings → Tours — make sure tours aren't hidden.

**"Customers can't pay"**
Check Settings → Credentials → Yoco. Verify both keys are saved correctly.

**"WhatsApp messages aren't sending"**
Check Settings → Credentials → WhatsApp. Meta tokens expire — verify yours is current.

**"Emails aren't delivered"**
Marketing emails send in batches. Check Marketing → Overview for delivery status.

---

## Getting Help

- **Email:** support@bookingtours.co.za
- **Dashboard:** Use the chat widget for quick questions
- **This guide:** Available for download anytime from your onboarding page

---

© BookingTours — Built for adventure businesses.
