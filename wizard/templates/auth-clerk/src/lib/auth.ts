// Clerk auth — configured via environment variables
// Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env

export { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
export { useAuth, useUser, useSession } from '@clerk/nextjs';
