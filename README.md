# GymZard ERP

A blue-and-white, web-based gym ERP prototype built for immediate testing. It is a Vite + React + TypeScript single-page app with realistic demo data, interactive workflows, role-based dashboards, and a Vercel-ready deployment configuration.

## What is included

- Executive dashboard with revenue, memberships, attendance, activity, and branch analytics
- Member management with profiles, documents, status, transfers, freezes, renewals, and CSV export
- Membership plans, subscriptions, trials, coupons, upgrades, freezes, and auto-renewal
- Payments and billing with invoices, partial payments, dues, refunds, gateways, and printable receipts
- Attendance with QR / RFID / biometric / manual check-in simulation, live occupancy, reports, and inactive alerts
- Trainers, staff/HR, classes, bookings, waiting lists, inventory, POS, leads/CRM, and notifications
- Workout plans, diet plans, food/exercise libraries, progress tracking, before/after photos, and PDF-style exports
- Reports, multi-branch management, RBAC, AI/smart features, member portal, settings, and local demo data persistence

## Demo login

Open the app and choose one of these roles on the sign-in screen. Any password works.

| Role | Access |
| --- | --- |
| Super Admin | Full platform and SaaS administration |
| Gym Owner | Full business management |
| Gym Manager | Branch operations and reporting |
| Trainer | Members, workouts, diet, progress, and classes |
| Receptionist | Front desk, billing, attendance, and POS |
| Member | Personal member portal |

Use the role selector in the top bar to switch views, and the branch selector to filter data. Changes are saved in the browser's `localStorage`; use **Reset demo data** in the sidebar to restore the sample dataset.

## Local development

```bash
npm install
npm run dev
```

The dev server binds to `0.0.0.0` on port `5173` so it works in containerized preview environments.

Useful commands:

```bash
npm run typecheck
npm run build
npm run preview
```

## Vercel deployment

The repository includes `vercel.json` with:

- Framework: `vite`
- Build command: `npm run build`
- Output directory: `dist`
- SPA catch-all rewrite to `index.html`

Deploy by importing this GitHub repository into Vercel, or create a Vercel project connected to the branch and use the defaults above. No environment variables are required for this demo.

## Prototype limitations

This is a front-end testing prototype, not a production backend. It does **not** implement real authentication, a server database, payment processing, SMS/WhatsApp delivery, biometric hardware, wearable sync, or medical advice. All AI features are deterministic demo generators. Digital QR patterns are visual only.
