import { requireProfile } from "@/lib/auth/session";
import { createEventAction } from "@/app/actions";
import { Card, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const input =
  "bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";
const textarea =
  "bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30";

export default async function NewEventPage() {
  await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Create an event" description="Host a workshop, tech talk, fest or hackathon." />
      <Card>
        <form action={createEventAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Title</span>
            <input name="title" required className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea name="description" required rows={5} className={textarea} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Type</span>
              <select name="type" className={input}>
                {["workshop", "talk", "fest", "hackathon", "other"].map((type) => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Timezone</span>
              <input name="timezone" defaultValue="UTC" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Starts at</span>
              <input name="startsAt" type="datetime-local" required className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Ends at</span>
              <input name="endsAt" type="datetime-local" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Location</span>
              <input name="location" className={input} placeholder="Campus auditorium" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Online meeting URL</span>
              <input name="onlineUrl" type="url" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Registration deadline</span>
              <input name="registrationDeadline" type="datetime-local" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Capacity</span>
              <input name="capacity" type="number" min={1} className={input} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Eligibility</span>
            <textarea name="eligibility" rows={3} className={textarea} />
          </label>
          <Button type="submit" className="self-start">
            Create event
          </Button>
        </form>
      </Card>
    </div>
  );
}
