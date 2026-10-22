import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, projects } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { Card, EmptyState, PageHeader, Tag, formatDate } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await requireProfile();
  const { q, category } = await searchParams;

  const filters = [eq(projects.status, "published"), eq(projects.visibility, "public")];
  if (category) filters.push(eq(projects.category, category));
  if (q?.trim()) {
    filters.push(
      or(
        ilike(projects.title, `%${q.trim()}%`),
        ilike(projects.description, `%${q.trim()}%`),
        ilike(projects.category, `%${q.trim()}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      category: projects.category,
      skills: projects.skillsRequired,
      techStack: projects.techStack,
      collaborationOpen: projects.collaborationOpen,
      createdAt: projects.createdAt,
      author: profiles.displayName,
      authorId: profiles.id,
    })
    .from(projects)
    .innerJoin(profiles, eq(projects.ownerId, profiles.id))
    .where(and(...filters))
    .orderBy(desc(projects.createdAt))
    .limit(60);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Research Hub"
        description="Projects, papers and prototypes from students — and open calls for collaborators."
        action={<Button render={<Link href="/research/new" />}>Publish a project</Button>}
      />

      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search projects, skills, categories…"
          className="bg-secondary h-10 flex-1 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <input
          name="category"
          defaultValue={category ?? ""}
          placeholder="Category"
          className="bg-secondary h-10 w-full rounded-lg px-3 text-sm outline-none sm:w-48"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((project) => (
            <Link key={project.id} href={`/research/${project.id}`}>
              <Card className="flex h-full flex-col transition-colors hover:bg-secondary/40">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag>{project.category}</Tag>
                  {project.collaborationOpen ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Open to collaborators
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-lg font-semibold">{project.title}</h2>
                <p className="text-muted-foreground text-sm">
                  by {project.author} · {formatDate(project.createdAt)}
                </p>
                <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm">
                  {project.description}
                </p>
                {project.skills.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.skills.slice(0, 4).map((skill) => (
                      <Tag key={skill}>{skill}</Tag>
                    ))}
                  </div>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects found"
          description="Be the first to publish your research or project."
          action={<Button render={<Link href="/research/new" />}>Publish a project</Button>}
        />
      )}
    </div>
  );
}
