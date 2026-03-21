# Household Finance Tracker

A production-oriented Next.js + Supabase web app to track shared household finances, parse receipts with AI OCR, and export yearly reporting.

## Features
- Supabase Auth: email/password + Google OAuth + recovery.
- Profile editing: username, first name, last name, email, password.
- Household lifecycle: create/list/switch-ready data model, invite by email token, accept invite.
- Expense management with user-extendable categories and tags.
- AI receipt parsing endpoint that auto-fills merchant/date/total.
- Analytics dashboard: yearly total, category split, monthly trends.
- Export API for CSV and XLSX.

## Project Structure

```text
app/
  middleware.ts
  api/
    auth/{register,login,google,recover}/route.ts
    user/profile/route.ts
    households/{route.ts,invite/route.ts,join/route.ts}
    expenses/{route.ts,[id]/route.ts}
    export/{csv/route.ts,xlsx/route.ts}
    ocr/parse/route.ts
  dashboard/page.tsx
  expenses/{page.tsx,new/page.tsx,[id]/page.tsx}
  households/page.tsx
  invite/page.tsx
  login/page.tsx
  register/page.tsx
  recover/page.tsx
  profile/page.tsx
components/
  charts/{FlexibleAnalyticsChart,SpendByCategoryChart}.tsx
  ui/{Button,Input}.tsx
lib/
  api/{helpers,export}.ts
  ai/receipt.ts
  supabase/{client,server}.ts
supabase/
  config.toml
  migrations/001_init.sql
  migrations/002_repair_existing_project.sql
```

## API Endpoints
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `POST /api/auth/recover`
- User: `GET /api/user/profile`, `PUT /api/user/profile`
- Households: `POST /api/households`, `GET /api/households`, `POST /api/households/invite`, `POST /api/households/join`
- Expenses: `POST /api/expenses`, `GET /api/expenses`, `GET /api/expenses/:id`, `PUT /api/expenses/:id`, `DELETE /api/expenses/:id`
- Export: `GET /api/export/csv`, `GET /api/export/xlsx`

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill env values with your Supabase project keys and optional OpenAI API key.
4. Apply SQL migration in Supabase SQL editor (`supabase/migrations/001_init.sql`) for a fresh database.
5. Run dev server:
   ```bash
   npm run dev
   ```

## Supabase Notes
- Create storage bucket: `expense-files`.
- Configure Google OAuth in Supabase Auth provider settings.
- Configure SMTP in Supabase Auth for transactional invite/recovery emails.
- Add this redirect URL in Supabase Auth settings: `http://localhost:3000/auth/callback` (and your production `/auth/callback` URL).
- If you want to skip email confirmation while testing, in Supabase Dashboard go to **Authentication → Providers → Email** and turn off **Confirm email**.
- This project expects `public.users` to mirror `auth.users`. The migration now creates `handle_new_auth_user` trigger and also backfills existing auth users.
- If you already have tables and see `relation "users" already exists`, do **not** re-run `001_init.sql`; run `supabase/migrations/002_repair_existing_project.sql` instead.
- `002_repair_existing_project.sql` is safe for existing projects: it re-creates trigger/policies idempotently, re-backfills `public.users`, and re-applies grants/RLS.

## Deploy to Vercel
1. Push repository to Git provider.
2. Import project in Vercel.
3. Configure environment variables from `.env.example`.
4. Set Auth redirect URLs in Supabase to deployed Vercel domain.
5. Deploy.

## OCR Behavior
`POST /api/ocr/parse` accepts multipart file upload. If `OPENAI_API_KEY` is available, it calls the model for structured extraction (`merchant`, `date`, `total`, optional `items`).
