import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {href ? (
        <Link href={href} className="text-primary text-sm hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card text-card-foreground rounded-2xl border p-4 sm:p-5", className)}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center">
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 text-xs">
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-semibold">{value}</span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </Card>
  );
}

const statusStyles: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  draft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  closed: "bg-neutral-500/10 text-neutral-500",
  submitted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  under_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  shortlisted: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  interview: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  withdrawn: "bg-neutral-500/10 text-neutral-500",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "bg-neutral-500/10 text-neutral-500",
  open: "bg-red-500/10 text-red-600 dark:text-red-400",
  suspended: "bg-red-500/10 text-red-600 dark:text-red-400",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  dismissed: "bg-neutral-500/10 text-neutral-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
