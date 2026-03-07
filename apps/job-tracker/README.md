# Template: Client + Server + Database

The complete factory unit. Express 5 backend, Vue 3 frontend, and a database connection. Use this for apps that need persistent storage.

**Tier 3** — full-stack with database.

## Stack

Express 5 + Vue 3 + Vite + Pinia + Prisma + Postgres + tsx (dev hot-reload)

## Usage

```sh
pnpm dev        # starts server and Vite dev server in parallel
pnpm build      # compile both server and Vue client
pnpm start      # run production build
pnpm test       # run tests
```

## Notes

- Prisma schema lives in this app's folder (not centralized)
- Requires a Postgres connection string in the environment
