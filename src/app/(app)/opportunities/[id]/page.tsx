import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  bookmarks,
  opportunities,
  organizations,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { applyToOpportunityAction, toggleBookmarkAction } from "@/app/actions";
import {
  Card,
  PageHeader,
  StatusBadge,
  Tag,
  formatDate,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { StorageUploadField } from "@/components/app/storage-upload";
import { isStorageConfigured } from "@/lib/storage";
import { isPast } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  const [row] = await db
    .select({ opportunity: opportunities, organization: organizations })
    .from(opportunities)
    .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!row) notFound();

  const { opportunity, organization } = row;
  const isOwner =
    organization.ownerId === profile.id || profile.role === "admin";

  if (opportunity.status !== "published" && !isOwner) {
    notFound();
  }

  const [application] = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.opportunityId, opportunity.id),
        eq(applications.studentId, profile.id),
      ),
    )
    .limit(1);

  const [bookmark] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, profile.id),
        eq(bookmarks.entityType, "opportunity"),
        eq(bookmarks.entityId, opportunity.id),
      ),
    )
    .limit(1);

  const deadlinePassed = isPast(opportunity.deadline);
  const canApply =
    opportunity.status === "published" &&
    !deadlinePassed &&
    !application &&
    (profile.role === "student" || profile.role === "admin") &&
    !isOwner;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={opportunity.title}
        description={`${organization.name} · ${opportunity.type}`}
        action={
          <div className="flex gap-2">
            <form action={toggleBookmarkAction.bind(null, "opportunity", opportunity.id)}>
              <Button type="submit" variant="outline">
                {bookmark ? "Saved" : "Save"}
              </Button>
            </form>
            {isOwner ? (
              <Button render={<Link href={`/business/opportunities/${opportunity.id}`} />}>
                Manage
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{opportunity.type}</Tag>
              <Tag>{opportunity.remote}</Tag>
              <StatusBadge status={opportunity.status} />
            </div>
            <h2 className="mt-4 text-base font-semibold">About this opportunity</h2>
            <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm leading-6">
              {opportunity.description}
            </p>

            {opportunity.responsibilities ? (
              <>
                <h3 className="mt-5 text-sm font-semibold">Responsibilities</h3>
                <p className="text-muted-foreground mt-1 whitespace-pre-line text-sm leading-6">
                  {opportunity.responsibilities}
                </p>
              </>
            ) : null}

            {opportunity.eligibility ? (
              <>
                <h3 className="mt-5 text-sm font-semibold">Eligibility</h3>
                <p className="text-muted-foreground mt-1 whitespace-pre-line text-sm leading-6">
                  {opportunity.eligibility}
                </p>
              </>
            ) : null}
          </Card>

          {canApply ? (
            <Card>
              <h2 className="text-base font-semibold">Apply</h2>
              <form action={applyToOpportunityAction} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="opportunityId" value={opportunity.id} />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Cover letter (optional)</span>
                  <textarea
                    name="coverLetter"
                    rows={5}
                    className="bg-background rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    placeholder="Why are you a good fit?"
                  />
                </label>
                <StorageUploadField
                  name="resumeUrl"
                  kind="document"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  label="Resume (optional)"
                  storageEnabled={isStorageConfigured()}
                />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Portfolio URL (optional)</span>
                  <input
                    name="portfolioUrl"
                    type="url"
                    className="bg-background h-10 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    placeholder="https://…"
                  />
                </label>
                <Button type="submit">Submit application</Button>
              </form>
            </Card>
          ) : application ? (
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Application submitted</p>
                <p className="text-muted-foreground text-sm">
                  Submitted {formatDate(application.createdAt)}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </Card>
          ) : deadlinePassed ? (
            <Card>
              <p className="font-medium">Applications closed</p>
              <p className="text-muted-foreground text-sm">
                The deadline was {formatDate(opportunity.deadline)}.
              </p>
            </Card>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Organization</dt>
                <dd className="text-right">{organization.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right">{opportunity.location ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Work mode</dt>
                <dd className="text-right capitalize">{opportunity.remote}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Compensation</dt>
                <dd className="text-right">{opportunity.compensation ?? "Not disclosed"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="text-right">{opportunity.duration ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Deadline</dt>
                <dd className="text-right">{formatDate(opportunity.deadline)}</dd>
              </div>
            </dl>
          </Card>

          {opportunity.skills.length ? (
            <Card>
              <h2 className="text-sm font-semibold">Required skills</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opportunity.skills.map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))}
              </div>
            </Card>
          ) : null}

          {opportunity.requiredDocuments.length ? (
            <Card>
              <h2 className="text-sm font-semibold">Required documents</h2>
              <ul className="text-muted-foreground mt-2 list-inside list-disc text-sm">
                {opportunity.requiredDocuments.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
