export default function RootLoading() {
  return (
    <div
      className="flex min-h-svh items-center justify-center px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="border-primary/20 border-t-primary size-7 animate-spin rounded-full border-2" />
        <span className="text-muted-foreground text-sm">Loading Collivio…</span>
      </div>
    </div>
  );
}
