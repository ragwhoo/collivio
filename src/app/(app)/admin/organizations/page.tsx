import Link from "next/link";
import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businessVerifications,
  organizations,
  profiles,
} from "@/lib/db/schema";
import { resolveStorageUrl } from "@/lib/storage";
import { verifyBusinessFormAction } from "@/app/actions";
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

const input =
  "bg-background h-9 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function AdminOrganizationsPage() {
  const [stagedOrganizations, statsRows] = await Promise.all([
    db
      .select({
        organization: organizations,
        ownerName: profiles.displayName,
        ownerEmail: profiles.email,
        ownerId: profiles.id,
      })
      .from(organizations)
      .innerJoin(profiles, eq(organizations.ownerId, profiles.id))
      .where(eq(organizations.verificationStatus, "pending"))
      .orderBy(desc(organizations.createdAt))
      .limit(60),
    db
      .select({
        total: count(),
        pending: sql<number>`count(*) filter (where ${organizations.verificationStatus} = 'pending')`.mapWith(
          Number,
        ),
        approved: sql<number>`count(*) filter (where ${organizations.verified})`.mapWith(Number),
        rejected: sql<number>`count(*) filter (where ${organizations.verificationStatus} = 'rejected')`.mapWith(
          Number,
        ),
      })
      .from(organizations),
  ]);

  const orgIds = stagedOrganizations.map((row) => row.organization.id);
  const [verificationRows, recentDecisions] = await Promise.all([
    orgIds.length
      ? db
          .select()
          .from(businessVerifications)
          .where(inArray(businessVerifications.organizationId, orgIds))
          .orderBy(desc(businessVerifications.createdAt))
      : Promise.resolve([]),
    db
      .select({
        organization: organizations,
        ownerName: profiles.displayName,
        ownerEmail: profiles.email,
      })
      .from(organizations)
      .innerJoin(profiles, eq(organizations.ownerId, profiles.id))
      .where(
        sql`${organizations.verificationStatus} in ('approved', 'rejected')`,
      )
      .orderBy(desc(organizations.updatedAt))
      .limit(12),
  ]);

  const latestVerification = new Map<string, (typeof verificationRows)[number]>();
  for (const row of verificationRows) {
    if (!latestVerification.has(row.organizationId)) {
      latestVerification.set(row.organizationId, row);
    }
  }

  const documentsByOrganization = new Map(
    await Promise.all(
      stagedOrganizations.map(async (row) => {
        const documents = latestVerification.get(row.organization.id)?.documents ?? [];
        const resolved = await Promise.all(
          documents.map(async (document) => ({
            href: await resolveStorageUrl(document),
            label: document.startsWith("s3://")
              ? document.split("/").pop() ?? "Document"
              : document,
          })),
        );
        return [row.organization.id, resolved] as const;
      }),
    ),
  );

  const stats = statsRows[0];

  return (
    <>
      <PageHeader
        title="Business verifications"
        description="Review organizations before they can publish opportunities to students."
        action={
          <Button size="sm" variant="outline" render={<Link href="/admin" />}>
            Admin overview
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Pending</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {Number(stats?.pending ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Verified</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Number(stats?.approved ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Rejected</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Number(stats?.rejected ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Organizations
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{Number(stats?.total ?? 0)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h2 className="mb-3 text-base font-semibold">
            Awaiting review{" "}
            <span className="text-muted-foreground font-normal">({stagedOrganizations.length})</span>
          </h2>
          {stagedOrganizations.length ? (
            <div className="flex flex-col gap-3">
              {stagedOrganizations.map((row) => {
                const verification = latestVerification.get(row.organization.id);
                const documents = documentsByOrganization.get(row.organization.id) ?? [];
                return (
                  <Card key={row.organization.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{row.organization.name}</h3>
                          <StatusBadge status={row.organization.verificationStatus} />
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          <Link
                            href={`/students/${row.ownerId}`}
                            className="hover:text-foreground hover:underline"
                          >
                            {row.ownerName}
                          </Link>{" "}
                          · {row.ownerEmail}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Submitted {formatDate(row.organization.createdAt)}
                        </p>
                      </div>
                      {row.organization.website ? (
                        <a
                          href={row.organization.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary shrink-0 text-xs hover:underline"
                        >
                          Visit website
                        </a>
                      ) : null}
                    </div>

                    {row.organization.description ? (
                      <p className="text-muted-foreground mt-3 text-sm">
                        {row.organization.description}
                      </p>
                    ) : null}

                    {verification ? (
                      <div className="bg-secondary/40 mt-3 rounded-xl border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium">Verification submission</p>
                          <span className="text-muted-foreground text-[11px]">
                            {formatDateTime(verification.createdAt)}
                          </span>
                        </div>
                        {verification.notes ? (
                          <p className="text-muted-foreground mt-1.5 text-sm">{verification.notes}</p>
                        ) : (
                          <p className="text-muted-foreground mt-1.5 text-xs">
                            No submission notes provided.
                          </p>
                        )}
                        {documents.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {documents.map((document, index) =>
                              document.href ? (
                                <a
                                  key={`${document.label}-${index}`}
                                  href={document.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  <Tag>Document {index + 1}</Tag>
                                </a>
                              ) : (
                                <Tag key={`${document.label}-${index}`}>Document unavailable</Tag>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground mt-2 text-[11px]">
                            No supporting documents uploaded.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-3 text-xs">
                        The organization has not submitted verification details yet.
                      </p>
                    )}

                    <form action={verifyBusinessFormAction} className="mt-3 flex flex-col gap-2">
                      <input type="hidden" name="organizationId" value={row.organization.id} />
                      <input
                        name="note"
                        placeholder="Decision note (shared with the owner and recorded in the audit log)"
                        className={input}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" name="decision" value="approved" size="sm">
                          Approve organization
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
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No pending verifications"
              description="New business submissions will appear here for review."
            />
          )}
        </section>

        <aside>
          <h2 className="mb-3 text-base font-semibold">Recent decisions</h2>
          {recentDecisions.length ? (
            <Card className="p-0">
              <div className="divide-y">
                {recentDecisions.map((row) => (
                  <div key={row.organization.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{row.organization.name}</p>
                      <StatusBadge status={row.organization.verificationStatus} />
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {row.ownerName} · {row.ownerEmail}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Updated {formatDate(row.organization.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState title="No decisions yet" />
          )}
          <p className="text-muted-foreground mt-3 text-xs">
            Approving an organization unlocks publishing for its owners and notifies them in-app.
          </p>
        </aside>
      </div>
    </>
  );
}
