import Link from "next/link";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  conversationParticipants,
  messages,
  profiles,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const profile = await requireProfile();

  const myConversations = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, profile.id));

  const ids = myConversations.map((row) => row.conversationId);

  if (!ids.length) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Messages" description="Direct conversations with other students." />
        <EmptyState
          title="No conversations yet"
          description="Visit a student profile and start a conversation."
          action={<Button render={<Link href="/students" />}>Find students</Button>}
        />
      </div>
    );
  }

  const [others, lastMessages] = await Promise.all([
    db
      .select({
        conversationId: conversationParticipants.conversationId,
        userId: profiles.id,
        name: profiles.displayName,
      })
      .from(conversationParticipants)
      .innerJoin(profiles, eq(conversationParticipants.userId, profiles.id))
      .where(
        and(
          inArray(conversationParticipants.conversationId, ids),
          ne(conversationParticipants.userId, profile.id),
        ),
      ),
    db
      .select({
        conversationId: messages.conversationId,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(inArray(messages.conversationId, ids))
      .orderBy(desc(messages.createdAt)),
  ]);

  const otherByConversation = new Map(others.map((row) => [row.conversationId, row]));
  const lastByConversation = new Map<string, { body: string; createdAt: Date }>();
  for (const message of lastMessages) {
    if (!lastByConversation.has(message.conversationId)) {
      lastByConversation.set(message.conversationId, {
        body: message.body,
        createdAt: message.createdAt,
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Messages" description="Direct conversations with other students." />
      <div className="flex flex-col gap-3">
        {ids.map((id) => {
          const other = otherByConversation.get(id);
          const last = lastByConversation.get(id);
          return (
            <Link key={id} href={`/messages/${id}`}>
              <Card className="transition-colors hover:bg-secondary/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary flex size-10 items-center justify-center rounded-full text-sm font-medium">
                      {(other?.name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{other?.name ?? "Conversation"}</p>
                      <p className="text-muted-foreground line-clamp-1 text-sm">
                        {last?.body ?? "No messages yet"}
                      </p>
                    </div>
                  </div>
                  {last ? (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDateTime(last.createdAt)}
                    </span>
                  ) : null}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
