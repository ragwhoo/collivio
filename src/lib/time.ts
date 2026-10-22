/** Time helpers kept outside components so render stays free of direct clock calls. */
export function isPast(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const value = typeof date === "string" ? new Date(date) : date;
  return value.getTime() < Date.now();
}

export function now(): Date {
  return new Date();
}
