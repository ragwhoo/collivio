import Link from "next/link";
import { eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventRegistrations, events, profiles } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { registerForEventAction } from "@/app/actions";
import { Card, EmptyState, PageHeader, Tag, formatDateTime } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const profile = await requireProfile();

  const [upcoming, myRegistrations] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        type: events.type,
        startsAt: events.startsAt,
        location: events.location,
        onlineUrl: events.onlineUrl,
        capacity: events.capacity,
        organizer: profiles.displayName,
      })
      .from(events)
      .innerJoin(profiles, eq(events.organizerId, profiles.id))
      .where(gte(events.startsAt, new Date()))
      .orderBy(events.startsAt)
      .limit(50),
    db
      .select({ eventId: eventRegistrations.eventId, status: eventRegistrations.status })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.userId, profile.id)),
  ]);

  const registered = new Map(myRegistrations.map((row) => [row.eventId, row.status]));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Events & hackathons"
        description="Workshops, tech talks, college fests and hackathons."
        action={<Button render={<Link href="/events/new" />}>Create event</Button>}
      />

      {upcoming.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((event) => (
            <Card key={event.id} className="flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <Tag>{event.type}</Tag>
                {registered.get(event.id) === "registered" ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Registered
                  </span>
                ) : registered.get(event.id) === "waitlisted" ? (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
                    Waitlisted
                  </span>
                ) : null}
              </div>
              <Link href={`/events/${event.id}`} className="mt-3 hover:underline">
                <h2 className="text-lg font-semibold">{event.title}</h2>
              </Link>
              <p className="text-muted-foreground mt-1 line-clamp-2 flex-1 text-sm">
                {event.description}
              </p>
              <p className="text-muted-foreground mt-3 text-xs">
                {formatDateTime(event.startsAt)} · {event.location ?? "Online"} · by {event.organizer}
              </p>
              <div className="mt-3">
                <form action={registerForEventAction.bind(null, event.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    {registered.get(event.id) ? "View registration" : "Register"}
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No upcoming events"
          description="Create the first workshop or hackathon for the community."
          action={<Button render={<Link href="/events/new" />}>Create event</Button>}
        />
      )}
    </div>
  );
}
