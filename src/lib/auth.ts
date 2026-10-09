import { createNeonAuth } from "@neondatabase/auth/next/server";

// Initialize Neon Auth with configuration
// The baseUrl should point to your Neon Auth deployment
// The cookies.secret is used for signing session cookies
const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "http://localhost:3000",
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      "collivio-dev-secret-key-change-me-0123456789",
    // Optional: TTL for session cache in seconds (default: 300)
    // sessionDataTtl: 300,
  },
} as const);

export default auth;