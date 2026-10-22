import Link from "next/link";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { suspendUserAction } from "@/app/actions";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Tag,
  formatDate,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const roles = ["student", "business", "admin"] as const;
type Role = (typeof roles)[number];

function asRole(value: string | undefined): Role | undefined {
  return roles.find((role) => role === value);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const viewer = await requireAdmin();
  const { q, role, status } = await searchParams;
  const activeRole = asRole(role);
  const activeStatus = status === "suspended" || status === "active" ? status : undefined;

  const filters: SQL[] = [];
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    filters.push(
      or(
        ilike(profiles.displayName, term),
        ilike(profiles.email, term),
        ilike(profiles.college, term),
      )!,
    );
  }
  if (activeRole) filters.push(eq(profiles.role, activeRole));
  if (activeStatus) filters.push(eq(profiles.suspended, activeStatus === "suspended"));

  const [memberRows, statsRows] = await Promise.all([
    db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        email: profiles.email,
        role: profiles.role,
        college: profiles.college,
        suspended: profiles.suspended,
        onboarded: profiles.onboarded,
        visibility: profiles.visibility,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(profiles.createdAt))
      .limit(100),
    db
      .select({
        total: count(),
        students: sql<number>`count(*) filter (where ${profiles.role} = 'student')`.mapWith(Number),
        businesses: sql<number>`count(*) filter (where ${profiles.role} = 'business')`.mapWith(Number),
        admins: sql<number>`count(*) filter (where ${profiles.role} = 'admin')`.mapWith(Number),
        suspended: sql<number>`count(*) filter (where ${profiles.suspended})`.mapWith(Number),
      })
      .from(profiles),
  ]);

  const stats = statsRows[0];

  return (
    <>
      <PageHeader
        title="Members"
        description="Search, filter and moderate every account on Collivio."
        action={
          <Button size="sm" variant="outline" render={<Link href="/admin" />}>
            Admin overview
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">All</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{Number(stats?.total ?? 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Students
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Number(stats?.students ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Businesses
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Number(stats?.businesses ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Admins</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{Number(stats?.admins ?? 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Suspended
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            {Number(stats?.suspended ?? 0)}
          </p>
        </Card>
      </div>

      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email or college…"
          className="bg-secondary h-10 flex-1 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <select
          name="role"
          defaultValue={activeRole ?? "all"}
          className="bg-secondary h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          {roles.map((item) => (
            <option key={item} value={item} className="capitalize">
              {item}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={activeStatus ?? "all"}
          className="bg-secondary h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {q || activeRole || activeStatus ? (
          <Button variant="ghost" render={<Link href="/admin/users" />}>
            Clear
          </Button>
        ) : null}
      </form>

      {memberRows.length ? (
        <Card className="p-0">
          <div className="divide-y">
            {memberRows.map((member) => {
              const isSelf = member.id === viewer.id;
              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {member.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/students/${member.id}`}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {member.displayName}
                        </Link>
                        {isSelf ? <Tag>You</Tag> : null}
                        {member.suspended ? <StatusBadge status="suspended" /> : null}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                      <p className="text-muted-foreground text-[11px]">
                        <span className="capitalize">{member.role}</span>
                        {member.college ? ` · ${member.college}` : ""} · joined{" "}
                        {formatDate(member.createdAt)}
                        {member.onboarded ? "" : " · onboarding incomplete"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                    <span className="text-muted-foreground text-[11px] capitalize">
                      {member.visibility}
                    </span>
                    {isSelf ? (
                      <span className="text-muted-foreground text-xs">Current account</span>
                    ) : (
                      <form action={suspendUserAction.bind(null, member.id, !member.suspended)}>
                        <Button
                          type="submit"
                          size="sm"
                          variant={member.suspended ? "outline" : "ghost"}
                          className={member.suspended ? undefined : "text-destructive"}
                        >
                          {member.suspended ? "Restore access" : "Suspend"}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No members found"
          description="Try a different search or clear the filters."
        />
      )}

      <p className="text-muted-foreground mt-4 text-xs">
        Showing up to 100 members. Suspended accounts are redirected away from the workspace on their
        next request. You cannot suspend your own account.
      </p>
    </>
  );
}
