import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventRegistrations, events, profiles } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import {
  cancelEventRegistrationAction,
  registerForEventAction,
} from "@/app/actions";
import { Card, PageHeader, Tag, formatDateTime } from "@/components/app/ui";
import { isPast } from "@/lib/time";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  const [row] = await db
    .select({ event: events, organizer: profiles })
    .from(events)
    .innerJoin(profiles, eq(events.organizerId, profiles.id))
    .where(eq(events.id, id))
    .limit(1);

  if (!row) notFound();

  const [registration] = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, id),
        eq(eventRegistrations.userId, profile.id),
      ),
    )
    .limit(1);

  const [registeredCount] = await db
    .select({ value: count() })
    .from(eventRegistrations)
    .where(
      and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.status, "registered")),
    );

  const closed = isPast(row.event.registrationDeadline);
  const full =
    row.event.capacity !== null &&
    Number(registeredCount?.value ?? 0) >= row.event.capacity;
  const active = registration && registration.status !== "cancelled";

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={row.event.title}
        description={`${row.event.type} · organized by ${row.organizer.displayName}`}
        action={
          active ? (
            <form action={cancelEventRegistrationAction.bind(null, id)}>
              <Button type="submit" variant="outline">
                Cancel registration
              </Button>
            </form>
          ) : closed ? (
            <Button disabled>Registration closed</Button>
          ) : (
            <form action={registerForEventAction.bind(null, id)}>
              <Button type="submit">{full ? "Join waitlist" : "Register"}</Button>
            </form>
          )
        }
      />

      {active ? (
        <Card className="border-primary/30 bg-primary/5 mb-5">
          <p className="font-medium">
            You&apos;re {registration.status === "waitlisted" ? "on the waitlist" : "registered"}
          </p>
          <p className="text-muted-foreground text-sm">
            {registration.status === "waitlisted"
              ? "We'll notify you if a spot opens up."
              : "You'll receive reminders before the event."}
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-wrap gap-2">
              <Tag>{row.event.type}</Tag>
              {full ? <Tag>At capacity</Tag> : null}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6">{row.event.description}</p>
            {row.event.eligibility ? (
              <>
                <h2 className="mt-5 text-sm font-semibold">Eligibility</h2>
                <p className="text-muted-foreground mt-1 whitespace-pre-line text-sm">
                  {row.event.eligibility}
                </p>
              </>
            ) : null}
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <h2 className="text-sm font-semibold">Event details</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Starts</dt>
                <dd className="text-right">{formatDateTime(row.event.startsAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ends</dt>
                <dd className="text-right">{formatDateTime(row.event.endsAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Timezone</dt>
                <dd className="text-right">{row.event.timezone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right">{row.event.location ?? "Online"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Deadline</dt>
                <dd className="text-right">{formatDateTime(row.event.registrationDeadline)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Capacity</dt>
                <dd className="text-right">{row.event.capacity ?? "Unlimited"}</dd>
              </div>
            </dl>
          </Card>
          {row.event.onlineUrl ? (
            <Card>
              <h2 className="text-sm font-semibold">Online access</h2>
              <a
                href={row.event.onlineUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary mt-2 block text-sm hover:underline"
              >
                Join meeting link
              </a>
            </Card>
          ) : null}
          <Link href="/events" className="text-muted-foreground text-sm hover:underline">
            ← All events
          </Link>
        </aside>
      </div>
    </div>
  );
}
