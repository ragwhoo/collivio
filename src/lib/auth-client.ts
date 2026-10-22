"use client";

import { createAuthClient } from "@neondatabase/auth";

// Neon Auth is served by the app's catch-all route at /api/auth/*.
// Created lazily in the browser so SSR never attempts to parse a relative URL.
export function getAuthClient() {
  return createAuthClient(`${window.location.origin}/api/auth`);
}