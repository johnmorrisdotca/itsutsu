import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth/google";

/**
 * Google sign-in for the operator. `proxy.ts` leaves /api/auth open, because
 * a sign-in route nobody can reach without signing in first is of no use.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
