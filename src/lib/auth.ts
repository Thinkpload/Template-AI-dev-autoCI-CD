import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

// TODO: replace with prismaAdapter(db) from story 4.1
// Using in-memory adapter for UI-first development without a real DB

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
  },
  // In-memory stub — replace with prismaAdapter when story 4.1 is done
  database: memoryAdapter({
    user: [
      {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    session: [],
    account: [],
    verification: [],
  }),
});
