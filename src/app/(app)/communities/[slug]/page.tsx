import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  communities,
  communityMembers,
  discussions,
  profiles,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import {
  createDiscussionAction,
  joinCommunityAction,
} from "@/app/actions";
import { Card, EmptyState, PageHeader, Tag, formatDate } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireProfile();

  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1);

  if (!community) notFound();

  const [membership, memberCount, posts] = await Promise.all([
    db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, community.id),
          eq(communityMembers.userId, profile.id),
        ),
      )
      .limit(1),
    db
      .select({ value: count() })
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, community.id),
          eq(communityMembers.status, "active"),
        ),
      ),
    db
      .select({
        id: discussions.id,
        title: discussions.title,
        body: discussions.body,
        pinned: discussions.pinned,
        createdAt: discussions.createdAt,
        author: profiles.displayName,
      })
      .from(discussions)
      .innerJoin(profiles, eq(discussions.authorId, profiles.id))
      .where(eq(discussions.communityId, community.id))
      .orderBy(desc(discussions.pinned), desc(discussions.createdAt))
      .limit(50),
  ]);

  const active = membership[0]?.status === "active";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={community.name}
        description={community.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {Number(memberCount[0]?.value ?? 0)} members
            </span>
            {!membership[0] ? (
              <form action={joinCommunityAction.bind(null, community.id)}>
                <Button type="submit">
                  {community.joinPolicy === "request" ? "Request to join" : "Join community"}
                </Button>
              </form>
            ) : (
              <span className="text-primary text-sm font-medium capitalize">
                {membership[0].status === "active" ? "Joined" : "Request pending"}
              </span>
            )}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Tag>{community.category}</Tag>
        {community.college ? <Tag>{community.college}</Tag> : null}
        <Tag>{community.joinPolicy} membership</Tag>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          {posts.length ? (
            posts.map((post) => (
              <Link key={post.id} href={`/discussions/${post.id}`}>
                <Card className="transition-colors hover:bg-secondary/40">
                  <div className="flex items-center gap-2">
                    {post.pinned ? (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">
                        Pinned
                      </span>
                    ) : null}
                    <h2 className="font-medium">{post.title}</h2>
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{post.body}</p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {post.author} · {formatDate(post.createdAt)}
                  </p>
                </Card>
              </Link>
            ))
          ) : (
            <EmptyState title="No discussions yet" description="Start the first conversation." />
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {active ? (
            <Card>
              <h2 className="text-base font-semibold">Start a discussion</h2>
              <form action={createDiscussionAction} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="communityId" value={community.id} />
                <input
                  name="title"
                  required
                  placeholder="Discussion title"
                  className="bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
                <textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="Share your question or idea…"
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
                <input
                  name="tags"
                  placeholder="Tags (comma separated)"
                  className="bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
                <Button type="submit">Post discussion</Button>
              </form>
            </Card>
          ) : (
            <Card>
              <p className="text-sm font-medium">Join to participate</p>
              <p className="text-muted-foreground mt-1 text-sm">
                You need active membership to start discussions or reply.
              </p>
            </Card>
          )}

          {community.guidelines ? (
            <Card>
              <h2 className="text-sm font-semibold">Guidelines</h2>
              <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm">
                {community.guidelines}
              </p>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
