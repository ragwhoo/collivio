import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, opportunities, organizations } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { withdrawApplicationAction } from "@/app/actions";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  formatDate,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const profile = await requireProfile();

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      opportunityId: opportunities.id,
      title: opportunities.title,
      orgName: organizations.name,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(eq(applications.studentId, profile.id))
    .orderBy(desc(applications.createdAt))
    .limit(100);

  const activeStatuses = new Set(["submitted", "under_review", "shortlisted", "interview"]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="My applications"
        description="Track every opportunity you've applied to and its current status."
        action={<Button variant="outline" render={<Link href="/opportunities" />}>Find opportunities</Button>}
      />

      {rows.length ? (
        <div className="flex flex-col gap-3">
          {rows.map((application) => (
            <Card key={application.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/opportunities/${application.opportunityId}`}
                    className="font-medium hover:underline"
                  >
                    {application.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">{application.orgName}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Applied {formatDate(application.createdAt)} · Updated{" "}
                    {formatDate(application.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={application.status} />
                  {activeStatuses.has(application.status) ? (
                    <form action={withdrawApplicationAction.bind(null, application.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Withdraw
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No applications yet"
          description="Browse opportunities and submit your first application."
          action={<Button render={<Link href="/opportunities" />}>Browse opportunities</Button>}
        />
      )}
    </div>
  );
}
