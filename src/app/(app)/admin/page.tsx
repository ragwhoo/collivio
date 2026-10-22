import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  FileWarning,
  FlaskConical,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  auditLogs,
  events,
  mediaPosts,
  opportunities,
  organizations,
  profiles,
  projects,
  reports,
  resources,
} from "@/lib/db/schema";
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  formatDate,
  formatDateTime,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Bento({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card flex flex-col rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function BentoHeader({
  icon: Icon,
  title,
  href,
  linkLabel = "View all",
}: {
  icon: LucideIcon;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs"
        >
          {linkLabel}
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function MiniMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  return (
    <div className="bg-background/70 rounded-xl border px-3 py-2.5">
      <p
        className={cn(
          "text-xl font-semibold tabular-nums",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "danger" && "text-red-600 dark:text-red-400",
          tone === "success" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground text-[11px]">{label}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-[10px]">{hint}</p> : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const body = (
    <div className="bg-card flex h-full flex-col rounded-2xl border p-3.5 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
        <Icon className="text-muted-foreground size-4" />
      </div>
      <span
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "danger" && "text-red-600 dark:text-red-400",
          tone === "success" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </span>
      {hint ? <span className="text-muted-foreground mt-1 text-[11px]">{hint}</span> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function AdminPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    profileStats,
    orgStats,
    opportunityStats,
    applicationStats,
    projectStats,
    mediaStats,
    eventStats,
    resourceStats,
    reportStats,
    pendingOrganizations,
    openReports,
    recentUsers,
    logs,
    latestListings,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        students: sql<number>`count(*) filter (where ${profiles.role} = 'student')`.mapWith(Number),
        businesses: sql<number>`count(*) filter (where ${profiles.role} = 'business')`.mapWith(Number),
        admins: sql<number>`count(*) filter (where ${profiles.role} = 'admin')`.mapWith(Number),
        suspended: sql<number>`count(*) filter (where ${profiles.suspended})`.mapWith(Number),
        newThisWeek: sql<number>`count(*) filter (where ${profiles.createdAt} >= ${weekAgo})`.mapWith(
          Number,
        ),
      })
      .from(profiles),
    db
      .select({
        total: count(),
        pending: sql<number>`count(*) filter (where ${organizations.verificationStatus} = 'pending')`.mapWith(
          Number,
        ),
        verified: sql<number>`count(*) filter (where ${organizations.verified})`.mapWith(Number),
      })
      .from(organizations),
    db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${opportunities.status} = 'published')`.mapWith(
          Number,
        ),
      })
      .from(opportunities),
    db
      .select({
        total: count(),
        newThisWeek: sql<number>`count(*) filter (where ${applications.createdAt} >= ${weekAgo})`.mapWith(
          Number,
        ),
      })
      .from(applications),
    db
      .select({ total: count() })
      .from(projects)
      .where(eq(projects.status, "published")),
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
        total: count(),
        open: sql<number>`count(*) filter (where ${reports.status} = 'open')`.mapWith(Number),
        resolved: sql<number>`count(*) filter (where ${reports.status} = 'resolved')`.mapWith(Number),
        dismissed: sql<number>`count(*) filter (where ${reports.status} = 'dismissed')`.mapWith(
          Number,
        ),
      })
      .from(reports),
    db
      .select({
        organization: organizations,
        ownerName: profiles.displayName,
        ownerEmail: profiles.email,
      })
      .from(organizations)
      .innerJoin(profiles, eq(organizations.ownerId, profiles.id))
      .where(eq(organizations.verificationStatus, "pending"))
      .orderBy(desc(organizations.createdAt))
      .limit(4),
    db
      .select({
        report: reports,
        reporter: profiles.displayName,
      })
      .from(reports)
      .innerJoin(profiles, eq(reports.reporterId, profiles.id))
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt))
      .limit(4),
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
      .limit(5),
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
      .limit(6),
    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
        createdAt: opportunities.createdAt,
        orgName: organizations.name,
      })
      .from(opportunities)
      .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
      .where(eq(opportunities.status, "published"))
      .orderBy(desc(opportunities.publishedAt))
      .limit(3),
  ]);

  const people = profileStats[0];
  const orgs = orgStats[0];
  const listing = opportunityStats[0];
  const apps = applicationStats[0];
  const reportsSummary = reportStats[0];
  const pendingOrgCount = Number(orgs?.pending ?? 0);
  const openReportCount = Number(reportsSummary?.open ?? 0);
  const suspendedCount = Number(people?.suspended ?? 0);
  const newThisWeek = Number(people?.newThisWeek ?? 0);
  const attentionCount = pendingOrgCount + openReportCount;

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="Platform health, trust & safety, and the queues that need a decision."
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" render={<Link href="/admin/reports" />}>
              <FileWarning className="size-4" /> Review reports
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/admin/users" />}>
              <Users className="size-4" /> Manage members
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Bento className="from-primary/10 via-card to-card bg-gradient-to-br xl:col-span-8">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <div>
              <span className="bg-background/70 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                <Sparkles className="size-3.5" /> Admin command center
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                A healthy community is an intentional one.
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl text-sm">
                {attentionCount > 0
                  ? `${pendingOrgCount} verification${pendingOrgCount === 1 ? "" : "s"} and ${openReportCount} open report${openReportCount === 1 ? "" : "s"} are waiting for review. ${newThisWeek} new member${newThisWeek === 1 ? "" : "s"} joined this week.`
                  : `All queues are clear. ${newThisWeek} new member${newThisWeek === 1 ? "" : "s"} joined in the last seven days.`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:max-w-lg">
              <MiniMetric
                label="Pending verifications"
                value={pendingOrgCount}
                tone={pendingOrgCount ? "warning" : "success"}
              />
              <MiniMetric
                label="Open reports"
                value={openReportCount}
                tone={openReportCount ? "danger" : "success"}
              />
              <MiniMetric
                label="Suspended"
                value={suspendedCount}
                hint="Members"
                tone={suspendedCount ? "warning" : "default"}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" render={<Link href="/admin/organizations" />}>
                <BadgeCheck className="size-4" /> Verification queue
              </Button>
              <Button size="sm" variant="secondary" render={<Link href="/admin/reports" />}>
                <ShieldAlert className="size-4" /> Moderation queue
              </Button>
              <Button size="sm" variant="secondary" render={<Link href="/admin/content" />}>
                <Activity className="size-4" /> Content pulse
              </Button>
            </div>
          </div>
        </Bento>

        <Bento className="xl:col-span-4">
          <BentoHeader icon={ShieldCheck} title="Needs attention" />
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div className="flex flex-col divide-y">
              <Link
                href="/admin/organizations"
                className="hover:bg-secondary/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">Business verifications</p>
                  <p className="text-muted-foreground text-xs">
                    {pendingOrgCount
                      ? `${pendingOrgCount} organization${pendingOrgCount === 1 ? "" : "s"} awaiting a decision`
                      : "No pending submissions"}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    pendingOrgCount ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
                  )}
                >
                  {pendingOrgCount}
                </span>
              </Link>
              <Link
                href="/admin/reports"
                className="hover:bg-secondary/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">Open reports</p>
                  <p className="text-muted-foreground text-xs">
                    {Number(reportsSummary?.resolved ?? 0)} resolved ·{" "}
                    {Number(reportsSummary?.dismissed ?? 0)} dismissed all time
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    openReportCount ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
                  )}
                >
                  {openReportCount}
                </span>
              </Link>
              <Link
                href="/admin/users?status=suspended"
                className="hover:bg-secondary/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">Suspended members</p>
                  <p className="text-muted-foreground text-xs">Review and restore accounts</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{suspendedCount}</span>
              </Link>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Every decision is written to the audit log with the acting admin.
            </p>
          </div>
        </Bento>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:col-span-12 xl:grid-cols-6">
          <StatTile
            label="Members"
            value={Number(people?.total ?? 0)}
            hint={`${newThisWeek} joined this week`}
            href="/admin/users"
            icon={Users}
          />
          <StatTile
            label="Organizations"
            value={Number(orgs?.total ?? 0)}
            hint={`${Number(orgs?.verified ?? 0)} verified`}
            href="/admin/organizations"
            icon={Building2}
          />
          <StatTile
            label="Live listings"
            value={Number(listing?.published ?? 0)}
            hint={`${Number(listing?.total ?? 0)} total`}
            href="/admin/content"
            icon={Briefcase}
          />
          <StatTile
            label="Applications"
            value={Number(apps?.total ?? 0)}
            hint={`${Number(apps?.newThisWeek ?? 0)} this week`}
            href="/admin/content"
            icon={UserCheck}
          />
          <StatTile
            label="Research projects"
            value={Number(projectStats[0]?.total ?? 0)}
            hint="Published"
            href="/admin/content"
            icon={FlaskConical}
          />
          <StatTile
            label="Open reports"
            value={openReportCount}
            hint={openReportCount ? "Needs review" : "Queue clear"}
            tone={openReportCount ? "danger" : "success"}
            href="/admin/reports"
            icon={FileWarning}
          />
        </div>

        <Bento className="md:col-span-2 xl:col-span-7">
          <BentoHeader
            icon={BadgeCheck}
            title="Verification queue"
            href="/admin/organizations"
          />
          {pendingOrganizations.length ? (
            <div className="flex flex-1 flex-col divide-y">
              {pendingOrganizations.map((row) => (
                <Link
                  key={row.organization.id}
                  href="/admin/organizations"
                  className="hover:bg-secondary/50 group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium group-hover:underline">
                      {row.organization.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {row.ownerName} · {row.ownerEmail}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Submitted {formatDate(row.organization.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={row.organization.verificationStatus} />
                    <ArrowUpRight className="text-muted-foreground size-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center">
              <EmptyState
                title="No pending verifications"
                description="New business submissions will appear here."
              />
            </div>
          )}
        </Bento>

        <Bento className="xl:col-span-5">
          <BentoHeader icon={ShieldAlert} title="Open reports" href="/admin/reports" />
          {openReports.length ? (
            <div className="flex flex-1 flex-col divide-y">
              {openReports.map((row) => (
                <Link
                  key={row.report.id}
                  href="/admin/reports"
                  className="hover:bg-secondary/50 group -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium capitalize group-hover:underline">
                      {row.report.entityType} · {row.report.reason}
                    </p>
                    <p className="text-muted-foreground line-clamp-1 text-xs">
                      {row.report.details ?? "No additional details"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {row.reporter} · {formatDate(row.report.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={row.report.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center">
              <EmptyState
                title="No open reports"
                description="Reported content and members will appear here."
              />
            </div>
          )}
        </Bento>

        <Bento className="xl:col-span-4">
          <BentoHeader icon={Users} title="Newest members" href="/admin/users" />
          <div className="flex flex-1 flex-col divide-y">
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/students/${user.id}`}
                className="hover:bg-secondary/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
              >
                <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.displayName}</p>
                  <p className="text-muted-foreground truncate text-[11px]">{user.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-muted-foreground text-[10px] capitalize">{user.role}</p>
                  <p className="text-muted-foreground text-[10px]">{formatDate(user.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Bento>

        <Bento className="xl:col-span-4">
          <BentoHeader icon={Activity} title="Content pulse" href="/admin/content" />
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric
                label="Listings"
                value={Number(listing?.total ?? 0)}
                hint={`${Number(listing?.published ?? 0)} live`}
              />
              <MiniMetric
                label="Projects"
                value={Number(projectStats[0]?.total ?? 0)}
                hint="Published"
              />
              <MiniMetric label="Media posts" value={Number(mediaStats[0]?.total ?? 0)} />
              <MiniMetric
                label="Events"
                value={Number(eventStats[0]?.total ?? 0)}
                hint={`${Number(eventStats[0]?.upcoming ?? 0)} upcoming`}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.5" /> Resource library
              </span>
              <span className="font-semibold">{Number(resourceStats[0]?.total ?? 0)}</span>
            </div>
            {latestListings.length ? (
              <div>
                <p className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase tracking-wide">
                  Latest live listings
                </p>
                <div className="flex flex-col gap-1.5">
                  {latestListings.map((item) => (
                    <Link
                      key={item.id}
                      href={`/opportunities/${item.id}`}
                      className="hover:bg-secondary/50 flex items-center justify-between gap-2 rounded-lg px-1 py-1 transition-colors"
                    >
                      <span className="truncate text-xs font-medium">{item.title}</span>
                      <span className="text-muted-foreground shrink-0 text-[10px]">
                        {item.orgName}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Bento>

        <Bento className="xl:col-span-4">
          <BentoHeader icon={ShieldCheck} title="Audit trail" />
          {logs.length ? (
            <div className="flex flex-1 flex-col divide-y">
              {logs.map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium">{log.action}</p>
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                    {log.actor ?? "System"} · {log.entityType ?? "platform"}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No admin actions yet" description="Audit entries appear here." />
          )}
        </Bento>
      </div>

      <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5" /> Server-side admin checks on every route
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" /> Admin access via ADMIN_EMAILS allowlist
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UserX className="size-3.5" /> Suspensions block sign-in to the workspace
        </span>
      </div>
    </>
  );
}
