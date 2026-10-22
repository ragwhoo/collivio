import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  Briefcase,
  Calendar,
  FlaskConical,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  bookmarks,
  communities,
  discussions,
  events,
  mediaPosts,
  notifications,
  opportunities,
  organizations,
  profiles,
  projects,
} from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { resolveStorageUrl } from "@/lib/storage";
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  Tag,
  formatDate,
  formatDateTime,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function completeness(profile: {
  bio: string | null;
  college: string | null;
  degree: string | null;
  skills: string[];
  avatarUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
}) {
  const checks = [
    Boolean(profile.bio),
    Boolean(profile.college),
    Boolean(profile.degree),
    profile.skills.length > 0,
    Boolean(profile.avatarUrl),
    Boolean(profile.githubUrl || profile.linkedinUrl),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function dayParts(value: Date) {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date),
  };
}

function Bento({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card flex flex-col rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function BentoHeader({
  icon: Icon,
  title,
  href,
  linkLabel = "View all",
}: {
  icon: LucideIcon;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs"
        >
          {linkLabel}
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function DashboardHome() {
  const profile = await requireProfile();
  const now = new Date();

  const [
    trendingOpportunities,
    latestProjects,
    mediaRows,
    upcomingEvents,
    recentDiscussions,
    suggestedStudents,
    myApplications,
    recentNotifications,
    communityCount,
    bookmarkCount,
    unreadCount,
  ] = await Promise.all([
    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
        location: opportunities.location,
        remote: opportunities.remote,
        deadline: opportunities.deadline,
        orgName: organizations.name,
      })
      .from(opportunities)
      .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
      .where(eq(opportunities.status, "published"))
      .orderBy(desc(opportunities.publishedAt))
      .limit(4),
    db
      .select({
        id: projects.id,
        title: projects.title,
        category: projects.category,
        skills: projects.skillsRequired,
        author: profiles.displayName,
        collaborationOpen: projects.collaborationOpen,
      })
      .from(projects)
      .innerJoin(profiles, eq(projects.ownerId, profiles.id))
      .where(and(eq(projects.status, "published"), eq(projects.visibility, "public")))
      .orderBy(desc(projects.createdAt))
      .limit(3),
    db
      .select({
        id: mediaPosts.id,
        imageUrl: mediaPosts.imageUrl,
        caption: mediaPosts.caption,
        author: profiles.displayName,
      })
      .from(mediaPosts)
      .innerJoin(profiles, eq(mediaPosts.authorId, profiles.id))
      .where(and(eq(mediaPosts.visibility, "public"), sql`${mediaPosts.deletedAt} is null`))
      .orderBy(desc(mediaPosts.createdAt))
      .limit(4),
    db
      .select({
        id: events.id,
        title: events.title,
        type: events.type,
        startsAt: events.startsAt,
        location: events.location,
      })
      .from(events)
      .where(gte(events.startsAt, now))
      .orderBy(events.startsAt)
      .limit(3),
    db
      .select({
        id: discussions.id,
        title: discussions.title,
        community: communities.name,
        createdAt: discussions.createdAt,
        author: profiles.displayName,
      })
      .from(discussions)
      .innerJoin(communities, eq(discussions.communityId, communities.id))
      .innerJoin(profiles, eq(discussions.authorId, profiles.id))
      .orderBy(desc(discussions.createdAt))
      .limit(4),
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
          ne(profiles.id, profile.id),
          eq(profiles.suspended, false),
          eq(profiles.visibility, "public"),
        ),
      )
      .orderBy(sql`random()`)
      .limit(4),
    db
      .select({
        id: applications.id,
        status: applications.status,
        title: opportunities.title,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.studentId, profile.id))
      .orderBy(desc(applications.createdAt))
      .limit(3),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, profile.id))
      .orderBy(desc(notifications.createdAt))
      .limit(3),
    db.select({ value: count() }).from(communities),
    db.select({ value: count() }).from(bookmarks).where(eq(bookmarks.userId, profile.id)),
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, profile.id), sql`${notifications.readAt} is null`)),
  ]);

  const completion = completeness(profile);
  const firstName = profile.displayName.split(" ")[0];
  const nextEvent = upcomingEvents[0];
  const latestMedia = await Promise.all(
    mediaRows.map(async (post) => ({
      ...post,
      imageUrl: (await resolveStorageUrl(post.imageUrl)) ?? post.imageUrl,
    })),
  );

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="A living snapshot of your campus — opportunities, research, media and people."
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" render={<Link href="/research/new" />}>
              <Plus className="size-4" /> Project
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/media" />}>
              <ImageIcon className="size-4" /> Media
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        {/* Hero */}
        <Bento className="from-primary/10 via-card to-card bg-gradient-to-br md:col-span-2 xl:col-span-8">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <div>
              <span className="bg-background/70 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                <Sparkles className="size-3.5" /> Your Collivio today
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Build, share and find your people.
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl text-sm">
                {myApplications.length
                  ? `You have ${myApplications.length} application${myApplications.length === 1 ? "" : "s"} in motion and ${Number(bookmarkCount[0]?.value ?? 0)} saved item${Number(bookmarkCount[0]?.value ?? 0) === 1 ? "" : "s"}.`
                  : "Start by exploring an opportunity, joining a community or publishing something you're working on."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:max-w-md">
              <div className="bg-background/70 rounded-xl border px-3 py-2">
                <p className="text-lg font-semibold">{myApplications.length}</p>
                <p className="text-muted-foreground text-[11px]">Applications</p>
              </div>
              <div className="bg-background/70 rounded-xl border px-3 py-2">
                <p className="text-lg font-semibold">{Number(bookmarkCount[0]?.value ?? 0)}</p>
                <p className="text-muted-foreground text-[11px]">Saved</p>
              </div>
              <div className="bg-background/70 rounded-xl border px-3 py-2">
                <p className="text-lg font-semibold">{Number(unreadCount[0]?.value ?? 0)}</p>
                <p className="text-muted-foreground text-[11px]">Unread</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" render={<Link href="/communities" />}>
                <MessageSquare className="size-4" /> Start a discussion
              </Button>
              <Button size="sm" variant="secondary" render={<Link href="/opportunities" />}>
                <Briefcase className="size-4" /> Explore opportunities
              </Button>
              <Button size="sm" variant="secondary" render={<Link href="/students" />}>
                <Users className="size-4" /> Find collaborators
              </Button>
            </div>
          </div>
        </Bento>

        {/* Profile completion */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={Sparkles} title="Profile strength" href="/profile" linkLabel="Edit" />
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-semibold">{completion}%</span>
                <span className="text-muted-foreground text-xs">
                  {completion >= 100 ? "Complete" : "Keep going"}
                </span>
              </div>
              <div className="bg-secondary mt-2 h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              {profile.college ? (
                <p>
                  {profile.degree ?? "Student"} · {profile.college}
                </p>
              ) : (
                <p>Add your college and skills so collaborators can find you.</p>
              )}
              {profile.skills.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 4).map((skill) => (
                    <Tag key={skill}>{skill}</Tag>
                  ))}
                </div>
              ) : null}
            </div>
            <Button variant="outline" size="sm" render={<Link href="/profile" />}>
              {completion >= 100 ? "View public profile" : "Complete profile"}
            </Button>
          </div>
        </Bento>

        {/* Opportunities */}
        <Bento className="md:col-span-2 xl:col-span-8">
          <BentoHeader icon={Briefcase} title="Recommended opportunities" href="/opportunities" />
          {trendingOpportunities.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {trendingOpportunities.map((item) => (
                <Link key={item.id} href={`/opportunities/${item.id}`} className="group">
                  <div className="hover:bg-secondary/50 flex h-full flex-col rounded-xl border p-3 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <Tag>{item.type}</Tag>
                      <span className="text-muted-foreground text-[11px] capitalize">
                        {item.remote}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium group-hover:underline">{item.title}</p>
                    <p className="text-muted-foreground text-xs">{item.orgName}</p>
                    <p className="text-muted-foreground mt-auto pt-2 text-[11px]">
                      {item.location ?? "Location TBD"} · Apply by {formatDate(item.deadline)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No published opportunities yet"
              description="Verified partners haven't posted opportunities. Check back soon."
            />
          )}
        </Bento>

        {/* Next event */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={Calendar} title="Upcoming events" href="/events" />
          {nextEvent ? (
            <div className="flex flex-1 flex-col gap-4">
              <Link href={`/events/${nextEvent.id}`} className="group flex gap-3">
                <div className="bg-primary/10 text-primary flex size-14 shrink-0 flex-col items-center justify-center rounded-xl">
                  <span className="text-[10px] font-semibold uppercase">
                    {dayParts(nextEvent.startsAt).month}
                  </span>
                  <span className="text-lg font-semibold leading-none">
                    {dayParts(nextEvent.startsAt).day}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:underline">{nextEvent.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDateTime(nextEvent.startsAt)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {nextEvent.location ?? "Online"} · {nextEvent.type}
                  </p>
                </div>
              </Link>
              {upcomingEvents.slice(1).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="hover:bg-secondary/50 flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 transition-colors"
                >
                  <span className="truncate text-xs font-medium">{event.title}</span>
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {formatDate(event.startsAt)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No upcoming events" />
          )}
          <Button className="mt-3" size="sm" variant="outline" render={<Link href="/events" />}>
            Browse events
          </Button>
        </Bento>

        {/* Research */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={FlaskConical} title="Research Hub" href="/research" />
          {latestProjects.length ? (
            <div className="flex flex-1 flex-col gap-2">
              {latestProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/research/${project.id}`}
                  className="group hover:bg-secondary/50 rounded-xl border p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Tag>{project.category}</Tag>
                    {project.collaborationOpen ? (
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        Open to join
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm font-medium group-hover:underline">
                    {project.title}
                  </p>
                  <p className="text-muted-foreground text-xs">by {project.author}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No projects yet" />
          )}
        </Bento>

        {/* Media */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={ImageIcon} title="Media Lab" href="/media" />
          {latestMedia.length ? (
            <div className="grid flex-1 grid-cols-2 gap-2">
              {latestMedia.map((post) => (
                <Link key={post.id} href="/media" className="group block">
                  <div className="bg-secondary relative aspect-square overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.caption ?? "Campus media"}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 truncate text-[11px]">
                    {post.caption ?? post.author}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No media yet" />
          )}
        </Bento>

        {/* Discussions */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={Users} title="Community conversations" href="/communities" />
          {recentDiscussions.length ? (
            <div className="flex flex-1 flex-col divide-y">
              {recentDiscussions.map((discussion) => (
                <Link
                  key={discussion.id}
                  href={`/discussions/${discussion.id}`}
                  className="group -mx-1 rounded-lg px-1 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-secondary/50"
                >
                  <p className="text-sm font-medium group-hover:underline">{discussion.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    {discussion.community} · {formatDate(discussion.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No discussions yet" />
          )}
          <p className="text-muted-foreground mt-3 text-xs">
            {Number(communityCount[0]?.value ?? 0)} communities on Collivio
          </p>
        </Bento>

        {/* Applications */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={Briefcase} title="Application updates" href="/applications" />
          {myApplications.length ? (
            <ul className="flex flex-1 flex-col divide-y">
              {myApplications.map((application) => (
                <li
                  key={application.id}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{application.title}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground flex flex-1 flex-col justify-center text-sm">
              <p>You haven&apos;t applied to anything yet.</p>
              <Button className="mt-3 self-start" size="sm" variant="outline" render={<Link href="/opportunities" />}>
                Find an opportunity
              </Button>
            </div>
          )}
        </Bento>

        {/* People */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={Users} title="People to meet" href="/students" />
          {suggestedStudents.length ? (
            <div className="flex flex-1 flex-col gap-2">
              {suggestedStudents.map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="flex items-center gap-3 rounded-xl border p-2.5 transition-colors hover:bg-secondary/50"
                >
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {student.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{student.displayName}</p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {student.college ?? "Student"}
                    </p>
                  </div>
                  {student.skills.length ? (
                    <span className="text-muted-foreground ml-auto hidden shrink-0 text-[10px] sm:block">
                      {student.skills[0]}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No students to suggest yet" />
          )}
        </Bento>

        {/* Notifications */}
        <Bento className="md:col-span-2 xl:col-span-8">
          <BentoHeader icon={Bell} title="Notifications" href="/notifications" />
          {recentNotifications.length ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {recentNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href ?? "/notifications"}
                  className={cn(
                    "rounded-xl border p-3 transition-colors hover:bg-secondary/50",
                    !notification.readAt && "border-primary/30 bg-primary/5",
                  )}
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {notification.body ?? formatDate(notification.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-1 items-center text-sm">
              You&apos;re all caught up.
            </div>
          )}
        </Bento>

        {/* Saved */}
        <Bento className="xl:col-span-4">
          <BentoHeader icon={Bookmark} title="Saved for later" href="/bookmarks" />
          <div className="flex flex-1 flex-col items-start justify-between gap-3">
            <p className="text-3xl font-semibold">{Number(bookmarkCount[0]?.value ?? 0)}</p>
            <p className="text-muted-foreground text-sm">
              Opportunities, projects, events and resources you bookmarked.
            </p>
            <Button size="sm" variant="outline" render={<Link href="/bookmarks" />}>
              Open bookmarks
            </Button>
          </div>
        </Bento>
      </div>
    </div>
  );
}
