import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, resources } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { createResourceAction } from "@/app/actions";
import { Card, EmptyState, PageHeader, Tag, formatDate } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { StorageUploadField } from "@/components/app/storage-upload";
import { isStorageConfigured, resolveStorageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await requireProfile();
  const { q, category } = await searchParams;

  const filters = [];
  if (q?.trim()) {
    filters.push(
      or(
        ilike(resources.title, `%${q.trim()}%`),
        ilike(resources.description, `%${q.trim()}%`),
        ilike(resources.subject, `%${q.trim()}%`),
      )!,
    );
  }
  if (category?.trim()) {
    filters.push(eq(resources.category, category.trim()));
  }

  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      category: resources.category,
      subject: resources.subject,
      college: resources.college,
      url: resources.url,
      fileUrl: resources.fileUrl,
      tags: resources.tags,
      createdAt: resources.createdAt,
      author: profiles.displayName,
    })
    .from(resources)
    .innerJoin(profiles, eq(resources.authorId, profiles.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(resources.createdAt))
    .limit(60);

  const displayRows = await Promise.all(
    rows.map(async (resource) => ({
      ...resource,
      fileUrl: await resolveStorageUrl(resource.fileUrl),
    })),
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Resource Library"
        description="Notes, study guides, tutorials and project templates shared by students."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <form className="mb-5 flex flex-col gap-2 sm:flex-row">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search resources…"
              className="bg-secondary h-10 flex-1 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            <input
              name="category"
              defaultValue={category ?? ""}
              placeholder="Category"
              className="bg-secondary h-10 w-full rounded-lg px-3 text-sm outline-none sm:w-40"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {displayRows.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {displayRows.map((resource) => (
                <Card key={resource.id} className="flex h-full flex-col">
                  <div className="flex flex-wrap gap-2">
                    <Tag>{resource.category}</Tag>
                    {resource.subject ? <Tag>{resource.subject}</Tag> : null}
                  </div>
                  <h2 className="mt-3 font-semibold">{resource.title}</h2>
                  <p className="text-muted-foreground mt-1 line-clamp-3 flex-1 text-sm">
                    {resource.description}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {resource.author} · {formatDate(resource.createdAt)}
                    {resource.college ? ` · ${resource.college}` : ""}
                  </p>
                  {resource.tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {resource.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  ) : null}
                  {resource.url || resource.fileUrl ? (
                    <a
                      href={resource.url ?? resource.fileUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary mt-3 text-sm font-medium hover:underline"
                    >
                      Open resource →
                    </a>
                  ) : null}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No resources found"
              description="Share notes, guides or templates with the community."
            />
          )}
        </div>

        <aside>
          <Card className="sticky top-20">
            <h2 className="text-base font-semibold">Share a resource</h2>
            <form action={createResourceAction} className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Title</span>
                <input name="title" required className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Description</span>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Category</span>
                <select name="category" className={input}>
                  {[
                    "notes",
                    "study-guide",
                    "tutorial",
                    "template",
                    "reference",
                    "other",
                  ].map((category) => (
                    <option key={category} value={category} className="capitalize">
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Subject</span>
                <input name="subject" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">College</span>
                <input name="college" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Link URL</span>
                <input name="url" type="url" className={input} placeholder="https://…" />
              </label>
              <StorageUploadField
                name="fileUrl"
                kind="document"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                label="Attach a file (optional)"
                storageEnabled={isStorageConfigured()}
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Tags (comma separated)</span>
                <input name="tags" className={input} />
              </label>
              <Button type="submit">Share resource</Button>
              <p className="text-muted-foreground text-xs">
                Only share material you have the right to distribute.
              </p>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
