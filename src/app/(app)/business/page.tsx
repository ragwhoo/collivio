import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applicationNotes,
  applications,
  opportunities,
  organizations,
  profiles,
} from "@/lib/db/schema";
import { requireBusiness } from "@/lib/auth/session";
import { isValidApplicationTransition } from "@/lib/authz";
import { resolveStorageUrl } from "@/lib/storage";
import {
  addApplicationNoteFormAction,
  createOrganizationAction,
  submitVerificationFormAction,
  updateApplicationStatusAction,
  updateOpportunityStatusAction,
} from "@/app/actions";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Stat,
  formatDate,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

const nextStatuses = [
  "under_review",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
] as const;

export default async function BusinessPortalPage() {
  const profile = await requireBusiness();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.ownerId, profile.id))
    .limit(1);

  if (!org) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <PageHeader
          title="Business Portal"
          description="Register your organization to post opportunities. An administrator must approve it before publishing."
        />
        <Card>
          <h2 className="text-base font-semibold">Create your organization</h2>
          <form action={createOrganizationAction} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Organization name</span>
              <input name="name" required className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Website</span>
              <input name="website" type="url" className={input} placeholder="https://…" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Logo URL</span>
              <input name="logoUrl" type="url" className={input} placeholder="https://…" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Description</span>
              <textarea
                name="description"
                rows={4}
                className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Verification notes</span>
              <textarea
                name="verificationNotes"
                rows={3}
                placeholder="Company registration details, official email domain, etc."
                className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <Button type="submit" className="self-start">
              Create organization
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const [opportunityRows, applicationRows, noteRows] = await Promise.all([
    db
      .select()
      .from(opportunities)
      .where(eq(opportunities.organizationId, org.id))
      .orderBy(desc(opportunities.createdAt)),
    db
      .select({
        application: applications,
        studentName: profiles.displayName,
        studentId: profiles.id,
        studentCollege: profiles.college,
        opportunityTitle: opportunities.title,
      })
      .from(applications)
      .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .innerJoin(profiles, eq(applications.studentId, profiles.id))
      .where(eq(opportunities.organizationId, org.id))
      .orderBy(desc(applications.createdAt)),
    db
      .select()
      .from(applicationNotes)
      .where(eq(applicationNotes.organizationId, org.id)),
  ]);

  const notesByApplication = new Map<string, typeof noteRows>();
  for (const note of noteRows) {
    const list = notesByApplication.get(note.applicationId) ?? [];
    list.push(note);
    notesByApplication.set(note.applicationId, list);
  }

  const documentsByApplication = new Map(
    await Promise.all(
      applicationRows.map(async (row) => [
        row.application.id,
        {
          resume: await resolveStorageUrl(row.application.resumeUrl),
          portfolio: await resolveStorageUrl(row.application.portfolioUrl),
        },
      ] as const),
    ),
  );

  const published = opportunityRows.filter((row) => row.status === "published").length;
  const totalApplications = applicationRows.length;
  const shortlisted = applicationRows.filter((row) =>
    ["shortlisted", "interview", "accepted"].includes(row.application.status),
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={org.name}
        description="Manage verification, listings and applicants."
        action={
          <Button render={<Link href="/opportunities/new" />}>Post opportunity</Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Listings" value={opportunityRows.length} />
        <Stat label="Published" value={published} />
        <Stat label="Applications" value={totalApplications} />
        <Stat label="In progress" value={shortlisted} hint="Shortlisted or beyond" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Verification</h2>
              <StatusBadge status={org.verificationStatus} />
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {org.verified
                ? "Your organization is verified and can publish opportunities."
                : "You can create drafts. An administrator must approve your organization before any listing can be published."}
            </p>
            {org.website ? (
              <a
                href={org.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary mt-2 block text-sm hover:underline"
              >
                {org.website}
              </a>
            ) : null}
            {!org.verified ? (
              <form action={submitVerificationFormAction} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="organizationId" value={org.id} />
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Add verification details for the admin team"
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
                <Button type="submit" size="sm" variant="outline">
                  Submit for verification
                </Button>
              </form>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Organization</h2>
            <p className="text-muted-foreground mt-2 text-sm">{org.description ?? "No description."}</p>
            <p className="text-muted-foreground mt-2 text-xs">Created {formatDate(org.createdAt)}</p>
          </Card>
        </aside>

        <div className="flex flex-col gap-5">
          <section>
            <h2 className="mb-3 text-base font-semibold">Your listings</h2>
            {opportunityRows.length ? (
              <div className="flex flex-col gap-3">
                {opportunityRows.map((opportunity) => (
                  <Card key={opportunity.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/opportunities/${opportunity.id}`}
                            className="font-medium hover:underline"
                          >
                            {opportunity.title}
                          </Link>
                          <StatusBadge status={opportunity.status} />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {opportunity.type} · {opportunity.remote} · Deadline{" "}
                          {formatDate(opportunity.deadline)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.status !== "published" ? (
                          <form
                            action={updateOpportunityStatusAction.bind(
                              null,
                              opportunity.id,
                              "published",
                            )}
                          >
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!org.verified}
                              title={
                                org.verified
                                  ? undefined
                                  : "Verification required to publish"
                              }
                            >
                              Publish
                            </Button>
                          </form>
                        ) : (
                          <form
                            action={updateOpportunityStatusAction.bind(
                              null,
                              opportunity.id,
                              "closed",
                            )}
                          >
                            <Button type="submit" size="sm" variant="outline">
                              Close
                            </Button>
                          </form>
                        )}
                        <form
                          action={updateOpportunityStatusAction.bind(
                            null,
                            opportunity.id,
                            "draft",
                          )}
                        >
                          <Button type="submit" size="sm" variant="ghost">
                            Unpublish
                          </Button>
                        </form>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No listings yet"
                description="Create a draft and publish it once your organization is verified."
                action={<Button render={<Link href="/opportunities/new" />}>Post opportunity</Button>}
              />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Applicants</h2>
            {applicationRows.length ? (
              <div className="flex flex-col gap-3">
                {applicationRows.map((row) => {
                  const app = row.application;
                  const allowed = nextStatuses.filter((status) =>
                    isValidApplicationTransition(app.status, status),
                  );
                  const notes = notesByApplication.get(app.id) ?? [];
                  const documents = documentsByApplication.get(app.id);
                  return (
                    <Card key={app.id}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Link
                            href={`/students/${row.studentId}`}
                            className="font-medium hover:underline"
                          >
                            {row.studentName}
                          </Link>
                          <p className="text-muted-foreground text-sm">
                            Applied to {row.opportunityTitle}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {row.studentCollege ?? "College not specified"} ·{" "}
                            {formatDate(app.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>

                      {app.coverLetter ? (
                        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                          {app.coverLetter}
                        </p>
                      ) : null}

                      {documents?.resume || documents?.portfolio ? (
                        <div className="mt-2 flex flex-wrap gap-3 text-sm">
                          {documents.resume ? (
                            <a
                              className="text-primary hover:underline"
                              href={documents.resume}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Resume
                            </a>
                          ) : null}
                          {documents.portfolio ? (
                            <a
                              className="text-primary hover:underline"
                              href={documents.portfolio}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Portfolio
                            </a>
                          ) : null}
                        </div>
                      ) : null}

                      {allowed.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {allowed.map((status) => (
                            <form
                              key={status}
                              action={updateApplicationStatusAction.bind(
                                null,
                                app.id,
                                status,
                              )}
                            >
                              <Button type="submit" size="sm" variant="outline" className="capitalize">
                                {status.replace("_", " ")}
                              </Button>
                            </form>
                          ))}
                        </div>
                      ) : null}

                      <details className="mt-3">
                        <summary className="text-muted-foreground cursor-pointer text-sm">
                          Private notes ({notes.length})
                        </summary>
                        <ul className="mt-2 flex flex-col gap-2">
                          {notes.map((note) => (
                            <li key={note.id} className="bg-secondary/50 rounded-lg p-2 text-sm">
                              {note.note}
                              <span className="text-muted-foreground mt-1 block text-xs">
                                {formatDate(note.createdAt)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <form action={addApplicationNoteFormAction} className="mt-2 flex flex-col gap-2">
                          <input type="hidden" name="applicationId" value={app.id} />
                          <textarea
                            name="note"
                            rows={2}
                            required
                            placeholder="Visible only to your organization"
                            className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                          />
                          <Button type="submit" size="sm" className="self-start">
                            Add note
                          </Button>
                        </form>
                      </details>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No applicants yet"
                description="Applications will appear here once your listings are published."
              />
            )}
          </section>
        </div>
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Application documents and notes are private to your organization and the applicant.
      </p>
    </div>
  );
}
