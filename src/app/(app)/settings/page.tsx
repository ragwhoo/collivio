import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { deleteAccountAction, signOutAction } from "@/app/actions";
import { Card, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your account and privacy."
      />

      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="font-semibold">Account</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-right">{profile.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Account type</dt>
              <dd className="text-right capitalize">{profile.role}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Profile visibility</dt>
              <dd className="text-right capitalize">{profile.visibility}</dd>
            </div>
          </dl>
          <Button className="mt-4" variant="outline" render={<Link href="/profile" />}>
            Edit profile
          </Button>
        </Card>

        <Card>
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            In-app notifications are delivered for applications, collaborations, community
            replies and verification updates. Email delivery and granular preferences are not
            enabled in this deployment.
          </p>
          <Button className="mt-3" variant="outline" render={<Link href="/notifications" />}>
            View notifications
          </Button>
        </Card>

        <Card>
          <h2 className="font-semibold">Session</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign out of Collivio on this device.
          </p>
          <form action={signOutAction} className="mt-3">
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </Card>

        <Card className="border-destructive/30">
          <h2 className="text-destructive font-semibold">Delete account</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            This permanently deletes your Collivio profile and related content. This action
            cannot be undone.
          </p>
          <form action={deleteAccountAction} className="mt-3">
            <Button type="submit" variant="destructive">
              Delete my account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
