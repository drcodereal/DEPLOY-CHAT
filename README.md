# ChatApp — WhatsApp-style Web Chat

A production-ready React/Vite chat interface powered by Supabase.

## Included features

- Phone-number + password registration/login
- Persistent Supabase authentication session
- One-to-one and group messaging
- Real-time messages with polling fallback
- Unread message badges that **clear when the conversation is opened/read**
- Read receipts / blue ticks
- Online and last-seen status
- Browser message notifications when the user is away from the ChatApp window
- Voice/video calling with WebRTC
- Calls history
- Contacts and groups
- Responsive mobile layout
- Terms & Conditions and Privacy Policy pages
- © 2026 ChatApp — All rights reserved
- Vercel SPA rewrite included

## Vercel deployment

This project is intentionally configured so the browser uses the included Supabase **publishable/anon key**. No private service-role key is included.

1. Upload the project to GitHub.
2. Import the repository into Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. No Vercel environment variables are required for this version.
7. Deploy.

`vercel.json` is included so routes such as `/legal?page=privacy` work after a direct refresh.

> Never replace the browser key with a Supabase service-role/secret key. Publishable/anon keys are designed for browser use and access is controlled by Supabase RLS.

## Notifications

Open **Settings → Message notifications → Enable** and allow notifications in the browser. Incoming messages trigger a browser notification when the ChatApp tab is not visible/focused.

Browser notifications require HTTPS in production, which Vercel provides automatically.

A fully closed browser cannot receive realtime JavaScript notifications from a normal browser tab. True closed-browser push notifications require a Web Push service/worker plus server-side push delivery.

## Supabase

The existing Supabase project/schema used by this build must already contain the application's tables and RLS policies (`profiles`, `messages`, `conversations`, `group_members`, etc.).

For the unread badge fix, the logged-in recipient must be allowed by RLS to update their conversation's incoming messages and set `is_read = true`.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```
