# WIN FTTH Mapping/Planner v5 — Full-Stack Test Build

This build upgrades the working v4 UI into a real API-backed application.

## Working features
- Admin login via API (`admin / admin123`)
- Field Technician CRUD: add, edit, delete, search/filter
- Field Job CRUD: add, edit, delete, assign, update status
- CRM CRUD: add, edit, delete customers
- FTTH Planner: add map elements, drag/save positions, plot fiber route, save/load plan
- Live browser GPS: sends technician coordinates to the API
- OTDR Fault Finder: calculates a point along the mapped route and records the fault
- QR NAP activation: camera QR where supported, with fallback test scanner
- Admin dashboard KPIs and activity log from stored data
- JSON export from the API
- Responsive desktop/tablet/mobile layout retained

## Local test (no database required)
Requires Node.js 18+.

```bash
npm install
npm start
```
Open `http://localhost:3000`

The local build automatically uses `data/db.json` for persistence. No MySQL or PostgreSQL is needed for local testing.

### Test accounts
- Admin: `admin` / `admin123`
- Field Technician test account: `fieldtech1` / `tech123`

## Vercel + persistent cloud database
Vercel serverless functions should use a persistent external PostgreSQL database rather than the local JSON file.

1. Create a PostgreSQL database.
2. Run `schema.sql` in that database.
3. In Vercel Project Settings → Environment Variables, set:
   - `DATABASE_URL` = your PostgreSQL connection string
   - `SESSION_SECRET` = a long random secret
4. Redeploy.

The API will automatically switch from Local JSON mode to PostgreSQL mode when `DATABASE_URL` is present.

## Important
The app is now functional end-to-end for testing, but production security still needs the final hardening pass (password reset, stronger account administration, audit policies, database backups, RLS/role policies, etc.).
