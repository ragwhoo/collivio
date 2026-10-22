import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireBusiness } from "@/lib/auth/session";
import { createOpportunityAction } from "@/app/actions";
import { Card, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";
const textarea =
  "bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function NewOpportunityPage() {
  const profile = await requireBusiness();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.ownerId, profile.id))
    .limit(1);

  if (!org) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Post an opportunity" />
        <Card>
          <p className="font-medium">Create your organization first</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Opportunities are published on behalf of a verified organization.
          </p>
          <Button className="mt-4" render={<a href="/business" />}>
            Go to business portal
          </Button>
        </Card>
      </div>
    );
  }

  const canPublish = org.verified && org.verificationStatus === "approved";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Post an opportunity"
        description={
          canPublish
            ? `Publishing as ${org.name}.`
            : `${org.name} is not verified yet. You can save a draft, but publishing requires admin approval.`
        }
      />

      <Card>
        <form action={createOpportunityAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Title</span>
            <input name="title" required className={input} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Type</span>
              <select name="type" className={input}>
                {["internship", "job", "research", "scholarship", "hackathon", "other"].map(
                  (type) => (
                    <option key={type} value={type} className="capitalize">
                      {type}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Work mode</span>
              <select name="remote" className={input}>
                <option value="onsite">Onsite</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea name="description" required rows={6} className={textarea} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Responsibilities</span>
            <textarea name="responsibilities" rows={4} className={textarea} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Eligibility</span>
            <textarea name="eligibility" rows={3} className={textarea} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Required skills (comma separated)</span>
              <input name="skills" className={input} placeholder="React, TypeScript" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Preferred skills</span>
              <input name="preferredSkills" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Location</span>
              <input name="location" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Compensation</span>
              <input name="compensation" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Duration</span>
              <input name="duration" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Application deadline</span>
              <input name="deadline" type="date" className={input} />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Required documents (comma separated)</span>
            <input name="requiredDocuments" className={input} placeholder="Resume, Portfolio" />
          </label>

          {canPublish ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="publish" className="size-4" />
              <span>Publish immediately</span>
            </label>
          ) : null}

          <Button type="submit" className="self-start">
            Save opportunity
          </Button>
        </form>
      </Card>
    </div>
  );
}
