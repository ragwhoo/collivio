import Link from "next/link";
import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  comments,
  events,
  mediaPosts,
  opportunities,
  profiles,
  projects,
  reports,
  resources,
} from "@/lib/db/schema";
import { resolveReportFormAction } from "@/app/actions";
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

type ReportRow = {
  report: typeof reports.$inferSelect;
  reporterName: string;
  reporterEmail: string;
};

function entityHref(entityType: string, entityId: string): string | null {
  switch (entityType) {
    case "user":
      return `/students/${entityId}`;
    case "project":
      return `/research/${entityId}`;
    case "opportunity":
      return `/opportunities/${entityId}`;
    case "event":
      return `/events/${entityId}`;
    case "post":
      return "/media";
    case "resource":
      return "/resources";
    default:
      return null;
  }
}

async function resolveEntityLabels(rows: ReportRow[]) {
  const byType = new Map<string, string[]>();
  for (const row of rows) {
    const list = byType.get(row.report.entityType) ?? [];
    if (!list.includes(row.report.entityId)) list.push(row.report.entityId);
    byType.set(row.report.entityType, list);
  }

  const labels = new Map<string, string>();

  const projectIds = byType.get("project") ?? [];
  const opportunityIds = byType.get("opportunity") ?? [];
  const eventIds = byType.get("event") ?? [];
  const resourceIds = byType.get("resource") ?? [];
  const postIds = byType.get("post") ?? [];
  const userIds = byType.get("user") ?? [];
  const commentIds = byType.get("comment") ?? [];

  const [
    projectRows,
    opportunityRows,
    eventRows,
    resourceRows,
    postRows,
    userRows,
    commentRows,
  ] = await Promise.all([
    projectIds.length
      ? db
          .select({ id: projects.id, title: projects.title })
          .from(projects)
          .where(inArray(projects.id, projectIds))
      : Promise.resolve([]),
    opportunityIds.length
      ? db
          .select({ id: opportunities.id, title: opportunities.title })
          .from(opportunities)
          .where(inArray(opportunities.id, opportunityIds))
      : Promise.resolve([]),
    eventIds.length
      ? db
          .select({ id: events.id, title: events.title })
          .from(events)
          .where(inArray(events.id, eventIds))
      : Promise.resolve([]),
    resourceIds.length
      ? db
          .select({ id: resources.id, title: resources.title })
          .from(resources)
          .where(inArray(resources.id, resourceIds))
      : Promise.resolve([]),
    postIds.length
      ? db
          .select({ id: mediaPosts.id, caption: mediaPosts.caption })
          .from(mediaPosts)
          .where(inArray(mediaPosts.id, postIds))
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({ id: profiles.id, title: profiles.displayName })
          .from(profiles)
          .where(inArray(profiles.id, userIds))
      : Promise.resolve([]),
    commentIds.length
      ? db
          .select({ id: comments.id, title: comments.body })
          .from(comments)
          .where(inArray(comments.id, commentIds))
      : Promise.resolve([]),
  ]);

  for (const row of projectRows) labels.set(`project:${row.id}`, row.title);
  for (const row of opportunityRows) labels.set(`opportunity:${row.id}`, row.title);
  for (const row of eventRows) labels.set(`event:${row.id}`, row.title);
  for (const row of resourceRows) labels.set(`resource:${row.id}`, row.title);
  for (const row of postRows) labels.set(`post:${row.id}`, row.caption ?? "Media post");
  for (const row of userRows) labels.set(`user:${row.id}`, row.title);
  for (const row of commentRows) {
    labels.set(`comment:${row.id}`, row.title.slice(0, 80));
  }

  return labels;
}

export default async function AdminReportsPage() {
  const resolver = alias(profiles, "resolver");

  const [openReports, history, statsRows] = await Promise.all([
    db
      .select({
        report: reports,
        reporterName: profiles.displayName,
        reporterEmail: profiles.email,
      })
      .from(reports)
      .innerJoin(profiles, eq(reports.reporterId, profiles.id))
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt))
      .limit(60),
    db
      .select({
        report: reports,
        reporterName: profiles.displayName,
        reporterEmail: profiles.email,
        resolverName: resolver.displayName,
      })
      .from(reports)
      .innerJoin(profiles, eq(reports.reporterId, profiles.id))
      .leftJoin(resolver, eq(reports.resolvedBy, resolver.id))
      .where(sql`${reports.status} in ('resolved', 'dismissed')`)
      .orderBy(desc(reports.createdAt))
      .limit(20),
    db
      .select({
        total: count(),
        open: sql<number>`count(*) filter (where ${reports.status} = 'open')`.mapWith(Number),
        resolved: sql<number>`count(*) filter (where ${reports.status} = 'resolved')`.mapWith(Number),
        dismissed: sql<number>`count(*) filter (where ${reports.status} = 'dismissed')`.mapWith(
          Number,
        ),
      })
      .from(reports),
  ]);

  const labels = await resolveEntityLabels([
    ...openReports,
    ...history.map((row) => ({
      report: row.report,
      reporterName: row.reporterName,
      reporterEmail: row.reporterEmail,
    })),
  ]);

  const stats = statsRows[0];

  return (
    <>
      <PageHeader
        title="Reports & moderation"
        description="Review reported content and members, then record an outcome. Every resolution is audited."
        action={
          <Button size="sm" variant="outline" render={<Link href="/admin" />}>
            Admin overview
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Open</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            {Number(stats?.open ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Resolved
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Number(stats?.resolved ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Dismissed
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Number(stats?.dismissed ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            All reports
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{Number(stats?.total ?? 0)}</p>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">
          Open queue <span className="text-muted-foreground font-normal">({openReports.length})</span>
        </h2>
        {openReports.length ? (
          <div className="flex flex-col gap-3">
            {openReports.map((row) => {
              const label =
                labels.get(`${row.report.entityType}:${row.report.entityId}`) ??
                `Deleted ${row.report.entityType}`;
              const href = entityHref(row.report.entityType, row.report.entityId);
              return (
                <Card key={row.report.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag>{row.report.entityType}</Tag>
                        <StatusBadge status={row.report.status} />
                        <span className="text-muted-foreground text-[11px]">
                          {formatDateTime(row.report.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium">{row.report.reason}</p>
                      {row.report.details ? (
                        <p className="text-muted-foreground mt-1 text-sm">{row.report.details}</p>
                      ) : null}
                      <p className="text-muted-foreground mt-2 text-xs">
                        About{" "}
                        {href ? (
                          <Link href={href} className="text-primary hover:underline">
                            {label}
                          </Link>
                        ) : (
                          <span>{label}</span>
                        )}
                        {" · "}reported by {row.reporterName} ({row.reporterEmail})
                      </p>
                    </div>
                  </div>

                  <form action={resolveReportFormAction} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="reportId" value={row.report.id} />
                    <input
                      name="note"
                      placeholder="Resolution note (recorded in the audit log)"
                      className="bg-background h-9 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" name="decision" value="resolved" size="sm">
                        Resolve report
                      </Button>
                      <Button
                        type="submit"
                        name="decision"
                        value="dismissed"
                        size="sm"
                        variant="outline"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </form>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No open reports"
            description="New reports from the community will appear here."
          />
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Resolution history</h2>
        {history.length ? (
          <Card className="p-0">
            <div className="divide-y">
              {history.map((row) => {
                const label =
                  labels.get(`${row.report.entityType}:${row.report.entityId}`) ??
                  `Deleted ${row.report.entityType}`;
                return (
                  <div key={row.report.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag>{row.report.entityType}</Tag>
                        <p className="text-sm font-medium">{row.report.reason}</p>
                      </div>
                      <StatusBadge status={row.report.status} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {label} · reported by {row.reporterName} ·{" "}
                      {formatDate(row.report.createdAt)}
                    </p>
                    {row.report.resolutionNote ? (
                      <p className="text-muted-foreground mt-1 text-sm">
                        “{row.report.resolutionNote}”
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      {row.resolverName ? `Handled by ${row.resolverName}` : "Moderator removed"}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <EmptyState title="No resolved reports yet" />
        )}
      </section>
    </>
  );
}
