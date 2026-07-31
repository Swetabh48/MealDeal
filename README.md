# MealDeal

**AI-powered personalized nutrition and fitness for real kitchens** — weekly meal plans, grocery lists, workouts, progress tracking, and an on-demand nutrition coach.

Live product goal: turn a short onboarding profile (goals, budget, cuisine prefs, hostel/mess constraints, workout style) into a **usable week of meals + shopping + training**, then help the user stick to it day by day.

---

## Table of contents

- [Product overview](#product-overview)
- [Tech stack](#tech-stack)
- [High-level architecture](#high-level-architecture)
- [How AI is used](#how-ai-is-used)
- [Domain model](#domain-model)
- [API surface](#api-surface)
- [App routes](#app-routes)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Design system notes](#design-system-notes)
- [Future system design](#future-system-design)
- [Contributing](#contributing)

---

## Product overview

| Area | What users get |
|------|----------------|
| **Onboarding** | Goals, macros context, budget, food prefs, hostel/mess menu (incl. image OCR), workout preferences → first plan |
| **Dashboard** | Today’s meals, check-ins / streaks, water & sleep, reminders |
| **Meal plan** | Full weekly plan, meal swap (“Shake it up”), grocery weekly/monthly, WhatsApp + PDF export |
| **Recipes** | Curated catalogs by style (keto, quick, vegetarian, …); add a recipe into today’s breakfast/lunch/dinner/snack slot |
| **Workouts** | Goal-aligned weekly schedule + logging |
| **Progress** | Weight / measurements + weekly rollup charts |
| **Tips** | Plan recommendations generated with the diet |
| **Dr. HealthAI** | Nutrition Q&A grounded in the user’s profile and clinical playbook |
| **Profile** | Edit preferences and regenerate as life changes |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 15** (App Router), **React 19**, TypeScript |
| Auth | **NextAuth.js v4** — Credentials (email/password), JWT sessions |
| Database | **MongoDB** via **Mongoose** |
| AI (runtime) | **Google Gemini** (`@google/generative-ai`) |
| UI | Tailwind CSS 4, Radix UI, Lucide, Framer Motion, Sonner, Recharts |
| Forms / validation | react-hook-form, Zod |
| Email (optional) | Nodemailer (SMTP) |
| Export | jsPDF + autotable (grocery PDF), WhatsApp deep links |
| Deploy target | Vercel-friendly Node serverless / Node server |

Package name in repo: `yelediet`. Product brand: **MealDeal**.

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (App Router pages + client components)             │
│  SessionProvider · localStorage TTL cache · notifications   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│  Next.js Route Handlers  (src/app/api/**)                   │
│  Auth gate · Zod/body parsing · domain services             │
└───────┬─────────────────────┬───────────────────┬───────────┘
        │                     │                   │
        ▼                     ▼                   ▼
   MongoDB              Gemini API           Optional SMTP
   (Mongoose            (diet · swap ·       (Sunday nudge)
    models)              doctor · workout ·
                         vision OCR)
```

**Design principles in the current codebase**

1. **Dual pipeline for diet** — Gemini generation (Path A) plus a deterministic rules planner (Path B). Results are validated/merged so users still get a plan when the model flakes or returns invalid JSON.
2. **Thin route handlers, fat libs** — Prompting, food DB, grocery extraction, and clinical chat live under `src/lib/**`, not in React components.
3. **Client resilience** — Hard navigations for auth/dashboard nav where SPA routing + first-compile latency felt “broken”; route `loading.tsx` shells; browser cache for recipes/meta.
4. **Optional integrations** — USDA/FDC enrichers, SMTP Sunday email, Manus design scripts — feature-flagged by env, never hard-required for core flows.

---

## How AI is used

Runtime key: **`GEMINI_API_KEY`**. Client: `src/lib/gemini.ts` with model fallbacks (`gemini-2.5-flash` → `gemini-2.5-pro` → `gemini-pro`).

| Capability | Entry point | What the model does |
|------------|-------------|---------------------|
| **Weekly meal plan** | `POST /api/diet/generate`, auto-regen | Builds a structured weekly plan from profile + constraints; merged with rules planner |
| **Meal swap / Shake it up** | `POST /api/meals/swap` | Suggests an alternate dish for a slot; **rules fallback** from food DB if Gemini fails |
| **Dr. HealthAI** | `POST /api/doctor/chat` | Nutrition coaching with profile context + clinical playbook (`src/lib/doctor-chat.ts`) |
| **Workouts** | `POST /api/workout/generate` | Weekly workout JSON aligned to goals / equipment prefs |
| **Custom meal enrichment** | `POST /api/meals/custom` | Estimates macros / light health notes for free-text meals |
| **Mess menu OCR** | `POST /api/extract-menu-text` | Vision model reads hostel/mess menu images during onboarding |
| **Recipe catalog** | Static JSON under `src/data/recipes/` | **Not** Gemini-generated at browse time; optional USDA enrichment in pipeline |
| **Tips** | Stored on `DietPlan.recommendations` | Produced during diet generation, not a separate chat endpoint |

**Not used at runtime (despite deps / scripts)**

- `openai` package — present in `package.json`, not wired in `src/`
- **Manus** (`MANUS_API_KEY` + `scripts/manus-*.js`) — design/exploration tooling for landing/theme; **not** product AI

---

## Domain model

Mongoose models under `src/models/`:

| Model | Responsibility |
|-------|----------------|
| `User` | Credentials + profile (goals, budget, cuisine, hostel/mess, workout prefs, onboarding flags) |
| `DietPlan` | Weekly meals, daily macros, supplements, `generationMeta`, `groceryList` |
| `WorkoutPlan` / `WorkoutLog` | Weekly schedule + completion logs |
| `Progress` | Weight, notes, photos, measurements |
| `DailyLog` | Water, sleep, notes by date key |
| `MealCheckIn` | Per-meal check-in + macros (unique per user/date/meal) |
| `CustomMeal` | User-logged meals + optional AI nutrition analysis |

---

## API surface

Grouped by domain (`src/app/api/`):

**Auth** — `POST /api/auth/register` · `GET|POST /api/auth/[...nextauth]`

**User / dashboard** — `GET|PUT /api/user/profile` · `GET /api/dashboard/bootstrap`

**Diet** — `GET /api/diet` · `POST /api/diet/generate` · `GET|POST /api/diet/auto-regenerate`

**Meals** — `POST /api/meals/swap` · `POST /api/meals/add-recipe` · `GET|POST|DELETE /api/meals/checkin` · `GET|POST /api/meals/custom`

**Doctor / vision** — `POST /api/doctor/chat` · `POST /api/extract-menu-text`

**Workout** — `GET /api/workout` · `POST /api/workout/generate` · `GET|POST /api/workout/log`

**Progress / daily** — `GET|POST /api/progress` · `GET /api/progress/weekly` · `GET|POST /api/daily-log`

**Recipes / reminders** — `GET /api/recipes` · `GET /api/recipes/[id]` · `POST /api/reminders/sunday-email`

---

## App routes

| Route | Role |
|-------|------|
| `/` | Marketing landing |
| `/login`, `/register` | Auth |
| `/onboarding` | Profile + first generation |
| `/dashboard` | Day-to-day home |
| `/meal-plan` | Week plan + grocery |
| `/recipes` | Recipe hub |
| `/workout` | Training |
| `/progress` | Body metrics |
| `/recommendations` | Tips |
| `/doctor-chat` | Dr. HealthAI |
| `/profile` | Settings |

`middleware.ts` currently edge-protects `/dashboard` and `/onboarding`; other app pages also gate on session client-side / in APIs.

---

## Repository layout

```
├── middleware.ts
├── src/
│   ├── app/                 # Pages + API route handlers + loading.tsx
│   ├── components/          # Feature UIs + ui/ (Radix/shadcn-style)
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── mongodb.ts       # DB connection
│   │   ├── gemini.ts        # Gemini client + model fallback
│   │   ├── diet/            # Dual pipeline, grocery, food DB, validators
│   │   ├── doctor-chat.ts
│   │   ├── workout-generator.ts
│   │   ├── meal-reminders.ts
│   │   ├── grocery-export.ts
│   │   └── mail.ts
│   ├── models/              # Mongoose schemas
│   ├── data/recipes/        # Static recipe catalogs
│   └── types/
├── scripts/                 # Optional design tooling (Manus)
└── public/
```

---

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- A Gemini API key

### Install & run

```bash
git clone https://github.com/Swetabh48/MealDeal.git
cd MealDeal
npm install
cp .env.example .env   # then fill in values
npm run dev:webpack    # stable local default
# or: npm run dev      # Turbopack
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

> **Dev tip:** Prefer a local disk checkout (not OneDrive-synced folders). Next.js compiles routes on first hit; cloud-synced directories make navigation feel hung.

---

## Environment variables

Create a `.env` (never commit it). Template: [`.env.example`](./.env.example).

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes | Mongo connection string |
| `NEXTAUTH_SECRET` | Yes | JWT signing |
| `NEXTAUTH_URL` | Yes | Auth canonical URL (e.g. `http://localhost:3000`) |
| `GEMINI_API_KEY` | Yes* | All AI features (`*` core product without AI is limited) |
| `USDA_API_KEY` / `FDC_API_KEY` | No | Optional nutrition enrichment |
| `EMAIL_SERVER` **or** `SMTP_*` + `EMAIL_FROM` | No | Sunday regen email |
| `MANUS_API_KEY` | No | Design scripts only |

---

## Design system notes

Landing and shell styling lean on a clay / soft-depth look (Fraunces + Outfit, forest + mango accents) in `src/app/globals.css`. Feature pages share mesh backgrounds and consistent meal/workout cards. Design exploration may use Manus scripts under `scripts/`; production UI remains first-party React.

---

## Future system design

Roadmap directions the codebase is already pointing toward:

### 1. Reliable generation at scale
- **Job queue** (Inngest / BullMQ / Cloud Tasks) for diet & workout generation so requests don’t block on multi-second Gemini calls
- **Server-side cache** (Redis) for identical profile hashes and recipe enrichments — today caching is mostly client `localStorage` TTL
- **Stricter JSON contracts** + schema validation (Zod) end-to-end; drop `ignoreBuildErrors` once types are clean

### 2. Auth & multi-tenant hardening
- OAuth (Google/Apple) beside credentials
- Expand **middleware** protection to all authenticated routes
- Rate-limit AI and auth endpoints; abuse budgets per user

### 3. Ops & lifecycle automation
- Real **cron** for Sunday auto-regen + email (today: client nudge + optional SMTP, session-gated auto-regen API)
- Observability: structured logs, tracing on Gemini latency/failures, product analytics
- Background stale-plan detection without requiring the user to open the app

### 4. Smarter personalization
- Feedback loop from check-ins / swaps / skips into the next week’s planner
- Stronger mess/hostel and budget constraints as first-class plan constraints
- Multi-language (package `next-intl` is present but unused)

### 5. Platform evolution
- Separate **BFF** or service layer if mobile clients appear
- Event-sourced meal adherence for better progress insights
- Optional OpenAI (or other) provider behind a provider interface — package already present, not abstracted yet

### 6. Product surface
- Forgot-password flow (route currently missing)
- Shared family / roommate grocery lists
- Coach or dietitian review mode on generated plans

---

## Contributing

1. Branch from `main`
2. Prefer small PRs (one feature or fix)
3. Do not commit `.env`, API keys, or Manus scratch JSON (see `.gitignore`)
4. Run the app locally and smoke-test: login → dashboard → meal plan → one AI action (swap or doctor chat)

---

## License

Private / unpublished unless otherwise stated by the repository owner.

---

**Repo:** [github.com/Swetabh48/MealDeal](https://github.com/Swetabh48/MealDeal)
