import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  communities,
  communityMembers,
  discussionReplies,
  discussions,
  profiles,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { replyToDiscussionAction } from "@/app/actions";
import { Card, PageHeader, Tag, formatDate } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  const [row] = await db
    .select({
      discussion: discussions,
      community: communities,
      author: profiles,
    })
    .from(discussions)
    .innerJoin(communities, eq(discussions.communityId, communities.id))
    .innerJoin(profiles, eq(discussions.authorId, profiles.id))
    .where(eq(discussions.id, id))
    .limit(1);

  if (!row) notFound();

  const [membership, replies] = await Promise.all([
    db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, row.community.id),
          eq(communityMembers.userId, profile.id),
          eq(communityMembers.status, "active"),
        ),
      )
      .limit(1),
    db
      .select({
        id: discussionReplies.id,
        body: discussionReplies.body,
        createdAt: discussionReplies.createdAt,
        author: profiles.displayName,
        authorId: profiles.id,
      })
      .from(discussionReplies)
      .innerJoin(profiles, eq(discussionReplies.authorId, profiles.id))
      .where(eq(discussionReplies.discussionId, id))
      .orderBy(asc(discussionReplies.createdAt)),
  ]);

  const canReply = Boolean(membership[0]) || profile.role === "admin";

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={row.discussion.title}
        description={`${row.community.name} · ${row.author.displayName} · ${formatDate(row.discussion.createdAt)}`}
        action={
          <Button
            variant="outline"
            render={<Link href={`/communities/${row.community.slug}`} />}
          >
            Back to community
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2">
          {row.discussion.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
        <div className="mt-4 whitespace-pre-line text-sm leading-6">{row.discussion.body}</div>
      </Card>

      <h2 className="mt-6 mb-3 text-base font-semibold">
        {replies.length} {replies.length === 1 ? "reply" : "replies"}
      </h2>

      <div className="flex flex-col gap-3">
        {replies.map((reply) => (
          <Card key={reply.id}>
            <div className="flex items-center justify-between gap-2">
              <Link href={`/students/${reply.authorId}`} className="text-sm font-medium hover:underline">
                {reply.author}
              </Link>
              <span className="text-muted-foreground text-xs">{formatDate(reply.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">{reply.body}</p>
          </Card>
        ))}
        {!replies.length ? (
          <p className="text-muted-foreground text-sm">No replies yet. Be the first to respond.</p>
        ) : null}
      </div>

      {canReply ? (
        <Card className="mt-5">
          <form action={replyToDiscussionAction} className="flex flex-col gap-3">
            <input type="hidden" name="discussionId" value={id} />
            <textarea
              name="body"
              required
              rows={4}
              placeholder="Write a reply…"
              className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            <Button type="submit" className="self-start">
              Post reply
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="mt-5">
          <p className="text-sm font-medium">Join {row.community.name} to reply</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Community discussions are open to members.
          </p>
          <Button className="mt-3" render={<Link href={`/communities/${row.community.slug}`} />}>
            View community
          </Button>
        </Card>
      )}
    </div>
  );
}
