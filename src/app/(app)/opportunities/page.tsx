import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { opportunities, organizations } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import {
  Card,
  EmptyState,
  PageHeader,
  Tag,
  formatDate,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const opportunityTypes = [
  "internship",
  "job",
  "research",
  "scholarship",
  "hackathon",
  "other",
] as const;

type OpportunityType = (typeof opportunityTypes)[number];

const types = ["all", ...opportunityTypes] as const;

function asOpportunityType(value: string | undefined): OpportunityType | undefined {
  return opportunityTypes.find((item) => item === value);
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const profile = await requireProfile();
  const { q, type } = await searchParams;
  const activeType = asOpportunityType(type);

  const filters = [eq(opportunities.status, "published")];
  if (activeType) {
    filters.push(eq(opportunities.type, activeType));
  }
  if (q?.trim()) {
    filters.push(
      or(
        ilike(opportunities.title, `%${q.trim()}%`),
        ilike(opportunities.description, `%${q.trim()}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      type: opportunities.type,
      description: opportunities.description,
      location: opportunities.location,
      remote: opportunities.remote,
      deadline: opportunities.deadline,
      skills: opportunities.skills,
      orgName: organizations.name,
    })
    .from(opportunities)
    .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(and(...filters))
    .orderBy(desc(opportunities.publishedAt))
    .limit(60);

  const canPost = profile.role === "business" || profile.role === "admin";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Opportunities"
        description="Internships, entry-level roles, research positions, scholarships and competitions from verified partners."
        action={
          canPost ? (
            <Button render={<Link href="/opportunities/new" />}>Post opportunity</Button>
          ) : null
        }
      />

      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search opportunities…"
          className="bg-secondary h-10 flex-1 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <select
          name="type"
          defaultValue={activeType ?? "all"}
          className="bg-secondary h-10 rounded-lg px-3 text-sm capitalize outline-none"
        >
          {types.map((item) => (
            <option key={item} value={item} className="capitalize">
              {item}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Link key={row.id} href={`/opportunities/${row.id}`}>
              <Card className="h-full transition-colors hover:bg-secondary/40">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag>{row.type}</Tag>
                  <Tag>{row.remote}</Tag>
                </div>
                <h2 className="mt-3 text-lg font-semibold">{row.title}</h2>
                <p className="text-muted-foreground text-sm">{row.orgName}</p>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                  {row.description}
                </p>
                <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>{row.location ?? "Location not specified"}</span>
                  <span>Apply by {formatDate(row.deadline)}</span>
                </div>
                {row.skills.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.skills.slice(0, 5).map((skill) => (
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
          title="No opportunities found"
          description={
            q || activeType
              ? "Try a different search or filter."
              : "Verified partners haven't published any opportunities yet."
          }
        />
      )}
    </div>
  );
}
