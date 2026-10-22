import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookmarks,
  collaborationRequests,
  comments,
  profiles,
  projectContributors,
  projectLikes,
  projects,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { canViewProject } from "@/lib/authz";
import {
  commentOnProjectAction,
  likeProjectAction,
  requestCollaborationAction,
  respondToCollaborationAction,
  toggleBookmarkAction,
} from "@/app/actions";
import {
  Card,
  PageHeader,
  StatusBadge,
  Tag,
  formatDate,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  const [row] = await db
    .select({ project: projects, owner: profiles })
    .from(projects)
    .innerJoin(profiles, eq(projects.ownerId, profiles.id))
    .where(eq(projects.id, id))
    .limit(1);

  if (!row) notFound();

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

  if (!canViewProject(profile, row.project, contributor)) notFound();

  const [contributors, likeCount, liked, projectComments, pendingRequests, bookmark, myRequest] =
    await Promise.all([
      db
        .select({
          userId: profiles.id,
          name: profiles.displayName,
          role: projectContributors.role,
          canEdit: projectContributors.canEdit,
        })
        .from(projectContributors)
        .innerJoin(profiles, eq(projectContributors.userId, profiles.id))
        .where(eq(projectContributors.projectId, id)),
      db
        .select({ value: count() })
        .from(projectLikes)
        .where(eq(projectLikes.projectId, id)),
      db
        .select({ id: projectLikes.id })
        .from(projectLikes)
        .where(and(eq(projectLikes.projectId, id), eq(projectLikes.userId, profile.id)))
        .limit(1),
      db
        .select({
          id: comments.id,
          body: comments.body,
          createdAt: comments.createdAt,
          author: profiles.displayName,
        })
        .from(comments)
        .innerJoin(profiles, eq(comments.authorId, profiles.id))
        .where(eq(comments.projectId, id))
        .orderBy(desc(comments.createdAt))
        .limit(50),
      row.project.ownerId === profile.id
        ? db
            .select({
              id: collaborationRequests.id,
              message: collaborationRequests.message,
              createdAt: collaborationRequests.createdAt,
              requesterId: profiles.id,
              requester: profiles.displayName,
            })
            .from(collaborationRequests)
            .innerJoin(profiles, eq(collaborationRequests.requesterId, profiles.id))
            .where(
              and(
                eq(collaborationRequests.projectId, id),
                eq(collaborationRequests.status, "pending"),
              ),
            )
        : Promise.resolve([]),
      db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, profile.id),
            eq(bookmarks.entityType, "project"),
            eq(bookmarks.entityId, id),
          ),
        )
        .limit(1),
      db
        .select()
        .from(collaborationRequests)
        .where(
          and(
            eq(collaborationRequests.projectId, id),
            eq(collaborationRequests.requesterId, profile.id),
          ),
        )
        .limit(1),
    ]);

  const isOwner = row.project.ownerId === profile.id || profile.role === "admin";
  const canRequest =
    row.project.collaborationOpen &&
    !isOwner &&
    !contributor &&
    !myRequest[0];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={row.project.title}
        description={`by ${row.owner.displayName} · ${formatDate(row.project.createdAt)}`}
        action={
          <div className="flex gap-2">
            <form action={likeProjectAction.bind(null, id)}>
              <Button type="submit" variant={liked[0] ? "default" : "outline"}>
                ♥ {Number(likeCount[0]?.value ?? 0)}
              </Button>
            </form>
            <form action={toggleBookmarkAction.bind(null, "project", id)}>
              <Button type="submit" variant="outline">
                {bookmark[0] ? "Saved" : "Save"}
              </Button>
            </form>
            {isOwner ? (
              <Button render={<Link href={`/research/${id}/edit`} />}>Edit</Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{row.project.category}</Tag>
              <StatusBadge status={row.project.status} />
              <Tag>{row.project.visibility}</Tag>
            </div>
            <p className="text-muted-foreground mt-4 whitespace-pre-line text-sm leading-6">
              {row.project.description}
            </p>
            {row.project.abstract ? (
              <>
                <h2 className="mt-5 text-sm font-semibold">Abstract</h2>
                <p className="text-muted-foreground mt-1 whitespace-pre-line text-sm leading-6">
                  {row.project.abstract}
                </p>
              </>
            ) : null}
            {row.project.objectives ? (
              <>
                <h2 className="mt-5 text-sm font-semibold">Objectives</h2>
                <p className="text-muted-foreground mt-1 whitespace-pre-line text-sm leading-6">
                  {row.project.objectives}
                </p>
              </>
            ) : null}
          </Card>

          {isOwner && pendingRequests.length ? (
            <Card>
              <h2 className="text-base font-semibold">Collaboration requests</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {pendingRequests.map((request) => (
                  <li key={request.id} className="rounded-xl border p-3">
                    <p className="font-medium">{request.requester}</p>
                    <p className="text-muted-foreground text-sm">
                      {request.message ?? "No message provided."}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <form action={respondToCollaborationAction.bind(null, request.id, true)}>
                        <Button type="submit" size="sm">
                          Accept
                        </Button>
                      </form>
                      <form action={respondToCollaborationAction.bind(null, request.id, false)}>
                        <Button type="submit" size="sm" variant="outline">
                          Decline
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {canRequest ? (
            <Card>
              <h2 className="text-base font-semibold">Request to collaborate</h2>
              <form action={requestCollaborationAction} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="projectId" value={id} />
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Tell the team how you can contribute…"
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
                <Button type="submit" className="self-start">
                  Send request
                </Button>
              </form>
            </Card>
          ) : myRequest[0] ? (
            <Card>
              <p className="font-medium">Collaboration request sent</p>
              <p className="text-muted-foreground text-sm">
                Status: {myRequest[0].status}
              </p>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-base font-semibold">Comments</h2>
            <form action={commentOnProjectAction} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="projectId" value={id} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Share feedback or ask a question…"
                className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
              <Button type="submit" className="self-start" size="sm">
                Comment
              </Button>
            </form>
            <ul className="mt-4 divide-y">
              {projectComments.map((comment) => (
                <li key={comment.id} className="py-3">
                  <p className="text-sm font-medium">{comment.author}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(comment.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm">{comment.body}</p>
                </li>
              ))}
              {!projectComments.length ? (
                <li className="text-muted-foreground py-3 text-sm">No comments yet.</li>
              ) : null}
            </ul>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <h2 className="text-sm font-semibold">Links</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {row.project.githubUrl ? (
                <a className="text-primary hover:underline" href={row.project.githubUrl} target="_blank" rel="noreferrer">
                  GitHub repository
                </a>
              ) : null}
              {row.project.demoUrl ? (
                <a className="text-primary hover:underline" href={row.project.demoUrl} target="_blank" rel="noreferrer">
                  Live demo
                </a>
              ) : null}
              {row.project.paperUrl ? (
                <a className="text-primary hover:underline" href={row.project.paperUrl} target="_blank" rel="noreferrer">
                  Research paper
                </a>
              ) : null}
              {!row.project.githubUrl && !row.project.demoUrl && !row.project.paperUrl ? (
                <p className="text-muted-foreground">No links provided.</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Tech stack</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {row.project.techStack.length ? (
                row.project.techStack.map((tech) => <Tag key={tech}>{tech}</Tag>)
              ) : (
                <p className="text-muted-foreground text-sm">Not specified.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Team</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {contributors.map((member) => (
                <li key={member.userId} className="flex items-center justify-between gap-2">
                  <Link className="hover:underline" href={`/students/${member.userId}`}>
                    {member.name}
                  </Link>
                  <span className="text-muted-foreground text-xs">{member.role}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
