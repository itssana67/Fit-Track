# FitTrack

A full-stack personal fitness tracker built for a 3rd-year B.Tech CSE project. Users track workouts, meals, body measurements and goals; the dashboard turns that data into charts, streaks, achievements and rule-based recommendations.

Every feature goes through the full chain: **React → Axios → Express REST API → Prisma ORM → MongoDB**.

---

## 1. Project overview

| Part | What it does |
|------|--------------|
| `frontend/` | React 18 single-page app built with Vite, styled with Tailwind CSS v4, charts with Recharts |
| `backend/` | Express REST API with JWT authentication, input validation and a centralized error handler |
| Database | MongoDB, accessed only by the backend through Prisma ORM |
| External API | API Ninjas Exercises API, called **only** from the backend (the key never reaches the browser) |

## 2. Features

- **Landing page** with hero, features, how-it-works, stats and footer
- **Authentication**: register (name, email, password, age, gender, height, weight, activity level, fitness goal), login, logout, `GET /api/auth/me`. Passwords hashed with bcrypt; JWT stored in an **httpOnly cookie** (JavaScript cannot read it, which protects against XSS token theft)
- **Dashboard**: weight, BMI, calorie target, goal, streak, workouts completed, calories consumed/burned, goal progress %, four Recharts charts, quick actions (Log workout, Add meal, Update weight, Set goal)
- **Workout tracker**: CRUD, detail page, mark complete, exercises with sets / reps / weight / duration and muscle groups, calorie estimate (MET formula)
- **Nutrition tracker**: meal CRUD, day navigation, daily totals and progress bars against calorie and macro targets
- **Fitness calculator**: BMI (with categories), BMR (Mifflin-St Jeor), TDEE, goal-based calorie target and macros, with the formula shown
- **Progress tracker**: weight, waist, chest, arm, hip, body fat, charted over time
- **Goals**: CRUD, status tabs, progress bar (automatic for weight goals, manual for others)
- **Exercise library**: search, muscle / equipment / difficulty filters, cards, detail modal, add to a workout. Data comes from the external API through the backend, with a built-in fallback library
- **Recommendations**: rule-based engine (plain if/else business rules, **not** machine learning); every suggestion shows the rule that triggered it
- **Streaks and achievements**: First Workout, 7 Day Streak, 10 and 50 Workouts, 10 Meals Logged, First Goal Completed
- **Profile**: edit all personal details and change password
- Responsive layout (desktop, tablet, mobile drawer), toasts, loading, empty and error states

## 3. Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Tailwind CSS 4, React Router 6, Axios, Recharts, lucide-react, react-hot-toast |
| Backend | Node.js 18+, Express 4, jsonwebtoken, bcryptjs, cookie-parser, cors, helmet, express-rate-limit, morgan, dotenv |
| Database | MongoDB (Atlas or local replica set) with Prisma ORM 6 |
| External API | API Ninjas Exercises (`https://api.api-ninjas.com/v1/exercises`) |

## 4. Architecture

```
Browser (React)                     Express backend                         Data
─────────────────                   ───────────────────────────             ─────────────
Page component
  └─ services/fittrackApi.js  ──►   routes/*.routes.js
       └─ services/api.js             └─ middleware (auth, validate)
          (Axios, cookie)               └─ controllers/*.controller.js ──► Prisma Client ──► MongoDB
                                             └─ services/* (streaks,
                                                achievements, rules)
                                             └─ exerciseApi.service ──► API Ninjas (key in .env)
                              ◄──  JSON response  ◄── errorHandler (status codes)
```

### Folder structure

```
fittrack/
├── package.json                 # optional: run both apps with one command
├── README.md
├── backend/
│   ├── .env.example
│   ├── api-tests.http           # ready-made API requests (VS Code REST Client)
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma        # MongoDB models
│   │   └── seed.js              # sample data (demo user)
│   └── src/
│       ├── server.js            # connects to DB, starts the server
│       ├── app.js               # Express app: security, CORS, routes, errors
│       ├── controllers/         # business logic per feature
│       ├── routes/              # URL -> controller mapping, validation rules
│       ├── middleware/          # auth (JWT), validate, errorHandler
│       ├── services/            # stats, achievements, recommendations, external API
│       ├── utils/               # fitness formulas, dates, validation, tokens
│       ├── data/                # built-in exercise catalogue (47 exercises)
│       └── lib/                 # env loading, Prisma client singleton
└── frontend/
    ├── .env.example
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx             # entry: router, auth provider, toasts
        ├── App.jsx              # all routes
        ├── index.css            # Tailwind + design tokens
        ├── components/          # Navbar, Sidebar, DashboardCard, WorkoutCard, MealCard,
        │   │                    # ProgressChart, GoalCard, Modal, LoadingSpinner, ProtectedRoute ...
        │   └── forms/           # WorkoutForm, MealForm, ProgressForm, GoalForm
        ├── pages/               # one file per screen
        ├── layouts/             # AppLayout (sidebar), AuthLayout
        ├── services/            # api.js (Axios instance), fittrackApi.js (all endpoints)
        ├── hooks/               # useAuth, useApi, useDebounce
        ├── context/             # AuthContext
        └── utils/               # constants, formulas, formatting, error helpers
```

### Database models (Prisma)

`User` → many `Workout`, `Meal`, `Progress`, `Goal`, `UserAchievement`
`Workout` → many `WorkoutExercise` (each optionally linked to a catalogue `Exercise`)
`Achievement` ↔ `User` through `UserAchievement` (unique per user + achievement)

All IDs are MongoDB ObjectIds: `id String @id @default(auto()) @map("_id") @db.ObjectId`. Deleting a user cascades to their data.

## 5. MongoDB setup

Prisma's MongoDB connector **requires a replica set** (it uses transactions). Pick one option.

### Option A: MongoDB Atlas (easiest, free)

1. Create a free account at https://www.mongodb.com/cloud/atlas and create an **M0** cluster.
2. *Database Access* → add a database user with a password.
3. *Network Access* → add your IP (or `0.0.0.0/0` for testing).
4. *Connect* → *Drivers* → copy the connection string.
5. Add the database name `fittrack` before the `?`:

```
DATABASE_URL="mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/fittrack?retryWrites=true&w=majority"
```

If your password has special characters (`@ : / ? #`), URL-encode them (for example `@` becomes `%40`).

### Option B: Local MongoDB with Docker (single-node replica set)

```bash
docker run -d --name fittrack-mongo -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec -it fittrack-mongo mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

```
DATABASE_URL="mongodb://127.0.0.1:27017/fittrack?replicaSet=rs0&directConnection=true"
```

### Option C: Locally installed MongoDB

Start `mongod` with `--replSet rs0` (or add `replication: { replSetName: rs0 }` to `mongod.conf`), run `rs.initiate()` once in `mongosh`, then use the same URL as Option B.

## 6. Prisma setup

Run these inside `backend/` after setting `DATABASE_URL`:

```bash
npx prisma generate     # creates the Prisma Client from schema.prisma (also runs on npm install)
npx prisma db push      # creates the collections and indexes in MongoDB
npm run seed            # optional: loads sample data and the demo account
npx prisma studio       # optional: browse the data at http://localhost:5555
```

MongoDB has no SQL-style migrations, so Prisma uses `db push` instead of `prisma migrate`. Run `npx prisma generate` again whenever you change `schema.prisma`.

## 7. Environment variables

**backend/.env** (copy from `backend/.env.example`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `PORT` | `5000` | Port for Express |
| `NODE_ENV` | `development` | `production` enables secure cookies |
| `DATABASE_URL` | see section 5 | MongoDB connection string for Prisma |
| `JWT_SECRET` | long random string | Signs JWTs. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin(s), comma separated |
| `EXERCISE_API_KEY` | *(your key)* | API Ninjas key. Leave empty to use the built-in library |
| `EXERCISE_API_URL` | `https://api.api-ninjas.com/v1/exercises` | External API endpoint |

**frontend/.env** (copy from `frontend/.env.example`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL of the Express API |

Only variables starting with `VITE_` reach the browser, and this one holds no secrets. The API key and database URL exist only in `backend/.env`.

Get a free API Ninjas key at https://api-ninjas.com (sign up → *My Account* → API key).

## 8. Backend setup

```bash
cd backend
npm install                 # also runs prisma generate
cp .env.example .env        # Windows: copy .env.example .env
# edit .env: set DATABASE_URL and JWT_SECRET (and EXERCISE_API_KEY if you have one)
npx prisma db push
npm run seed                # optional sample data
npm run dev                 # http://localhost:5000
```

Check it works: open http://localhost:5000/api/health, which should return `{"status":"ok",...}`.

Shortcut: `npm run setup` runs generate + db push + seed in one go.

## 9. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # http://localhost:5173
```

## 10. API endpoints

All endpoints are prefixed with `/api`. 🔒 = requires login (JWT cookie or `Authorization: Bearer <token>`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/auth/register` | Create account, sets the JWT cookie |
| POST | `/auth/login` | Log in, sets the JWT cookie |
| GET | `/auth/me` 🔒 | Current user and calculated profile |
| POST | `/auth/logout` | Clears the cookie |
| GET / PUT | `/users/me` 🔒 | View / update profile |
| PUT | `/users/me/password` 🔒 | Change password |
| GET | `/dashboard?today=YYYY-MM-DD` 🔒 | All dashboard stats and chart data |
| GET | `/workouts` 🔒 | List (`?type=&status=completed\|planned&search=&from=&to=`) |
| POST | `/workouts` 🔒 | Create (optionally with an `exercises` array) |
| GET | `/workouts/:id` 🔒 | Details with exercises |
| PUT | `/workouts/:id` 🔒 | Update |
| DELETE | `/workouts/:id` 🔒 | Delete |
| PATCH | `/workouts/:id/complete` 🔒 | Body `{ "completed": true }` |
| POST | `/workouts/:id/exercises` 🔒 | Add one exercise |
| DELETE | `/workouts/:id/exercises/:entryId` 🔒 | Remove one exercise |
| GET | `/meals` 🔒 | List (`?date=` or `?from=&to=`) |
| GET | `/meals/summary?date=` 🔒 | Daily totals vs targets |
| POST | `/meals` 🔒 | Create |
| PUT / DELETE | `/meals/:id` 🔒 | Update / delete |
| GET / POST | `/progress` 🔒 | List / create measurement entry |
| PUT / DELETE | `/progress/:id` 🔒 | Update / delete |
| GET / POST | `/goals` 🔒 | List (`?status=`) / create |
| PUT / DELETE | `/goals/:id` 🔒 | Update / delete |
| GET | `/exercises` 🔒 | Library via external API (`?search=&muscle=&equipment=&difficulty=`) |
| GET | `/exercises/:id` 🔒 | One built-in exercise |
| GET | `/recommendations` 🔒 | Rule-based suggestions |
| GET | `/achievements` 🔒 | Achievements and streak stats |

Status codes: `200` OK, `201` created, `400` validation error (with an `errors` object per field), `401` not logged in, `403` blocked by CORS, `404` not found, `409` duplicate email, `429` too many login attempts, `500` server error.

## 11. How to run locally

Two terminals:

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Or from the project root, one terminal:

```bash
npm run install:all     # installs root, backend and frontend packages
npm run setup:db        # prisma generate + db push + seed (after creating backend/.env)
npm run dev             # starts both
```

Open http://localhost:5173. Click **Explore dashboard** or **Use demo account** to log in as the sample user:

- Email: `demo@fittrack.app`
- Password: `Demo@1234`

### Sample data

`backend/prisma/seed.js` creates the exercise catalogue, achievement definitions and a demo user (flagged `isSample: true`) with 6 weeks of workouts, 14 days of meals, 9 weekly measurements and 3 goals. Re-running the seed only replaces the sample user's data; real accounts are never touched. Remove sample data with `npm run seed:clear`.

## 12. How to build for production

```bash
# frontend: set VITE_API_URL to the deployed API first
cd frontend
npm run build          # output in frontend/dist (static files)
npm run preview        # test the build locally

# backend
cd backend
NODE_ENV=production npm start
```

- Host `frontend/dist` on any static host (Netlify, Vercel, Nginx). Add a rewrite of all paths to `index.html` so React Router works on refresh.
- Host the backend on Render, Railway or a VPS. Set all backend env variables there, with `NODE_ENV=production` and `CLIENT_URL` set to the frontend URL.
- In production the cookie uses `SameSite=None; Secure`, so **both sites must use HTTPS**.

---

## How the frontend connects to the backend

`frontend/src/services/api.js` creates one Axios instance with `baseURL = VITE_API_URL` and `withCredentials: true`, so the browser sends the httpOnly JWT cookie with every request. `services/fittrackApi.js` wraps every endpoint in a named function (`workoutApi.create`, `mealApi.summary` ...). Pages call these functions, usually through the `useApi` hook, which handles loading and error state. A 401 response triggers a global event that logs the user out. React never talks to MongoDB directly.

## How Prisma connects to MongoDB

`backend/prisma/schema.prisma` declares `provider = "mongodb"` and reads `url = env("DATABASE_URL")`. `npx prisma generate` builds a typed client in `node_modules/@prisma/client`. `src/lib/prisma.js` creates one shared `PrismaClient`, and `server.js` calls `prisma.$connect()` before starting Express. Controllers then run queries such as `prisma.workout.findMany({ where: { userId } })`, which Prisma translates into MongoDB operations.

## How to test the APIs

1. **VS Code REST Client**: open `backend/api-tests.http`, click *Send Request* on "Login" first (the cookie is kept), then run any other request.
2. **Postman / Thunder Client**: `POST http://localhost:5000/api/auth/login` with JSON `{"email":"demo@fittrack.app","password":"Demo@1234"}`. Copy the `token` from the response and add header `Authorization: Bearer <token>` to protected requests.
3. **curl**:

```bash
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"demo@fittrack.app","password":"Demo@1234"}' \
  http://localhost:5000/api/auth/login
curl -b cookies.txt http://localhost:5000/api/dashboard
```

## Common errors and solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `P2031: Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set` | Plain local `mongod` | Use Atlas, or start MongoDB with `--replSet rs0`, run `rs.initiate()` and add `?replicaSet=rs0&directConnection=true` (section 5) |
| `@prisma/client did not initialize yet` / `Cannot find module '.prisma/client'` | Client not generated | `cd backend && npx prisma generate` |
| `Missing environment variables: DATABASE_URL, JWT_SECRET` | No `backend/.env` | `cp .env.example .env` and fill in values |
| `Server selection timeout` / `ENOTFOUND` with Atlas | IP not allowed or wrong host | Add your IP under Atlas *Network Access*; re-copy the connection string |
| `Authentication failed` | Wrong DB user/password, or unencoded special characters | Reset the Atlas user password; URL-encode `@ : / ?` |
| Frontend shows "Cannot reach the FitTrack server" (`ERR_NETWORK`) | Backend not running or wrong `VITE_API_URL` | Start the backend; check `frontend/.env`; restart `npm run dev` after editing `.env` |
| `403 Not allowed by CORS` | Frontend URL not in `CLIENT_URL` | Add the exact origin (e.g. `http://localhost:5173`) to `CLIENT_URL` and restart the backend |
| Logged out right after login in production | Cookie blocked | Serve both apps over HTTPS, set `NODE_ENV=production` and the correct `CLIENT_URL` |
| Exercise library shows "built-in library" notice | No key, invalid key (401/403) or API down | Add a valid `EXERCISE_API_KEY` to `backend/.env` and restart; the app keeps working with the fallback |
| Demo login fails with "Incorrect email or password" | Seed not run | `cd backend && npm run seed` |
| `EADDRINUSE: address already in use :::5000` | Port taken | Stop the other process or change `PORT` (and `VITE_API_URL`) |
| `429` on login or register | Rate limiter (30 attempts per 15 minutes) | Wait 15 minutes or restart the backend in development |
| Page shows 404 after refresh on a deployed site | Static host lacks SPA rewrite | Rewrite all routes to `/index.html` |
