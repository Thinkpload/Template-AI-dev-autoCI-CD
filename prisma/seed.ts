import { db } from '../src/lib/db';

async function main() {
  // Demo user — upsert guarantees idempotency (no duplicate on re-run)
  const demoUser = await db.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      emailVerified: false,
    },
  });
  console.log('Seeded user:', demoUser.email);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
