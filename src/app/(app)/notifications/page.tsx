import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await requireProfile();

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, profile.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const unread = rows.filter((row) => !row.readAt).length;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Notifications"
        description={
          unread ? `${unread} unread notification${unread === 1 ? "" : "s"}.` : "You're all caught up."
        }
        action={
          unread ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="outline">
                Mark all read
              </Button>
            </form>
          ) : null
        }
      />

      {rows.length ? (
        <div className="flex flex-col gap-2">
          {rows.map((notification) => {
            const content = (
              <Card
                className={
                  notification.readAt
                    ? "transition-colors hover:bg-secondary/40"
                    : "border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    {notification.body ? (
                      <p className="text-muted-foreground mt-1 text-sm">{notification.body}</p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.readAt ? (
                    <span className="bg-primary mt-1 size-2 shrink-0 rounded-full" />
                  ) : null}
                </div>
              </Card>
            );

            return (
              <div key={notification.id} className="flex items-stretch gap-2">
                <div className="flex-1">
                  {notification.href ? (
                    <Link href={notification.href}>{content}</Link>
                  ) : (
                    content
                  )}
                </div>
                {!notification.readAt ? (
                  <form action={markNotificationReadAction.bind(null, notification.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-full">
                      Mark read
                    </Button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No notifications"
          description="Activity on your applications, projects and community posts will appear here."
        />
      )}
    </div>
  );
}
