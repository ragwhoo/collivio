import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import auth from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, type Profile } from "@/lib/db/schema";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Reads the Neon Auth session. Cached for the lifetime of a request.
 * Must be rendered dynamically (cookies are read).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const result = await auth.getSession();
    const user = result?.data?.user;
    if (!user?.id || !user.email) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? user.email.split("@")[0],
      image: user.image ?? null,
    };
  } catch {
    return null;
  }
});

/**
 * Returns the Collivio profile for the signed-in user, creating it on first
 * visit. Admin access is granted only through the ADMIN_EMAILS allowlist —
 * never to the first registered user.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, user.id))
    .limit(1);

  if (existing[0]) return existing[0];

  const role = adminEmails().includes(user.email.toLowerCase())
    ? "admin"
    : "student";

  const inserted = await db
    .insert(profiles)
    .values({
      authUserId: user.id,
      email: user.email,
      displayName: user.name,
      avatarUrl: user.image,
      role,
      onboarded: false,
    })
    .onConflictDoNothing({ target: profiles.authUserId })
    .returning();

  if (inserted[0]) return inserted[0];

  const raced = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, user.id))
    .limit(1);

  return raced[0] ?? null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in");
  if (profile.suspended) redirect("/account-suspended");
  return profile;
}

export async function requireRole(
  ...roles: Array<Profile["role"]>
): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  return requireRole("admin");
}

export async function requireBusiness(): Promise<Profile> {
  return requireRole("business", "admin");
}
