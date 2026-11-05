# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Each route component (Activities, Teams, Leaderboard, Workouts) loads data only through the shared `getJson` client with relative `/api` paths, and renders a `role="status"` loading message, a "No …" empty state, and a `role="alert"` error; no direct `fetch` calls or business logic in components.
- Logic tier decision: Express routes in `src/routes/api.ts` stay thin and delegate to `src/services/octofitService.ts`; services validate input and throw errors with an explicit status (400/404) that the router maps to JSON responses, so cast errors never surface as 500s.
- Data tier decision: Mongoose models declare required fields (User: name, email, fitnessGoal; Team: name, mascot, members[]; Activity: user, team, type, minutes, points, occurredAt; Workout: title, focus, minutes, difficulty) and `seed.ts` upserts representative data idempotently on MongoDB port 27017.
- Activity tracking approach: `POST /api/activities` checks `userId`/`teamId` with `isValidObjectId` and confirms both documents exist (400 otherwise), validates `type` and positive `minutes`, computes `points` from minutes, sets `occurredAt`, and returns 201; `GET` lists activities.
- Team management approach: `POST /api/teams` rejects a missing `name` with 400, stores `name`, `mascot`, and member user IDs, and returns 201; `GET /api/teams` lists teams with populated members.
- Leaderboard approach: Aggregate activities grouped by team summing `points`, join team names, sort by `totalPoints` descending, and assign a 1-based `rank` to each `{ teamName, totalPoints, rank }` entry.
- Workout suggestions approach: Look up the user by email (404 if missing), derive the dominant focus from their recent activity types (falling back to `fitnessGoal`), return matching workouts first, and attach a `reason` explaining the match.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — baseline: 4 of 5 fail because models lack required-field validation; seeding already passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` — baseline: 4 of 4 fail (create returns 501 instead of 400, empty leaderboard, workout suggestions ignore user activity).
- Frontend command: `npm test --prefix octofit-tracker/frontend` — baseline: 15 of 15 fail because routes render "Implementation pending" instead of API data with loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — type-checks the logic and data tiers; a failure means a contract or type mismatch.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — type-checks and bundles the presentation tier; a failure means a component or client typing error.
