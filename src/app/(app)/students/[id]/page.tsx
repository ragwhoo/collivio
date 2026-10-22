import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  communities,
  communityMembers,
  follows,
  profiles,
  projects,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { followStudentAction, startConversationAction } from "@/app/actions";
import { Card, PageHeader, Tag, formatDate } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const viewer = await requireProfile();

  const [student] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!student) notFound();

  const isSelf = viewer.id === student.id;
  const canViewFull =
    isSelf || viewer.role === "admin" || student.visibility === "public";

  const [projectRows, memberships, followerCount, following] = await Promise.all([
    canViewFull
      ? db
          .select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            category: projects.category,
            createdAt: projects.createdAt,
          })
          .from(projects)
          .where(
            and(
              eq(projects.ownerId, student.id),
              eq(projects.status, "published"),
              eq(projects.visibility, "public"),
            ),
          )
          .limit(12)
      : Promise.resolve([]),
    canViewFull
      ? db
          .select({ name: communities.name, slug: communities.slug, role: communityMembers.role })
          .from(communityMembers)
          .innerJoin(communities, eq(communityMembers.communityId, communities.id))
          .where(
            and(
              eq(communityMembers.userId, student.id),
              eq(communityMembers.status, "active"),
            ),
          )
          .limit(12)
      : Promise.resolve([]),
    db
      .select({ value: count() })
      .from(follows)
      .where(eq(follows.followingId, student.id)),
    db
      .select({ id: follows.id })
      .from(follows)
      .where(and(eq(follows.followerId, viewer.id), eq(follows.followingId, student.id)))
      .limit(1),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={student.displayName}
        description={
          canViewFull
            ? [student.degree, student.branch, student.college]
                .filter(Boolean)
                .join(" · ") || "Student on Collivio"
            : "This profile is restricted"
        }
        action={
          !isSelf ? (
            <div className="flex gap-2">
              <form action={startConversationAction.bind(null, student.id)}>
                <Button type="submit" variant="outline">
                  Message
                </Button>
              </form>
              <form action={followStudentAction.bind(null, student.id)}>
                <Button type="submit">{following[0] ? "Following" : "Follow"}</Button>
              </form>
            </div>
          ) : (
            <Button render={<Link href="/profile" />}>Edit profile</Button>
          )
        }
      />

      {!canViewFull ? (
        <Card>
          <p className="font-medium">This student keeps their profile private.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Their projects, skills and links are hidden. You can still follow them.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <div className="flex items-center gap-4">
                <div className="bg-secondary flex size-16 items-center justify-center rounded-full text-lg font-semibold">
                  {student.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold">{student.displayName}</p>
                  <p className="text-muted-foreground text-sm">
                    {student.college ?? "College not specified"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {Number(followerCount[0]?.value ?? 0)} followers
                  </p>
                </div>
              </div>
              {student.bio ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-6">{student.bio}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {student.githubUrl ? (
                  <a href={student.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    GitHub
                  </a>
                ) : null}
                {student.linkedinUrl ? (
                  <a href={student.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    LinkedIn
                  </a>
                ) : null}
                {student.portfolioUrl ? (
                  <a href={student.portfolioUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Portfolio
                  </a>
                ) : null}
              </div>
            </Card>

            <Card>
              <h2 className="text-base font-semibold">Projects</h2>
              {projectRows.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {projectRows.map((project) => (
                    <Link key={project.id} href={`/research/${project.id}`}>
                      <div className="h-full rounded-xl border p-3 transition-colors hover:bg-secondary/40">
                        <Tag>{project.category}</Tag>
                        <p className="mt-2 font-medium">{project.title}</p>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {project.description}
                        </p>
                        <p className="text-muted-foreground mt-2 text-xs">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">No public projects yet.</p>
              )}
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card>
              <h2 className="text-sm font-semibold">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {student.skills.length ? (
                  student.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
                ) : (
                  <p className="text-muted-foreground text-sm">No skills listed.</p>
                )}
              </div>
            </Card>
            <Card>
              <h2 className="text-sm font-semibold">Interests</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {student.interests.length ? (
                  student.interests.map((interest) => <Tag key={interest}>{interest}</Tag>)
                ) : (
                  <p className="text-muted-foreground text-sm">No interests listed.</p>
                )}
              </div>
            </Card>
            <Card>
              <h2 className="text-sm font-semibold">Communities</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {memberships.length ? (
                  memberships.map((membership) => (
                    <li key={membership.slug}>
                      <Link href={`/communities/${membership.slug}`} className="hover:underline">
                        {membership.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No community memberships.</li>
                )}
              </ul>
            </Card>
            <Card>
              <h2 className="text-sm font-semibold">Education</h2>
              <dl className="mt-2 flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">College</dt>
                  <dd className="text-right">{student.college ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Degree</dt>
                  <dd className="text-right">{student.degree ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Graduation</dt>
                  <dd className="text-right">{student.graduationYear ?? "—"}</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
