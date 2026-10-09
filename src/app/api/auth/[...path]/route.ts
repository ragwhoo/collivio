import auth from "@/lib/auth";

// Neon Auth catch-all handler for /api/auth/*
// Handles sign-in, sign-up, sign-out, session, OAuth callbacks, etc.
export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();