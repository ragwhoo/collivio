import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookmarks,
  events,
  opportunities,
  projects,
  resources,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { toggleBookmarkAction } from "@/app/actions";
import { Card, EmptyState, PageHeader, Tag, formatDate } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SavedItem = {
  id: string;
  entityId: string;
  type: "project" | "post" | "opportunity" | "resource" | "event";
  title: string;
  subtitle: string;
  href: string;
  createdAt: Date;
};

export default async function BookmarksPage() {
  const profile = await requireProfile();

  const rows = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, profile.id))
    .orderBy(desc(bookmarks.createdAt));

  const idsFor = (type: string) =>
    rows.filter((row) => row.entityType === type).map((row) => row.entityId);

  const [projectRows, opportunityRows, resourceRows, eventRows] = await Promise.all([
    idsFor("project").length
      ? db
          .select({ id: projects.id, title: projects.title, category: projects.category })
          .from(projects)
          .where(inArray(projects.id, idsFor("project")))
      : Promise.resolve([]),
    idsFor("opportunity").length
      ? db
          .select({
            id: opportunities.id,
            title: opportunities.title,
            type: opportunities.type,
          })
          .from(opportunities)
          .where(inArray(opportunities.id, idsFor("opportunity")))
      : Promise.resolve([]),
    idsFor("resource").length
      ? db
          .select({ id: resources.id, title: resources.title, category: resources.category })
          .from(resources)
          .where(inArray(resources.id, idsFor("resource")))
      : Promise.resolve([]),
    idsFor("event").length
      ? db
          .select({ id: events.id, title: events.title, type: events.type })
          .from(events)
          .where(inArray(events.id, idsFor("event")))
      : Promise.resolve([]),
  ]);

  const lookup = new Map<string, { title: string; subtitle: string; href: string }>();
  for (const row of projectRows) {
    lookup.set(`project:${row.id}`, {
      title: row.title,
      subtitle: row.category,
      href: `/research/${row.id}`,
    });
  }
  for (const row of opportunityRows) {
    lookup.set(`opportunity:${row.id}`, {
      title: row.title,
      subtitle: row.type,
      href: `/opportunities/${row.id}`,
    });
  }
  for (const row of resourceRows) {
    lookup.set(`resource:${row.id}`, {
      title: row.title,
      subtitle: row.category,
      href: `/resources`,
    });
  }
  for (const row of eventRows) {
    lookup.set(`event:${row.id}`, {
      title: row.title,
      subtitle: row.type,
      href: `/events/${row.id}`,
    });
  }

  const items: SavedItem[] = rows
    .map((row) => {
      const entity = lookup.get(`${row.entityType}:${row.entityId}`);
      if (!entity) return null;
      return {
        id: row.id,
        entityId: row.entityId,
        type: row.entityType as SavedItem["type"],
        title: entity.title,
        subtitle: entity.subtitle,
        href: entity.href,
        createdAt: row.createdAt,
      };
    })
    .filter((item): item is SavedItem => item !== null);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Bookmarks"
        description="Projects, opportunities, events and resources you saved for later."
      />

      {items.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-2">
                <Tag>{item.type}</Tag>
                <span className="text-muted-foreground text-xs">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <Link href={item.href} className="mt-3 font-medium hover:underline">
                {item.title}
              </Link>
              <p className="text-muted-foreground mt-1 flex-1 text-sm capitalize">
                {item.subtitle}
              </p>
              <form
                action={toggleBookmarkAction.bind(
                  null,
                  item.type as "project" | "post" | "opportunity" | "resource" | "event",
                  item.entityId,
                )}
                className="mt-3"
              >
                <Button type="submit" size="sm" variant="outline">
                  Remove
                </Button>
              </form>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing saved yet"
          description="Save projects, opportunities, events and resources to find them here."
        />
      )}
    </div>
  );
}
