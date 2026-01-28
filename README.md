# QRgency – QR + Emergency

Production-quality MVP for instant emergency information via QR codes on vehicles and helmets.

## Stack

- **Frontend**: Next.js App Router (TypeScript), Tailwind CSS, Framer Motion
- **Backend**: Next.js route handlers + Supabase (PostgreSQL + Auth)
- **Database**: Supabase Postgres using a single schema file `qrgency_supabase_schema.sql`

## Features

- User registration + login (Supabase auth)
- **Mobile OTP verification** for phone numbers
- Emergency profile wizard (guardian, medical info, critical instructions)
- One-time QR activation (₹10) with:
  - First 1000 activations free
  - Concurrency-safe global counter (starts at 10158200)
  - Secure random QR token (no PII in QR)
- Public, read-only **emergency scan page** at `/e/[token]`
- Admin panel at `/admin` with:
  - Login via `admins` table (hashed passwords)
  - Metrics: users, free vs paid, revenue, QR count
  - Recent users & scans
  - Ability to **disable / re-enable** any QR

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Stripe keys are no longer required – payments are mocked in-app.

### 3. Apply database schema

1. Open the Supabase SQL editor for your project.
2. Paste the contents of `qrgency_supabase_schema.sql`.
3. Run the script once to create all tables, policies, and functions:
   - `profiles`, `emergency_profiles`, `medical_info`, `emergency_notes`
   - `emergency_contacts`, `qr_codes`, `payments`, `customer_counter`
   - `scan_logs`, `admins`, `mobile_verification`

The `customer_counter` is seeded so the first activated user gets activation number **10158200**.

### 4. Seed an admin user

In Supabase SQL editor, create an initial admin (password is `admin123` in this example, hashed with bcrypt):

```sql
insert into public.admins (email, password_hash)
values (
  'admin@gmail.com',
  '$2b$10$kB4Q7iZ3L1dS7pW8Sx5o9e6q3gD8FpX7eFJ0vXlYbqYkbtq3lF2u' -- replace with your own bcrypt hash
);
```

You can generate a bcrypt hash locally using Node or any online tool and replace the value above.

### 5. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Core Flows

- **User onboarding**: Register → mobile OTP → dashboard → emergency profile → activate QR.
- **Activation**: Dashboard opens a modal which calls `/api/activate`. The backend:
  - Verifies mobile is OTP-verified
  - Atomically increments `customer_counter`
  - Marks profile as paid / free
  - Generates a secure QR token (if needed)
  - Records a payment row (mock) in `payments`
- **Emergency scan**: `/e/[token]` renders a fast, mobile-first page with:
  - Name, age, language note
  - Blood group (highlighted)
  - Allergies (red alert card)
  - Medical conditions & medications
  - Critical emergency instruction note (very prominent)
  - Call guardian / emergency contact buttons
  - Fixed 112 buttons for Ambulance, Police, Fire

## Admin Panel

- Go to `/admin` and log in with your seeded admin account.
- Dashboard lets you:
  - View total users, free vs paid activations, QR count, and estimated revenue.
  - Search users by mobile number.
  - See QR token + active/disabled status per user.
  - Toggle QR active state via the **Disable QR / Enable QR** button.
  - Inspect recent scan logs (token, time, IP).

## Notes

- Mobile OTP is implemented as a **mock** flow:
  - OTP codes are stored hashed in `mobile_verification`.
  - Codes are logged to the server console for development.
  - Swap in an SMS provider later without changing the main app logic.
- Payments are **mocked**:
  - First 1000 activations are free.
  - Later activations record a ₹10 mock payment in `payments`.
  - The activation flow remains concurrency-safe via the `complete_activation` database function.
