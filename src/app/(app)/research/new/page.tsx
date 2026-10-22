import { requireProfile } from "@/lib/auth/session";
import { createProjectAction } from "@/app/actions";
import { Card, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";
const textarea =
  "bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function NewProjectPage() {
  await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Publish a project"
        description="Share research, engineering work, prototypes or an idea looking for collaborators."
      />
      <Card>
        <form action={createProjectAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Title</span>
            <input name="title" required minLength={3} maxLength={160} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={8000}
              rows={5}
              className={textarea}
            />
            <span className="text-muted-foreground text-xs">
              At least 20 characters.
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Abstract</span>
            <textarea name="abstract" rows={4} className={textarea} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Objectives</span>
            <textarea name="objectives" rows={3} className={textarea} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Category</span>
              <input
                name="category"
                defaultValue="software"
                required
                minLength={2}
                maxLength={60}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Visibility</span>
              <select name="visibility" className={input}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Tech stack (comma separated)</span>
              <input name="techStack" className={input} placeholder="Next.js, Postgres" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Skills required</span>
              <input name="skillsRequired" className={input} placeholder="UI design, ML" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Cover image URL</span>
              <input name="coverImageUrl" type="url" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">GitHub URL</span>
              <input name="githubUrl" type="url" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Live demo URL</span>
              <input name="demoUrl" type="url" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Paper URL</span>
              <input name="paperUrl" type="url" className={input} />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="collaborationOpen" className="size-4" />
            <span>Open to collaboration requests</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publish" className="size-4" defaultChecked />
            <span>Publish immediately</span>
          </label>

          <Button type="submit" className="self-start">
            Save project
          </Button>
        </form>
      </Card>
    </div>
  );
}
