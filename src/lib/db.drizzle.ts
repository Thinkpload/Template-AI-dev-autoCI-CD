// DRIZZLE ALTERNATIVE — activate by: mv src/lib/db.drizzle.ts src/lib/db.ts
// Also update src/lib/auth.ts to use drizzleAdapter instead of prismaAdapter
// See docs/guides/choosing-orm.md for full migration steps

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
