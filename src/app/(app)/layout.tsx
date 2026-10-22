import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  const [unread] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, profile.id),
        isNull(notifications.readAt),
      ),
    );

  return (
    <AppShell
      profile={{
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
      }}
      unreadCount={Number(unread?.value ?? 0)}
    >
      {children}
    </AppShell>
  );
}
