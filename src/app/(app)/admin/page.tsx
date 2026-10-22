import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  auditLogs,
  opportunities,
  organizations,
  profiles,
  projects,
  reports,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import {
  resolveReportFormAction,
  suspendUserAction,
  verifyBusinessFormAction,
} from "@/app/actions";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Stat,
  formatDate,
  formatDateTime,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [
    userCount,
    orgCount,
    opportunityCount,
    applicationCount,
    projectCount,
    openReportCount,
    pendingOrganizations,
    openReports,
    users,
    logs,
  ] = await Promise.all([
    db.select({ value: count() }).from(profiles),
    db.select({ value: count() }).from(organizations),
    db.select({ value: count() }).from(opportunities),
    db.select({ value: count() }).from(applications),
    db.select({ value: count() }).from(projects),
    db.select({ value: count() }).from(reports).where(eq(reports.status, "open")),
    db
      .select({
        organization: organizations,
        ownerName: profiles.displayName,
        ownerEmail: profiles.email,
      })
      .from(organizations)
      .innerJoin(profiles, eq(organizations.ownerId, profiles.id))
      .where(eq(organizations.verified, false))
      .orderBy(desc(organizations.createdAt))
      .limit(20),
    db
      .select({
        report: reports,
        reporter: profiles.displayName,
      })
      .from(reports)
      .innerJoin(profiles, eq(reports.reporterId, profiles.id))
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt))
      .limit(20),
    db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        email: profiles.email,
        role: profiles.role,
        suspended: profiles.suspended,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .orderBy(desc(profiles.createdAt))
      .limit(50),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
        actor: profiles.displayName,
      })
      .from(auditLogs)
      .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(25),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Admin & Trust Center"
        description="Verification, moderation, user management and audit history."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Users" value={Number(userCount[0]?.value ?? 0)} />
        <Stat label="Organizations" value={Number(orgCount[0]?.value ?? 0)} />
        <Stat label="Listings" value={Number(opportunityCount[0]?.value ?? 0)} />
        <Stat label="Applications" value={Number(applicationCount[0]?.value ?? 0)} />
        <Stat label="Projects" value={Number(projectCount[0]?.value ?? 0)} />
        <Stat label="Open reports" value={Number(openReportCount[0]?.value ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-base font-semibold">Business verification queue</h2>
          {pendingOrganizations.length ? (
            <div className="flex flex-col gap-3">
              {pendingOrganizations.map((row) => (
                <Card key={row.organization.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.organization.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {row.ownerName} · {row.ownerEmail}
                      </p>
                    </div>
                    <StatusBadge status={row.organization.verificationStatus} />
                  </div>
                  {row.organization.description ? (
                    <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                      {row.organization.description}
                    </p>
                  ) : null}
                  <form action={verifyBusinessFormAction} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="organizationId" value={row.organization.id} />
                    <input
                      name="note"
                      placeholder="Decision note (recorded in the audit log)"
                      className="bg-background h-9 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" name="decision" value="approved" size="sm">
                        Approve
                      </Button>
                      <Button
                        type="submit"
                        name="decision"
                        value="rejected"
                        size="sm"
                        variant="outline"
                      >
                        Reject
                      </Button>
                    </div>
                  </form>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No pending verifications" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Open reports</h2>
          {openReports.length ? (
            <div className="flex flex-col gap-3">
              {openReports.map((row) => (
                <Card key={row.report.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium capitalize">
                      {row.report.entityType} report
                    </p>
                    <StatusBadge status={row.report.status} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {row.report.reason}
                  </p>
                  {row.report.details ? (
                    <p className="text-muted-foreground text-sm">{row.report.details}</p>
                  ) : null}
                  <p className="text-muted-foreground mt-1 text-xs">
                    Reported by {row.reporter} · {formatDate(row.report.createdAt)}
                  </p>
                  <form action={resolveReportFormAction} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="reportId" value={row.report.id} />
                    <input
                      name="note"
                      placeholder="Resolution note"
                      className="bg-background h-9 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" name="decision" value="resolved" size="sm">
                        Resolve
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
              ))}
            </div>
          ) : (
            <EmptyState title="No open reports" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Users</h2>
          <Card className="p-0">
            <div className="divide-y">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <Link href={`/students/${user.id}`} className="truncate text-sm font-medium hover:underline">
                      {user.displayName}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {user.role} · joined {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <form action={suspendUserAction.bind(null, user.id, !user.suspended)}>
                    <Button
                      type="submit"
                      size="sm"
                      variant={user.suspended ? "outline" : "ghost"}
                      className={user.suspended ? undefined : "text-destructive"}
                    >
                      {user.suspended ? "Restore" : "Suspend"}
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Audit log</h2>
          {logs.length ? (
            <Card className="p-0">
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-muted-foreground text-xs">
                      {log.actor ?? "System"} · {log.entityType ?? "—"} ·{" "}
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState title="No administrative actions recorded" />
          )}
        </section>
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Admin access is restricted by the server-side role check. Audit entries are written for
        verification, moderation, application and listing actions.
      </p>
    </div>
  );
}
