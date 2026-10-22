import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { createCommunityAction, joinCommunityAction } from "@/app/actions";
import { Card, EmptyState, PageHeader, Tag } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function CommunitiesPage() {
  const profile = await requireProfile();

  const [rows, memberCounts, myMemberships] = await Promise.all([
    db
      .select({
        id: communities.id,
        slug: communities.slug,
        name: communities.name,
        description: communities.description,
        category: communities.category,
        joinPolicy: communities.joinPolicy,
        college: communities.college,
        createdAt: communities.createdAt,
      })
      .from(communities)
      .orderBy(desc(communities.createdAt))
      .limit(60),
    db
      .select({ communityId: communityMembers.communityId, value: sql<number>`count(*)` })
      .from(communityMembers)
      .where(eq(communityMembers.status, "active"))
      .groupBy(communityMembers.communityId),
    db
      .select({ communityId: communityMembers.communityId, status: communityMembers.status })
      .from(communityMembers)
      .where(eq(communityMembers.userId, profile.id)),
  ]);

  const counts = new Map(memberCounts.map((row) => [row.communityId, Number(row.value)]));
  const mine = new Map(myMemberships.map((row) => [row.communityId, row.status]));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Communities"
        description="College communities, departments, clubs and shared-interest spaces."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.length ? (
            rows.map((community) => {
              const membership = mine.get(community.id);
              return (
                <Card key={community.id} className="flex h-full flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag>{community.category}</Tag>
                    {community.college ? <Tag>{community.college}</Tag> : null}
                  </div>
                  <Link href={`/communities/${community.slug}`} className="mt-3 hover:underline">
                    <h2 className="text-lg font-semibold">{community.name}</h2>
                  </Link>
                  <p className="text-muted-foreground mt-1 line-clamp-3 flex-1 text-sm">
                    {community.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">
                      {counts.get(community.id) ?? 0} members
                    </span>
                    {membership === "active" ? (
                      <span className="text-primary text-xs font-medium">Joined</span>
                    ) : membership === "pending" ? (
                      <span className="text-muted-foreground text-xs">Request pending</span>
                    ) : (
                      <form action={joinCommunityAction.bind(null, community.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          {community.joinPolicy === "request" ? "Request to join" : "Join"}
                        </Button>
                      </form>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="sm:col-span-2">
              <EmptyState
                title="No communities yet"
                description="Create the first community for your college or interest."
              />
            </div>
          )}
        </div>

        <aside>
          <Card className="sticky top-20">
            <h2 className="text-base font-semibold">Create a community</h2>
            <form action={createCommunityAction} className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Name</span>
                <input name="name" required className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Description</span>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Category</span>
                <input name="category" defaultValue="general" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">College (optional)</span>
                <input name="college" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Join policy</span>
                <select name="joinPolicy" className={input}>
                  <option value="open">Open</option>
                  <option value="request">Request approval</option>
                  <option value="invite">Invite only</option>
                </select>
              </label>
              <Button type="submit">Create community</Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
