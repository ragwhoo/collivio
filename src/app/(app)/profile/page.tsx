import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { updateProfileAction } from "@/app/actions";
import { Card, PageHeader, StatusBadge } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";
const textarea =
  "bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="My profile"
        description="This is how collaborators and recruiters discover you across Collivio."
        action={
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href={`/students/${profile.id}`} />}>
              View public profile
            </Button>
          </div>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium capitalize">{profile.role} account</p>
          <p className="text-muted-foreground text-xs">{profile.email}</p>
        </div>
        <StatusBadge status={profile.onboarded ? "approved" : "pending"} />
      </Card>

      <Card>
        <form action={updateProfileAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Display name</span>
            <input name="displayName" required defaultValue={profile.displayName} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Bio</span>
            <textarea name="bio" rows={4} defaultValue={profile.bio ?? ""} className={textarea} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">College</span>
              <input name="college" defaultValue={profile.college ?? ""} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Degree</span>
              <input name="degree" defaultValue={profile.degree ?? ""} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Branch / major</span>
              <input name="branch" defaultValue={profile.branch ?? ""} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Graduation year</span>
              <input
                name="graduationYear"
                type="number"
                min={1950}
                max={2100}
                defaultValue={profile.graduationYear ?? ""}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Skills (comma separated)</span>
              <input
                name="skills"
                defaultValue={(profile.skills ?? []).join(", ")}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Interests (comma separated)</span>
              <input
                name="interests"
                defaultValue={(profile.interests ?? []).join(", ")}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">GitHub URL</span>
              <input name="githubUrl" type="url" defaultValue={profile.githubUrl ?? ""} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">LinkedIn URL</span>
              <input name="linkedinUrl" type="url" defaultValue={profile.linkedinUrl ?? ""} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Portfolio URL</span>
              <input name="portfolioUrl" type="url" defaultValue={profile.portfolioUrl ?? ""} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Profile visibility</span>
              <select name="visibility" defaultValue={profile.visibility} className={input}>
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
              </select>
            </label>
          </div>

          <Button type="submit" className="self-start">
            Save profile
          </Button>
        </form>
      </Card>

      <p className="text-muted-foreground mt-4 text-xs">
        Your email address, applications and documents are never shown on your public profile.
      </p>
    </div>
  );
}
