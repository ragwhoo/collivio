import Link from "next/link";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  communities,
  opportunities,
  organizations,
  profiles,
  projects,
  resources,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { Card, EmptyState, PageHeader, Tag } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireProfile();
  const { q } = await searchParams;
  const term = q?.trim() ?? "";

  if (!term) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          title="Explore Collivio"
          description="Search across opportunities, projects, communities, students and resources."
        />
        <EmptyState
          title="Start with a search"
          description="Try a skill, college, project topic or role."
        />
      </div>
    );
  }

  const like = `%${term}%`;

  const [opportunityRows, projectRows, communityRows, studentRows, resourceRows] =
    await Promise.all([
      db
        .select({
          id: opportunities.id,
          title: opportunities.title,
          orgName: organizations.name,
        })
        .from(opportunities)
        .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
        .where(
          and(
            eq(opportunities.status, "published"),
            or(ilike(opportunities.title, like), ilike(opportunities.description, like)),
          ),
        )
        .limit(8),
      db
        .select({ id: projects.id, title: projects.title, category: projects.category })
        .from(projects)
        .where(
          and(
            eq(projects.status, "published"),
            eq(projects.visibility, "public"),
            or(ilike(projects.title, like), ilike(projects.description, like)),
          ),
        )
        .limit(8),
      db
        .select({
          id: communities.id,
          slug: communities.slug,
          name: communities.name,
          description: communities.description,
        })
        .from(communities)
        .where(or(ilike(communities.name, like), ilike(communities.description, like)))
        .limit(8),
      db
        .select({
          id: profiles.id,
          displayName: profiles.displayName,
          college: profiles.college,
          skills: profiles.skills,
        })
        .from(profiles)
        .where(
          and(
            eq(profiles.role, "student"),
            eq(profiles.suspended, false),
            eq(profiles.visibility, "public"),
            or(
              ilike(profiles.displayName, like),
              ilike(profiles.college, like),
              sql`array_to_string(${profiles.skills}, ',') ilike ${like}`,
            ),
          ),
        )
        .limit(8),
      db
        .select({ id: resources.id, title: resources.title, category: resources.category })
        .from(resources)
        .where(or(ilike(resources.title, like), ilike(resources.description, like)))
        .limit(8),
    ]);

  const total =
    opportunityRows.length +
    projectRows.length +
    communityRows.length +
    studentRows.length +
    resourceRows.length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={`Results for “${term}”`}
        description={`${total} result${total === 1 ? "" : "s"} across Collivio.`}
        action={<Button variant="outline" render={<Link href="/dashboard" />}>Back home</Button>}
      />

      <div className="flex flex-col gap-6">
        {opportunityRows.length ? (
          <section>
            <h2 className="mb-2 text-base font-semibold">Opportunities</h2>
            <div className="flex flex-col gap-2">
              {opportunityRows.map((row) => (
                <Link key={row.id} href={`/opportunities/${row.id}`}>
                  <Card className="transition-colors hover:bg-secondary/40">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-sm">{row.orgName}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {projectRows.length ? (
          <section>
            <h2 className="mb-2 text-base font-semibold">Research & projects</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {projectRows.map((row) => (
                <Link key={row.id} href={`/research/${row.id}`}>
                  <Card className="h-full transition-colors hover:bg-secondary/40">
                    <Tag>{row.category}</Tag>
                    <p className="mt-2 font-medium">{row.title}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {studentRows.length ? (
          <section>
            <h2 className="mb-2 text-base font-semibold">Students</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {studentRows.map((row) => (
                <Link key={row.id} href={`/students/${row.id}`}>
                  <Card className="h-full transition-colors hover:bg-secondary/40">
                    <p className="font-medium">{row.displayName}</p>
                    <p className="text-muted-foreground text-sm">{row.college ?? "Student"}</p>
                    {row.skills.length ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {row.skills.slice(0, 4).join(", ")}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {communityRows.length ? (
          <section>
            <h2 className="mb-2 text-base font-semibold">Communities</h2>
            <div className="flex flex-col gap-2">
              {communityRows.map((row) => (
                <Link key={row.id} href={`/communities/${row.slug}`}>
                  <Card className="transition-colors hover:bg-secondary/40">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-muted-foreground line-clamp-1 text-sm">
                      {row.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {resourceRows.length ? (
          <section>
            <h2 className="mb-2 text-base font-semibold">Resources</h2>
            <div className="flex flex-col gap-2">
              {resourceRows.map((row) => (
                <Link key={row.id} href="/resources">
                  <Card className="transition-colors hover:bg-secondary/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{row.title}</p>
                      <Tag>{row.category}</Tag>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!total ? (
          <EmptyState
            title="No results"
            description="Try a broader term, or browse a module from the sidebar."
          />
        ) : null}
      </div>
    </div>
  );
}
