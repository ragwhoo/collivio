import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectContributors, projects } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { canEditProject } from "@/lib/authz";
import { updateProjectStatusAction } from "@/app/actions";
import { Card, PageHeader, StatusBadge } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();

  const [contributor] = await db
    .select()
    .from(projectContributors)
    .where(
      and(
        eq(projectContributors.projectId, id),
        eq(projectContributors.userId, profile.id),
      ),
    )
    .limit(1);

  if (!canEditProject(profile, project, contributor)) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Manage project"
        description={project.title}
        action={<Button variant="outline" render={<Link href={`/research/${id}`} />}>View project</Button>}
      />
      <Card>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Current status</span>
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["draft", "published", "archived"] as const).map((status) => (
            <form key={status} action={updateProjectStatusAction.bind(null, id, status)}>
              <Button
                type="submit"
                variant={project.status === status ? "default" : "outline"}
                disabled={project.status === status}
                className="capitalize"
              >
                {status}
              </Button>
            </form>
          ))}
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          Archived projects are hidden from public search results. Drafts are only visible to
          you and your contributors.
        </p>
      </Card>
    </div>
  );
}
