import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  conversationParticipants,
  messages,
  profiles,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { sendMessageAction } from "@/app/actions";
import { Card, PageHeader, formatDateTime } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, id),
        eq(conversationParticipants.userId, profile.id),
      ),
    )
    .limit(1);

  if (!participant) notFound();

  const [other] = await db
    .select({
      userId: profiles.id,
      name: profiles.displayName,
    })
    .from(conversationParticipants)
    .innerJoin(profiles, eq(conversationParticipants.userId, profiles.id))
    .where(
      and(
        eq(conversationParticipants.conversationId, id),
        ne(conversationParticipants.userId, profile.id),
      ),
    )
    .limit(1);

  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      sender: profiles.displayName,
    })
    .from(messages)
    .innerJoin(profiles, eq(messages.senderId, profiles.id))
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .limit(200);

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, id),
        ne(messages.senderId, profile.id),
        isNull(messages.readAt),
      ),
    );

  return (
    <div className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-3xl flex-col">
      <PageHeader
        title={other?.name ?? "Conversation"}
        description={other ? "Private conversation" : "Conversation"}
        action={
          other ? (
            <Button variant="outline" render={<Link href={`/students/${other.userId}`} />}>
              View profile
            </Button>
          ) : null
        }
      />

      <div className="flex flex-1 flex-col gap-3">
        {rows.map((message) => {
          const mine = message.senderId === profile.id;
          return (
            <div
              key={message.id}
              className={mine ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  mine
                    ? "bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2"
                    : "bg-secondary max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2"
                }
              >
                {!mine ? (
                  <p className="text-muted-foreground mb-0.5 text-xs">{message.sender}</p>
                ) : null}
                <p className="whitespace-pre-line text-sm">{message.body}</p>
                <p
                  className={
                    mine
                      ? "mt-1 text-right text-[10px] opacity-70"
                      : "text-muted-foreground mt-1 text-[10px]"
                  }
                >
                  {formatDateTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {!rows.length ? (
          <Card>
            <p className="text-muted-foreground text-sm">
              No messages yet. Say hello to start the conversation.
            </p>
          </Card>
        ) : null}
      </div>

      <Card className="mt-4">
        <form action={sendMessageAction} className="flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="conversationId" value={id} />
          <textarea
            name="body"
            required
            rows={2}
            placeholder="Write a message…"
            className="bg-background min-h-10 flex-1 resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
          <Button type="submit" className="sm:self-end">
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
