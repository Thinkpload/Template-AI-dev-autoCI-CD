# Database Migrations Safety Guide

This guide covers safe schema evolution with Prisma in this template.

---

## Creating a Migration

When you add or change models in `prisma/schema.prisma`, generate a migration:

```bash
npx prisma migrate dev --name <description>
```

**Example:**

```bash
npx prisma migrate dev --name add_projects
```

This will:

1. Generate a SQL migration file in `prisma/migrations/`
2. Apply it to your local database
3. Run the seed script (`prisma/seed.ts`) automatically

Always commit the generated `prisma/migrations/` files to git — they are the source of truth for your schema history.

---

## Rolling Back a Migration

Prisma does **not** automatically roll back applied migrations. To mark a migration as rolled back:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

**Example:**

```bash
npx prisma migrate resolve --rolled-back 20260329120000_add_projects
```

After marking as rolled back:

1. Manually revert the database changes if needed (Prisma will not do this for you)
2. Fix the migration file or delete it and regenerate with `prisma migrate dev`

---

## Resetting the Dev Database

> ⚠️ **Destructive — destroys all data. Dev only.**

```bash
npx prisma migrate reset
```

This will:

1. Drop the database
2. Re-run all migrations from scratch
3. Run the seed script automatically

Never run this in production or staging.

---

## Seed Script

The seed script (`prisma/seed.ts`) loads initial data for development.

```bash
npm run db:seed
```

**Idempotency rule:** The seed script must always use `upsert` (not `create`) so it can be run multiple times without errors or duplicate records. Never use `createMany` without a duplicate check.

The seed script also runs automatically after `prisma migrate dev` and `prisma migrate reset` because of the `"prisma": { "seed": "..." }` config in `package.json`.

---

## Rules

- **Never edit files inside `prisma/migrations/` manually.** Prisma validates migration checksums and will fail if files are modified.
- **Always commit migration files.** They track your schema history and enable safe rollbacks.
- **Seed scripts must be idempotent.** Use `upsert` with a unique field (`email`, `id`, etc.) as the `where` clause.
- **Schema changes tracked in git** (`prisma/migrations/`) — see FR48.

---

## Further Reading

- [Prisma Migrate docs](https://www.prisma.io/docs/orm/prisma-migrate)
- [Choosing ORM: Prisma vs Drizzle](./choosing-orm.md)
