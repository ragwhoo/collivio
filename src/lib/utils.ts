export { cn } from "cn";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guards route params before they reach a Postgres uuid column. */
export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}
