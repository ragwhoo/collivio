import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function AccountSuspendedPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Account suspended</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Your Collivio account has been suspended by an administrator. If you believe this is a
        mistake, contact the Collivio team with your account email.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <form action={signOutAction}>
          <Button type="submit" className="w-full">
            Sign out
          </Button>
        </form>
        <Button variant="outline" render={<Link href="/" />}>
          Return to home
        </Button>
      </div>
    </div>
  );
}
