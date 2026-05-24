# Juarez Barber

A full-stack barbershop management and booking platform for "Juarez Barber" — serving clients who want to book appointments and admins who manage the shop, finances, and team.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/juarez-barber run dev` — run the frontend (port 25955)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with JWT + bcryptjs auth
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + wouter routing + react-query + shadcn/ui
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (one file per entity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/juarez-barber/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not hand-edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not hand-edit)

## Seed credentials

- Admin: admin@juarezbarber.com / admin123
- Client: cliente@email.com / cliente123

## Architecture decisions

- JWT stored in localStorage under key `juarez_barber_token`, injected via `custom-fetch.ts`
- Drizzle ORM with Drizzle-Zod for type-safe DB access; no Prisma
- Commission records auto-created when a sale is registered, based on barber's `commissionRate`
- All financial endpoints admin-only; client users can only manage their own appointments
- OpenAPI-first: change `openapi.yaml` → run codegen → both frontend hooks and server Zod schemas update

## Product

- **Clients:** Browse barbershops, view services and barbers, book appointments, track booking status
- **Admin/Owner:** Dashboard with live stats, full schedule management, barber and service CRUD, financial module (sales, expenses, commissions, DRE charts)

## User preferences

- JWT auth (not Clerk/Replit Auth) — explicit user request
- Backend: Express + Drizzle (not Prisma as originally spec'd — Drizzle is the workspace standard)
- Docker not used (Replit environment — built-in PostgreSQL)

## Gotchas

- After editing `openapi.yaml`, always run codegen before building backend routes
- `pnpm run typecheck:libs` must run before `pnpm --filter @workspace/api-server run typecheck` (lib types must be emitted first)
- Commission records cascade-deleted when a sale is deleted
