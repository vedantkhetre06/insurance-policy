# Insurance Policy Management System (merged)

React (Vite) UI from `insurance-policy-react` + the PostgreSQL/Express/role-based-auth backend from `IPMS_gemini`.
All data (users, policies, claims, dashboard figures) is read from and written to PostgreSQL.

## Setup
```bash
# 1. PostgreSQL: create an empty database (existing ipms databases are reused, never reset)
createdb ipms

# 2. Backend
cd backend
cp .env.example .env        # set PGPASSWORD and JWT_SECRET
npm install
npm run db:setup            # base schema (only if absent) + additive migration, safe to re-run
npm run db:seed             # optional demo data, only if there are no policies yet
npm start                   # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :5000)
```
Register the first account as **Administrator** (later admin self-signup is blocked unless `ALLOW_ADMIN_SIGNUP=true`).
Holders and vendors can self-register. Production build: `npm run build` in `frontend` (set `VITE_API_URL` if the API is on another origin).

## Roles
| Role | Can do |
|---|---|
| admin | Dashboard (all data), policy CRUD, all claims, approve/reject, calculator |
| holder | Own dashboard, create/view own policies, file/view own claims, calculator |
| vendor | Assess pending claims (pending ⇄ assessing), calculator |

## API (all except `/auth/*` need `Authorization: Bearer <token>`)
`POST /api/auth/register|login` · `GET|POST /api/policies` · `GET|PUT|DELETE /api/policies/:id` (`?type=&status=&search=`) ·
`POST /api/calculate-premium` · `GET|POST /api/claims` (`?status=`) · `PUT /api/claims/:id/status` · `GET /api/dashboard` · `GET /api/health`

## Changes vs. the originals
- Premium rating logic moved to `backend/premium.js` unchanged; the server now computes premiums on create/update (client-sent premiums are ignored).
- `migrations/001_*.sql` adds columns/sequences to `policies` and `claims` (additive, idempotent, backfills numbers for existing rows).
- Auth: the original trusted `x-user-id`/`x-user-role` headers and stored plaintext passwords. It now uses signed bearer tokens and scrypt hashes; existing plaintext passwords still work and are upgraded on first login.
- DB credentials moved from source code to `.env`. Deleting a policy also deletes its claims (existing FK `ON DELETE CASCADE`).

## Tests
`cd backend && npm test` runs DB-free checks (auth, roles, validation, premium maths). CRUD persistence requires a live PostgreSQL and is not covered by this command.
