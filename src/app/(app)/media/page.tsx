import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { mediaLikes, mediaPosts, profiles } from "@/lib/db/schema";
import { requireProfile } from "@/lib/auth/session";
import { createMediaPostAction, likeMediaAction } from "@/app/actions";
import { Card, EmptyState, PageHeader, Tag, formatDate } from "@/components/app/ui";
import { StorageUploadField } from "@/components/app/storage-upload";
import { Button } from "@/components/ui/button";
import { isStorageConfigured, resolveStorageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function MediaPage() {
  const profile = await requireProfile();

  const [posts, likeRows, myLikes] = await Promise.all([
    db
      .select({
        id: mediaPosts.id,
        imageUrl: mediaPosts.imageUrl,
        caption: mediaPosts.caption,
        description: mediaPosts.description,
        album: mediaPosts.album,
        college: mediaPosts.college,
        tags: mediaPosts.tags,
        createdAt: mediaPosts.createdAt,
        authorId: profiles.id,
        author: profiles.displayName,
      })
      .from(mediaPosts)
      .innerJoin(profiles, eq(mediaPosts.authorId, profiles.id))
      .where(and(eq(mediaPosts.visibility, "public"), sql`${mediaPosts.deletedAt} is null`))
      .orderBy(desc(mediaPosts.createdAt))
      .limit(60),
    db
      .select({ mediaPostId: mediaLikes.mediaPostId, value: sql<number>`count(*)` })
      .from(mediaLikes)
      .groupBy(mediaLikes.mediaPostId),
    db
      .select({ mediaPostId: mediaLikes.mediaPostId })
      .from(mediaLikes)
      .where(eq(mediaLikes.userId, profile.id)),
  ]);

  const likeCounts = new Map(likeRows.map((row) => [row.mediaPostId, Number(row.value)]));
  const liked = new Set(myLikes.map((row) => row.mediaPostId));
  const displayPosts = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      imageUrl: (await resolveStorageUrl(post.imageUrl)) ?? post.imageUrl,
    })),
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Media Lab"
        description="An image-first look at campus life, events and creative work."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {displayPosts.length ? (
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4">
              {displayPosts.map((post) => (
                <article key={post.id} className="break-inside-avoid overflow-hidden rounded-2xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.imageUrl} alt={post.caption ?? "Campus media"} className="w-full object-cover" />
                  <div className="p-3">
                    {post.caption ? <p className="font-medium">{post.caption}</p> : null}
                    <p className="text-muted-foreground text-xs">
                      {post.author} · {formatDate(post.createdAt)}
                    </p>
                    {post.tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    ) : null}
                    <form action={likeMediaAction.bind(null, post.id)} className="mt-2">
                      <Button type="submit" variant={liked.has(post.id) ? "default" : "outline"} size="sm">
                        ♥ {likeCounts.get(post.id) ?? 0}
                      </Button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No media yet"
              description="Share the first campus moment in the Media Lab."
            />
          )}
        </div>

        <aside>
          <Card className="sticky top-20">
            <h2 className="text-base font-semibold">Share media</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {isStorageConfigured()
                ? "Images are stored in a private bucket and served through short-lived signed URLs."
                : "Direct uploads require object storage credentials. For now, share a hosted image URL."}
            </p>
            <form action={createMediaPostAction} className="mt-3 flex flex-col gap-3">
              <StorageUploadField
                name="imageUrl"
                kind="media"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                label="Image"
                storageEnabled={isStorageConfigured()}
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Caption</span>
                <input name="caption" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Album</span>
                <input name="album" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">College</span>
                <input name="college" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Tags (comma separated)</span>
                <input name="tags" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Visibility</span>
                <select name="visibility" className={input}>
                  <option value="public">Public</option>
                  <option value="community">Community only</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <Button type="submit">Post</Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
