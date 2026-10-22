import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  events,
  mediaPosts,
  opportunities,
  organizations,
  profiles,
  projects,
  resources,
} from "@/lib/db/schema";
import { resolveStorageUrl } from "@/lib/storage";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Tag,
  formatDate,
  formatDateTime,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const now = new Date();

  const [
    opportunityStats,
    projectStats,
    mediaStats,
    eventStats,
    resourceStats,
    latestOpportunities,
    latestProjects,
    latestMedia,
    latestEvents,
    latestResources,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${opportunities.status} = 'published')`.mapWith(
          Number,
        ),
        draft: sql<number>`count(*) filter (where ${opportunities.status} = 'draft')`.mapWith(Number),
      })
      .from(opportunities),
    db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${projects.status} = 'published')`.mapWith(
          Number,
        ),
      })
      .from(projects),
    db
      .select({ total: count() })
      .from(mediaPosts)
      .where(sql`${mediaPosts.deletedAt} is null`),
    db
      .select({
        total: count(),
        upcoming: sql<number>`count(*) filter (where ${events.startsAt} >= ${now})`.mapWith(Number),
      })
      .from(events),
    db.select({ total: count() }).from(resources),
    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
        status: opportunities.status,
        createdAt: opportunities.createdAt,
        orgName: organizations.name,
      })
      .from(opportunities)
      .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
      .orderBy(desc(opportunities.createdAt))
      .limit(8),
    db
      .select({
        id: projects.id,
        title: projects.title,
        category: projects.category,
        status: projects.status,
        visibility: projects.visibility,
        createdAt: projects.createdAt,
        author: profiles.displayName,
      })
      .from(projects)
      .innerJoin(profiles, eq(projects.ownerId, profiles.id))
      .orderBy(desc(projects.createdAt))
      .limit(6),
    db
      .select({
        id: mediaPosts.id,
        caption: mediaPosts.caption,
        imageUrl: mediaPosts.imageUrl,
        visibility: mediaPosts.visibility,
        createdAt: mediaPosts.createdAt,
        author: profiles.displayName,
      })
      .from(mediaPosts)
      .innerJoin(profiles, eq(mediaPosts.authorId, profiles.id))
      .where(sql`${mediaPosts.deletedAt} is null`)
      .orderBy(desc(mediaPosts.createdAt))
      .limit(6),
    db
      .select({
        id: events.id,
        title: events.title,
        type: events.type,
        startsAt: events.startsAt,
        location: events.location,
        organizer: profiles.displayName,
      })
      .from(events)
      .innerJoin(profiles, eq(events.organizerId, profiles.id))
      .orderBy(desc(events.startsAt))
      .limit(6),
    db
      .select({
        id: resources.id,
        title: resources.title,
        category: resources.category,
        createdAt: resources.createdAt,
        author: profiles.displayName,
      })
      .from(resources)
      .innerJoin(profiles, eq(resources.authorId, profiles.id))
      .orderBy(desc(resources.createdAt))
      .limit(6),
  ]);

  const mediaWithThumbs = await Promise.all(
    latestMedia.map(async (post) => ({
      ...post,
      imageUrl: (await resolveStorageUrl(post.imageUrl)) ?? null,
    })),
  );

  const tiles = [
    {
      label: "Live listings",
      value: Number(opportunityStats[0]?.published ?? 0),
      hint: `${Number(opportunityStats[0]?.total ?? 0)} total · ${Number(opportunityStats[0]?.draft ?? 0)} draft`,
    },
    {
      label: "Published projects",
      value: Number(projectStats[0]?.published ?? 0),
      hint: `${Number(projectStats[0]?.total ?? 0)} total`,
    },
    {
      label: "Media posts",
      value: Number(mediaStats[0]?.total ?? 0),
      hint: "Not deleted",
    },
    {
      label: "Upcoming events",
      value: Number(eventStats[0]?.upcoming ?? 0),
      hint: `${Number(eventStats[0]?.total ?? 0)} total`,
    },
    {
      label: "Resources",
      value: Number(resourceStats[0]?.total ?? 0),
      hint: "Library items",
    },
  ];

  return (
    <>
      <PageHeader
        title="Content pulse"
        description="A read-only overview of what the community is publishing across Collivio."
        action={
          <Button size="sm" variant="outline" render={<Link href="/admin" />}>
            Admin overview
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</p>
            <p className="text-muted-foreground mt-1 text-[11px]">{tile.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Latest opportunities</h2>
            <Link href="/opportunities" className="text-muted-foreground text-xs hover:underline">
              Open board
            </Link>
          </div>
          {latestOpportunities.length ? (
            <div className="divide-y">
              {latestOpportunities.map((item) => (
                <Link
                  key={item.id}
                  href={`/opportunities/${item.id}`}
                  className="hover:bg-secondary/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {item.orgName} · {item.type} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No opportunities yet" />
          )}
        </Card>

        <Card className="lg:col-span-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Recent media</h2>
            <Link href="/media" className="text-muted-foreground text-xs hover:underline">
              Open Media Lab
            </Link>
          </div>
          {mediaWithThumbs.length ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaWithThumbs.map((post) => (
                <Link key={post.id} href="/media" className="group block">
                  <div className="bg-secondary relative aspect-square overflow-hidden rounded-lg border">
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt={post.caption ?? "Campus media"}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
                        No preview
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 truncate text-[10px]">
                    {post.author}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No media yet" />
          )}
        </Card>

        <Card className="lg:col-span-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Latest research</h2>
            <Link href="/research" className="text-muted-foreground text-xs hover:underline">
              Open Research Hub
            </Link>
          </div>
          {latestProjects.length ? (
            <div className="divide-y">
              {latestProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/research/${project.id}`}
                  className="hover:bg-secondary/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{project.title}</p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {project.author} · {project.category} · {formatDate(project.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge status={project.status} />
                    <Tag>{project.visibility}</Tag>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No projects yet" />
          )}
        </Card>

        <Card className="lg:col-span-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Events</h2>
            <Link href="/events" className="text-muted-foreground text-xs hover:underline">
              Open calendar
            </Link>
          </div>
          {latestEvents.length ? (
            <div className="divide-y">
              {latestEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="hover:bg-secondary/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {formatDateTime(event.startsAt)} · {event.location ?? "Online"} ·{" "}
                      {event.organizer}
                    </p>
                  </div>
                  <Tag>{event.type}</Tag>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No events yet" />
          )}
        </Card>

        <Card className="lg:col-span-12">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Latest resources</h2>
            <Link href="/resources" className="text-muted-foreground text-xs hover:underline">
              Open library
            </Link>
          </div>
          {latestResources.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {latestResources.map((resource) => (
                <div key={resource.id} className="rounded-xl border p-3">
                  <p className="truncate text-sm font-medium">{resource.title}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                    {resource.author} · {formatDate(resource.createdAt)}
                  </p>
                  <div className="mt-2">
                    <Tag>{resource.category}</Tag>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No resources yet" />
          )}
        </Card>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        This view is informational. Reports about any item are handled from the moderation queue.
      </p>
    </>
  );
}
