import Link from "next/link";
import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { Card, EmptyState, PageHeader, Tag } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const viewer = await requireProfile();
  const { q } = await searchParams;

  const filters = [
    eq(profiles.role, "student"),
    eq(profiles.suspended, false),
    eq(profiles.visibility, "public"),
    ne(profiles.id, viewer.id),
  ];

  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    filters.push(
      or(
        ilike(profiles.displayName, term),
        ilike(profiles.college, term),
        ilike(profiles.bio, term),
        sql`array_to_string(${profiles.skills}, ',') ilike ${term}`,
      )!,
    );
  }

  const rows = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      college: profiles.college,
      degree: profiles.degree,
      bio: profiles.bio,
      skills: profiles.skills,
      graduationYear: profiles.graduationYear,
    })
    .from(profiles)
    .where(and(...filters))
    .limit(60);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Students"
        description="Find collaborators by skills, college and interests."
      />

      <form className="mb-5 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, college or skill…"
          className="bg-secondary h-10 flex-1 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((student) => (
            <Card key={student.id} className="flex h-full flex-col">
              <div className="flex items-center gap-3">
                <div className="bg-secondary flex size-10 items-center justify-center rounded-full text-sm font-medium">
                  {student.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <Link href={`/students/${student.id}`} className="font-medium hover:underline">
                    {student.displayName}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    {student.college ?? "College not specified"}
                  </p>
                </div>
              </div>
              {student.bio ? (
                <p className="text-muted-foreground mt-3 line-clamp-2 flex-1 text-sm">{student.bio}</p>
              ) : (
                <div className="flex-1" />
              )}
              {student.skills.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {student.skills.slice(0, 5).map((skill) => (
                    <Tag key={skill}>{skill}</Tag>
                  ))}
                </div>
              ) : null}
              {student.degree || student.graduationYear ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {[student.degree, student.graduationYear].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No students found"
          description={q ? "Try a different search." : "No public student profiles yet."}
        />
      )}
    </div>
  );
}
