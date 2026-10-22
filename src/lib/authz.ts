import type {
  Application,
  Organization,
  Profile,
  Project,
} from "@/lib/db/schema";

/**
 * Pure authorization rules. These are intentionally free of database and
 * framework imports so they can be unit tested directly.
 */

export const APPLICATION_TRANSITIONS: Record<
  Application["status"],
  Application["status"][]
> = {
  submitted: ["under_review", "withdrawn", "rejected"],
  under_review: ["shortlisted", "rejected", "withdrawn"],
  shortlisted: ["interview", "accepted", "rejected", "withdrawn"],
  interview: ["accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export function isValidApplicationTransition(
  from: Application["status"],
  to: Application["status"],
): boolean {
  return APPLICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isAdmin(profile: Pick<Profile, "role">): boolean {
  return profile.role === "admin";
}

export function canManageOrganization(
  profile: Pick<Profile, "id" | "role">,
  org: Pick<Organization, "ownerId">,
): boolean {
  return isAdmin(profile) || org.ownerId === profile.id;
}

/**
 * The critical business rule: only an organization owner whose organization
 * has been approved may publish opportunities.
 */
export function canPublishOpportunity(
  profile: Pick<Profile, "id" | "role">,
  org:
    | Pick<Organization, "ownerId" | "verified" | "verificationStatus">
    | null
    | undefined,
): boolean {
  if (!org) return false;
  if (isAdmin(profile)) return true;
  return (
    org.ownerId === profile.id &&
    org.verified === true &&
    org.verificationStatus === "approved"
  );
}

export function canViewApplication(
  viewer: Pick<Profile, "id" | "role">,
  application: Pick<Application, "studentId">,
  org: Pick<Organization, "ownerId"> | null | undefined,
): boolean {
  if (application.studentId === viewer.id) return true;
  if (!org) return false;
  return canManageOrganization(viewer, org);
}

export function canEditProject(
  viewer: Pick<Profile, "id" | "role">,
  project: Pick<Project, "ownerId">,
  contributor?: { canEdit: boolean } | null,
): boolean {
  if (isAdmin(viewer)) return true;
  if (project.ownerId === viewer.id) return true;
  return contributor?.canEdit === true;
}

export function canViewProject(
  viewer: Pick<Profile, "id" | "role"> | null,
  project: Pick<Project, "ownerId" | "visibility" | "status">,
  contributor?: { userId: string; canEdit: boolean } | null,
): boolean {
  if (project.status === "published" && project.visibility === "public") {
    return true;
  }
  if (!viewer) return false;
  if (isAdmin(viewer)) return true;
  if (project.ownerId === viewer.id) return true;
  return Boolean(contributor);
}

export function canModerateCommunity(
  viewer: Pick<Profile, "id" | "role">,
  membership:
    | { userId: string; role: "member" | "moderator" | "owner"; status: string }
    | null
    | undefined,
): boolean {
  if (isAdmin(viewer)) return true;
  if (!membership || membership.userId !== viewer.id) return false;
  if (membership.status !== "active") return false;
  return membership.role === "owner" || membership.role === "moderator";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
