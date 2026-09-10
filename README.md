# WIN FTTH Mapping/Planner v5 — Vercel FIXED

Vercel-ready deployment for the WIN FTTH Mapping/Planner v5.

## Demo login
- Admin: `admin` / `admin123`
- Field Technician: `fieldtech1` / `tech123`

## Vercel
The `/api` folder is a Vercel serverless function. For shared persistent production data, configure `DATABASE_URL` to a PostgreSQL database and `SESSION_SECRET` to a strong random secret.

Without `DATABASE_URL`, the app uses a seeded in-memory fallback so login/API endpoints remain testable after deployment. This fallback is not persistent across serverless instances.

## Local
```bash
npm install
npm start
```
Open http://localhost:3000
