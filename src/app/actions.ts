"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import auth from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applicationNotes,
  applicationStatusHistory,
  applications,
  auditLogs,
  blocks,
  bookmarks,
  businessVerifications,
  collaborationRequests,
  comments,
  communities,
  communityMembers,
  conversationParticipants,
  conversations,
  discussionReplies,
  discussions,
  eventRegistrations,
  events,
  follows,
  mediaLikes,
  mediaPosts,
  messages,
  moderationActions,
  notifications,
  opportunities,
  organizations,
  profiles,
  projectContributors,
  projectLikes,
  projects,
  reports,
  resources,
} from "@/lib/db/schema";
import {
  canManageOrganization,
  canPublishOpportunity,
  canViewApplication,
  isValidApplicationTransition,
  slugify,
} from "@/lib/authz";
import { getSessionUser, requireProfile } from "@/lib/auth/session";
import {
  deleteStorageObject,
  isStorageRef,
  storageKeyFromRef,
} from "@/lib/storage";
import {
  applicationSchema,
  communitySchema,
  csv,
  discussionSchema,
  eventSchema,
  mediaPostSchema,
  opportunitySchema,
  organizationSchema,
  profileSchema,
  projectSchema,
  reportSchema,
  resourceSchema,
  signInSchema,
  signUpSchema,
  str,
} from "@/lib/validation";

export type AuthState = { error?: string } | undefined;

function uniqueSlug(title: string) {
  return `${slugify(title) || "item"}-${Math.random().toString(36).slice(2, 8)}`;
}

async function notify(
  userId: string,
  type: string,
  title: string,
  body?: string,
  href?: string,
) {
  await db.insert(notifications).values({ userId, type, title, body, href });
}

async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
    metadata: metadata ?? {},
  });
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    accountType: formData.get("accountType") ?? "student",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, accountType } = parsed.data;

  try {
    const result = await auth.signUp.email({ name, email, password });
    if (result?.error) {
      return { error: result.error.message ?? "Could not create account" };
    }

    const session = await auth.getSession();
    const user = session?.data?.user;
    if (user?.id) {
      await db
        .insert(profiles)
        .values({
          authUserId: user.id,
          email,
          displayName: name,
          role: accountType,
        })
        .onConflictDoNothing({ target: profiles.authUserId });
    }
  } catch {
    return { error: "Could not create account. Please try again." };
  }

  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  const result = await auth.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });
  const url = (result as { data?: { url?: string } })?.data?.url;
  if (url) redirect(url);
  redirect("/auth/sign-in");
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await auth.signIn.email(parsed.data);
    if (result?.error) {
      return { error: result.error.message ?? "Invalid email or password" };
    }
  } catch {
    return { error: "Could not sign in. Please try again." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  await auth.signOut();
  redirect("/");
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function updateProfileAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: str(formData.get("bio")),
    college: str(formData.get("college")),
    degree: str(formData.get("degree")),
    branch: str(formData.get("branch")),
    graduationYear: str(formData.get("graduationYear")),
    skills: str(formData.get("skills")),
    interests: str(formData.get("interests")),
    githubUrl: str(formData.get("githubUrl")) ?? "",
    linkedinUrl: str(formData.get("linkedinUrl")) ?? "",
    portfolioUrl: str(formData.get("portfolioUrl")) ?? "",
    visibility: formData.get("visibility") ?? "public",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid profile");
  }

  const data = parsed.data;
  await db
    .update(profiles)
    .set({
      displayName: data.displayName,
      bio: data.bio ?? null,
      college: data.college ?? null,
      degree: data.degree ?? null,
      branch: data.branch ?? null,
      graduationYear: data.graduationYear ?? null,
      skills: csv(data.skills),
      interests: csv(data.interests),
      githubUrl: data.githubUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      visibility: data.visibility,
      onboarded: true,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function followStudentAction(targetId: string) {
  const profile = await requireProfile();
  if (profile.id === targetId) return;

  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, profile.id), eq(follows.followingId, targetId)))
    .limit(1);

  if (existing[0]) {
    await db.delete(follows).where(eq(follows.id, existing[0].id));
  } else {
    await db.insert(follows).values({
      followerId: profile.id,
      followingId: targetId,
    });
    await notify(targetId, "follow", `${profile.displayName} followed you`, undefined, `/students/${targetId}`);
  }

  revalidatePath(`/students/${targetId}`);
}

/* ------------------------------------------------------------------ */
/* Organizations / business portal                                     */
/* ------------------------------------------------------------------ */

export async function createOrganizationAction(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "business" && profile.role !== "admin") {
    throw new Error("Only business accounts can create organizations");
  }

  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    website: str(formData.get("website")) ?? "",
    logoUrl: str(formData.get("logoUrl")) ?? "",
    description: str(formData.get("description")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid organization");
  }

  const [org] = await db
    .insert(organizations)
    .values({
      ownerId: profile.id,
      name: parsed.data.name,
      slug: uniqueSlug(parsed.data.name),
      website: parsed.data.website || null,
      logoUrl: parsed.data.logoUrl || null,
      description: parsed.data.description ?? null,
    })
    .returning();

  await db.insert(businessVerifications).values({
    organizationId: org.id,
    notes: str(formData.get("verificationNotes")),
  });

  revalidatePath("/business");
}

export async function submitVerificationAction(organizationId: string, notes: string) {
  const profile = await requireProfile();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!org || !canManageOrganization(profile, org)) {
    throw new Error("Not authorized");
  }

  await db.insert(businessVerifications).values({
    organizationId,
    notes,
    status: "pending",
  });

  await db
    .update(organizations)
    .set({ verificationStatus: "pending", updatedAt: new Date() })
    .where(eq(organizations.id, organizationId));

  revalidatePath("/business");
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                       */
/* ------------------------------------------------------------------ */

export async function createOpportunityAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = opportunitySchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type") ?? "internship",
    description: formData.get("description"),
    responsibilities: str(formData.get("responsibilities")),
    eligibility: str(formData.get("eligibility")),
    skills: str(formData.get("skills")),
    preferredSkills: str(formData.get("preferredSkills")),
    location: str(formData.get("location")),
    remote: formData.get("remote") ?? "onsite",
    compensation: str(formData.get("compensation")),
    duration: str(formData.get("duration")),
    deadline: str(formData.get("deadline")),
    requiredDocuments: str(formData.get("requiredDocuments")),
    publish: formData.get("publish") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid opportunity");
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.ownerId, profile.id))
    .limit(1);

  if (!org) {
    throw new Error("Create your organization before posting opportunities");
  }

  const publish = parsed.data.publish === true;
  if (publish && !canPublishOpportunity(profile, org)) {
    throw new Error(
      "Only verified and approved business partners can publish opportunities",
    );
  }

  const [opportunity] = await db
    .insert(opportunities)
    .values({
      organizationId: org.id,
      createdBy: profile.id,
      title: parsed.data.title,
      slug: uniqueSlug(parsed.data.title),
      type: parsed.data.type,
      description: parsed.data.description,
      responsibilities: parsed.data.responsibilities ?? null,
      eligibility: parsed.data.eligibility ?? null,
      skills: csv(parsed.data.skills),
      preferredSkills: csv(parsed.data.preferredSkills),
      location: parsed.data.location ?? null,
      remote: parsed.data.remote,
      compensation: parsed.data.compensation ?? null,
      duration: parsed.data.duration ?? null,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      requiredDocuments: csv(parsed.data.requiredDocuments),
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date() : null,
    })
    .returning();

  await audit(profile.id, "opportunity.create", "opportunity", opportunity.id, {
    published: publish,
  });

  revalidatePath("/opportunities");
  revalidatePath("/business");
}

export async function updateOpportunityStatusAction(
  opportunityId: string,
  status: "draft" | "published" | "closed",
) {
  const profile = await requireProfile();
  const [row] = await db
    .select({ opportunity: opportunities, org: organizations })
    .from(opportunities)
    .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  if (!row || !canManageOrganization(profile, row.org)) {
    throw new Error("Not authorized");
  }

  if (status === "published" && !canPublishOpportunity(profile, row.org)) {
    throw new Error("Only verified organizations can publish opportunities");
  }

  await db
    .update(opportunities)
    .set({
      status,
      publishedAt: status === "published" ? new Date() : row.opportunity.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(opportunities.id, opportunityId));

  await audit(profile.id, `opportunity.${status}`, "opportunity", opportunityId);
  revalidatePath("/business");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/opportunities");
}

export async function applyToOpportunityAction(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "student" && profile.role !== "admin") {
    throw new Error("Only students can apply to opportunities");
  }

  const parsed = applicationSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    coverLetter: str(formData.get("coverLetter")),
    resumeUrl: str(formData.get("resumeUrl")) ?? "",
    portfolioUrl: str(formData.get("portfolioUrl")) ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid application");
  }

  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, parsed.data.opportunityId))
    .limit(1);

  if (!opportunity || opportunity.status !== "published") {
    throw new Error("This opportunity is not open for applications");
  }
  if (opportunity.deadline && opportunity.deadline.getTime() < Date.now()) {
    throw new Error("The application deadline has passed");
  }

  const [application] = await db
    .insert(applications)
    .values({
      opportunityId: parsed.data.opportunityId,
      studentId: profile.id,
      coverLetter: parsed.data.coverLetter ?? null,
      resumeUrl: parsed.data.resumeUrl || null,
      portfolioUrl: parsed.data.portfolioUrl || null,
    })
    .onConflictDoNothing({
      target: [applications.opportunityId, applications.studentId],
    })
    .returning();

  if (!application) {
    throw new Error("You have already applied to this opportunity");
  }

  await db.insert(applicationStatusHistory).values({
    applicationId: application.id,
    status: "submitted",
    changedBy: profile.id,
  });

  await notify(
    profile.id,
    "application",
    "Application submitted",
    `Your application for ${opportunity.title} was submitted.`,
    "/applications",
  );

  revalidatePath("/applications");
  revalidatePath(`/opportunities/${opportunity.id}`);
}

export async function withdrawApplicationAction(applicationId: string) {
  const profile = await requireProfile();
  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!application || application.studentId !== profile.id) {
    throw new Error("Not authorized");
  }
  if (!isValidApplicationTransition(application.status, "withdrawn")) {
    throw new Error("This application can no longer be withdrawn");
  }

  await db
    .update(applications)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  await db.insert(applicationStatusHistory).values({
    applicationId,
    status: "withdrawn",
    changedBy: profile.id,
  });

  revalidatePath("/applications");
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status:
    | "under_review"
    | "shortlisted"
    | "interview"
    | "accepted"
    | "rejected",
) {
  const profile = await requireProfile();
  const [row] = await db
    .select({
      application: applications,
      organization: organizations,
      opportunity: opportunities,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row) throw new Error("Application not found");
  if (!canViewApplication(profile, row.application, row.organization)) {
    throw new Error("Not authorized");
  }
  if (!canManageOrganization(profile, row.organization)) {
    throw new Error("Not authorized");
  }
  if (!isValidApplicationTransition(row.application.status, status)) {
    throw new Error(
      `Cannot move an application from ${row.application.status} to ${status}`,
    );
  }

  await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  await db.insert(applicationStatusHistory).values({
    applicationId,
    status,
    changedBy: profile.id,
  });

  await notify(
    row.application.studentId,
    "application",
    `Application ${status.replace("_", " ")}`,
    `Your application for ${row.opportunity.title} was updated.`,
    "/applications",
  );

  await audit(profile.id, "application.status", "application", applicationId, {
    status,
  });

  revalidatePath("/business");
  revalidatePath("/applications");
}

export async function addApplicationNoteAction(
  applicationId: string,
  note: string,
) {
  const profile = await requireProfile();
  if (!note.trim()) return;

  const [row] = await db
    .select({
      application: applications,
      organization: organizations,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row || !canManageOrganization(profile, row.organization)) {
    throw new Error("Not authorized");
  }

  await db.insert(applicationNotes).values({
    applicationId,
    organizationId: row.organization.id,
    authorId: profile.id,
    note: note.trim(),
  });

  revalidatePath("/business");
}

/* ------------------------------------------------------------------ */
/* Research hub                                                        */
/* ------------------------------------------------------------------ */

export async function createProjectAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    abstract: str(formData.get("abstract")),
    objectives: str(formData.get("objectives")),
    category: formData.get("category") ?? "software",
    techStack: str(formData.get("techStack")),
    skillsRequired: str(formData.get("skillsRequired")),
    coverImageUrl: str(formData.get("coverImageUrl")) ?? "",
    githubUrl: str(formData.get("githubUrl")) ?? "",
    demoUrl: str(formData.get("demoUrl")) ?? "",
    paperUrl: str(formData.get("paperUrl")) ?? "",
    visibility: formData.get("visibility") ?? "public",
    collaborationOpen: formData.get("collaborationOpen") === "on",
    publish: formData.get("publish") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid project");
  }

  const publish = parsed.data.publish === true;
  const [project] = await db
    .insert(projects)
    .values({
      ownerId: profile.id,
      title: parsed.data.title,
      slug: uniqueSlug(parsed.data.title),
      description: parsed.data.description,
      abstract: parsed.data.abstract ?? null,
      objectives: parsed.data.objectives ?? null,
      category: parsed.data.category,
      techStack: csv(parsed.data.techStack),
      skillsRequired: csv(parsed.data.skillsRequired),
      coverImageUrl: parsed.data.coverImageUrl || null,
      githubUrl: parsed.data.githubUrl || null,
      demoUrl: parsed.data.demoUrl || null,
      paperUrl: parsed.data.paperUrl || null,
      visibility: parsed.data.visibility,
      collaborationOpen: parsed.data.collaborationOpen === true,
      status: publish ? "published" : "draft",
    })
    .returning();

  await db.insert(projectContributors).values({
    projectId: project.id,
    userId: profile.id,
    role: "owner",
    canEdit: true,
  });

  revalidatePath("/research");
  revalidatePath("/dashboard");
}

export async function updateProjectStatusAction(
  projectId: string,
  status: "draft" | "published" | "archived",
) {
  const profile = await requireProfile();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) throw new Error("Project not found");

  const [contributor] = await db
    .select()
    .from(projectContributors)
    .where(
      and(
        eq(projectContributors.projectId, projectId),
        eq(projectContributors.userId, profile.id),
      ),
    )
    .limit(1);

  const { canEditProject } = await import("@/lib/authz");
  if (!canEditProject(profile, project, contributor)) {
    throw new Error("Not authorized");
  }

  await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath("/research");
  revalidatePath(`/research/${projectId}`);
}

export async function requestCollaborationAction(formData: FormData) {
  const profile = await requireProfile();
  const projectId = String(formData.get("projectId") ?? "");
  const message = str(formData.get("message")) ?? null;
  if (!projectId) throw new Error("Missing project");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project || !project.collaborationOpen) {
    throw new Error("This project is not accepting collaborators");
  }
  if (project.ownerId === profile.id) {
    throw new Error("You already own this project");
  }

  const [request] = await db
    .insert(collaborationRequests)
    .values({ projectId, requesterId: profile.id, message })
    .onConflictDoNothing({
      target: [collaborationRequests.projectId, collaborationRequests.requesterId],
    })
    .returning();

  if (!request) throw new Error("You already requested to join");

  await notify(
    project.ownerId,
    "collaboration",
    "New collaboration request",
    `${profile.displayName} wants to join ${project.title}.`,
    `/research/${projectId}`,
  );

  revalidatePath(`/research/${projectId}`);
}

export async function respondToCollaborationAction(
  requestId: string,
  accept: boolean,
) {
  const profile = await requireProfile();
  const [row] = await db
    .select({ request: collaborationRequests, project: projects })
    .from(collaborationRequests)
    .innerJoin(projects, eq(collaborationRequests.projectId, projects.id))
    .where(eq(collaborationRequests.id, requestId))
    .limit(1);

  if (!row) throw new Error("Request not found");
  if (row.project.ownerId !== profile.id && profile.role !== "admin") {
    throw new Error("Not authorized");
  }
  if (row.request.status !== "pending") {
    throw new Error("This request was already handled");
  }

  await db
    .update(collaborationRequests)
    .set({
      status: accept ? "accepted" : "rejected",
      respondedAt: new Date(),
    })
    .where(eq(collaborationRequests.id, requestId));

  if (accept) {
    await db
      .insert(projectContributors)
      .values({
        projectId: row.project.id,
        userId: row.request.requesterId,
        role: "contributor",
        canEdit: false,
      })
      .onConflictDoNothing();
  }

  await notify(
    row.request.requesterId,
    "collaboration",
    accept ? "Collaboration request accepted" : "Collaboration request declined",
    `${profile.displayName} ${accept ? "accepted" : "declined"} your request for ${row.project.title}.`,
    `/research/${row.project.id}`,
  );

  revalidatePath(`/research/${row.project.id}`);
}

export async function likeProjectAction(projectId: string) {
  const profile = await requireProfile();
  const [existing] = await db
    .select({ id: projectLikes.id })
    .from(projectLikes)
    .where(
      and(
        eq(projectLikes.projectId, projectId),
        eq(projectLikes.userId, profile.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(projectLikes).where(eq(projectLikes.id, existing.id));
  } else {
    await db
      .insert(projectLikes)
      .values({ projectId, userId: profile.id })
      .onConflictDoNothing();
  }

  revalidatePath(`/research/${projectId}`);
}

export async function commentOnProjectAction(formData: FormData) {
  const profile = await requireProfile();
  const projectId = String(formData.get("projectId") ?? "");
  const body = str(formData.get("body"));
  if (!projectId || !body) throw new Error("Comment cannot be empty");

  await db.insert(comments).values({
    authorId: profile.id,
    projectId,
    body,
  });

  revalidatePath(`/research/${projectId}`);
}

/* ------------------------------------------------------------------ */
/* Media lab                                                           */
/* ------------------------------------------------------------------ */

export async function createMediaPostAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = mediaPostSchema.safeParse({
    imageUrl: formData.get("imageUrl"),
    caption: str(formData.get("caption")),
    description: str(formData.get("description")),
    album: str(formData.get("album")),
    college: str(formData.get("college")),
    eventTag: str(formData.get("eventTag")),
    tags: str(formData.get("tags")),
    visibility: formData.get("visibility") ?? "public",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid media post");
  }

  if (isStorageRef(parsed.data.imageUrl)) {
    const key = storageKeyFromRef(parsed.data.imageUrl);
    if (!key || !key.startsWith(`media/${profile.id}/`)) {
      throw new Error("Invalid media reference");
    }
  }

  await db.insert(mediaPosts).values({
    authorId: profile.id,
    imageUrl: parsed.data.imageUrl,
    caption: parsed.data.caption ?? null,
    description: parsed.data.description ?? null,
    album: parsed.data.album ?? null,
    college: parsed.data.college ?? null,
    eventTag: parsed.data.eventTag ?? null,
    tags: csv(parsed.data.tags),
    visibility: parsed.data.visibility,
  });

  revalidatePath("/media");
  revalidatePath("/dashboard");
}

export async function likeMediaAction(mediaPostId: string) {
  const profile = await requireProfile();
  const [existing] = await db
    .select({ id: mediaLikes.id })
    .from(mediaLikes)
    .where(
      and(
        eq(mediaLikes.mediaPostId, mediaPostId),
        eq(mediaLikes.userId, profile.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(mediaLikes).where(eq(mediaLikes.id, existing.id));
  } else {
    await db
      .insert(mediaLikes)
      .values({ mediaPostId, userId: profile.id })
      .onConflictDoNothing();
  }

  revalidatePath("/media");
}

export async function deleteMediaPostAction(mediaPostId: string) {
  const profile = await requireProfile();
  const [post] = await db
    .select()
    .from(mediaPosts)
    .where(eq(mediaPosts.id, mediaPostId))
    .limit(1);

  if (!post) return;
  if (post.authorId !== profile.id && profile.role !== "admin") {
    throw new Error("Not authorized");
  }

  // Remove the metadata row and best-effort cleanup of the stored object.
  await db
    .update(mediaPosts)
    .set({ deletedAt: new Date() })
    .where(eq(mediaPosts.id, mediaPostId));

  try {
    await deleteStorageObject(post.imageUrl);
  } catch {
    // Storage cleanup failures should not block removing the post from feeds.
  }

  revalidatePath("/media");
}

/* ------------------------------------------------------------------ */
/* Communities & discussions                                           */
/* ------------------------------------------------------------------ */

export async function createCommunityAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    guidelines: str(formData.get("guidelines")),
    college: str(formData.get("college")),
    category: formData.get("category") ?? "general",
    joinPolicy: formData.get("joinPolicy") ?? "open",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid community");
  }

  const [community] = await db
    .insert(communities)
    .values({
      name: parsed.data.name,
      slug: uniqueSlug(parsed.data.name),
      description: parsed.data.description,
      guidelines: parsed.data.guidelines ?? null,
      college: parsed.data.college ?? null,
      category: parsed.data.category,
      joinPolicy: parsed.data.joinPolicy,
      createdBy: profile.id,
    })
    .returning();

  await db.insert(communityMembers).values({
    communityId: community.id,
    userId: profile.id,
    role: "owner",
    status: "active",
  });

  revalidatePath("/communities");
}

export async function joinCommunityAction(communityId: string) {
  const profile = await requireProfile();
  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, communityId))
    .limit(1);
  if (!community) throw new Error("Community not found");
  if (community.joinPolicy === "invite") {
    throw new Error("This community is invite only");
  }

  await db
    .insert(communityMembers)
    .values({
      communityId,
      userId: profile.id,
      status: community.joinPolicy === "request" ? "pending" : "active",
    })
    .onConflictDoNothing();

  revalidatePath(`/communities/${community.slug}`);
  revalidatePath("/communities");
}

export async function createDiscussionAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = discussionSchema.safeParse({
    communityId: formData.get("communityId"),
    title: formData.get("title"),
    body: formData.get("body"),
    tags: str(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid discussion");
  }

  const [membership] = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, parsed.data.communityId),
        eq(communityMembers.userId, profile.id),
        eq(communityMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership && profile.role !== "admin") {
    throw new Error("Join this community before posting");
  }

  const [discussion] = await db
    .insert(discussions)
    .values({
      communityId: parsed.data.communityId,
      authorId: profile.id,
      title: parsed.data.title,
      slug: uniqueSlug(parsed.data.title),
      body: parsed.data.body,
      tags: csv(parsed.data.tags),
    })
    .returning();

  revalidatePath(`/communities`);
  revalidatePath(`/discussions/${discussion.id}`);
}

export async function replyToDiscussionAction(formData: FormData) {
  const profile = await requireProfile();
  const discussionId = String(formData.get("discussionId") ?? "");
  const body = str(formData.get("body"));
  const parentId = str(formData.get("parentId")) ?? null;
  if (!discussionId || !body) throw new Error("Reply cannot be empty");

  const [discussion] = await db
    .select()
    .from(discussions)
    .where(eq(discussions.id, discussionId))
    .limit(1);
  if (!discussion) throw new Error("Discussion not found");

  const [membership] = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, discussion.communityId),
        eq(communityMembers.userId, profile.id),
        eq(communityMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership && profile.role !== "admin") {
    throw new Error("Join this community before replying");
  }

  await db.insert(discussionReplies).values({
    discussionId,
    authorId: profile.id,
    parentId,
    body,
  });

  if (discussion.authorId !== profile.id) {
    await notify(
      discussion.authorId,
      "discussion",
      "New reply to your discussion",
      `${profile.displayName} replied to ${discussion.title}.`,
      `/discussions/${discussionId}`,
    );
  }

  revalidatePath(`/discussions/${discussionId}`);
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export async function createEventAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type") ?? "other",
    startsAt: formData.get("startsAt"),
    endsAt: str(formData.get("endsAt")),
    timezone: str(formData.get("timezone")) ?? "UTC",
    location: str(formData.get("location")),
    onlineUrl: str(formData.get("onlineUrl")) ?? "",
    registrationDeadline: str(formData.get("registrationDeadline")),
    capacity: str(formData.get("capacity")),
    eligibility: str(formData.get("eligibility")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid event");
  }

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid start date");

  await db.insert(events).values({
    organizerId: profile.id,
    title: parsed.data.title,
    slug: uniqueSlug(parsed.data.title),
    description: parsed.data.description,
    type: parsed.data.type,
    startsAt,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    timezone: parsed.data.timezone,
    location: parsed.data.location ?? null,
    onlineUrl: parsed.data.onlineUrl || null,
    registrationDeadline: parsed.data.registrationDeadline
      ? new Date(parsed.data.registrationDeadline)
      : null,
    capacity: parsed.data.capacity ?? null,
    eligibility: parsed.data.eligibility ?? null,
  });

  revalidatePath("/events");
}

export async function registerForEventAction(eventId: string) {
  const profile = await requireProfile();
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) throw new Error("Event not found");
  if (event.registrationDeadline && event.registrationDeadline.getTime() < Date.now()) {
    throw new Error("Registration has closed");
  }

  let status: "registered" | "waitlisted" = "registered";
  if (event.capacity) {
    const [row] = await db
      .select({ value: count() })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.status, "registered"),
        ),
      );
    if (Number(row?.value ?? 0) >= event.capacity) status = "waitlisted";
  }

  await db
    .insert(eventRegistrations)
    .values({ eventId, userId: profile.id, status })
    .onConflictDoNothing();

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}

export async function cancelEventRegistrationAction(eventId: string) {
  const profile = await requireProfile();
  await db
    .update(eventRegistrations)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, profile.id),
      ),
    );
  revalidatePath(`/events/${eventId}`);
}

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

export async function createResourceAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = resourceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    subject: str(formData.get("subject")),
    college: str(formData.get("college")),
    url: str(formData.get("url")) ?? "",
    fileUrl: str(formData.get("fileUrl")) ?? "",
    tags: str(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid resource");
  }

  await db.insert(resources).values({
    authorId: profile.id,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    subject: parsed.data.subject ?? null,
    college: parsed.data.college ?? null,
    url: parsed.data.url || null,
    fileUrl: parsed.data.fileUrl || null,
    tags: csv(parsed.data.tags),
  });

  revalidatePath("/resources");
}

/* ------------------------------------------------------------------ */
/* Bookmarks & notifications                                           */
/* ------------------------------------------------------------------ */

export async function toggleBookmarkAction(
  entityType: "project" | "post" | "opportunity" | "resource" | "event",
  entityId: string,
) {
  const profile = await requireProfile();
  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, profile.id),
        eq(bookmarks.entityType, entityType),
        eq(bookmarks.entityId, entityId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
  } else {
    await db
      .insert(bookmarks)
      .values({ userId: profile.id, entityType, entityId })
      .onConflictDoNothing();
  }

  revalidatePath("/bookmarks");
}

export async function markNotificationReadAction(notificationId: string) {
  const profile = await requireProfile();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, profile.id),
      ),
    );
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const profile = await requireProfile();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, profile.id), sql`${notifications.readAt} is null`),
    );
  revalidatePath("/notifications");
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

export async function startConversationAction(recipientId: string) {
  const profile = await requireProfile();
  if (recipientId === profile.id) throw new Error("Cannot message yourself");

  const blocked = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      and(
        eq(blocks.blockerId, recipientId),
        eq(blocks.blockedId, profile.id),
      ),
    )
    .limit(1);
  if (blocked[0]) throw new Error("You cannot message this student");

  const mine = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, profile.id));

  if (mine.length) {
    const [shared] = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, recipientId),
          inArray(
            conversationParticipants.conversationId,
            mine.map((row) => row.conversationId),
          ),
        ),
      )
      .limit(1);

    if (shared) redirect(`/messages/${shared.conversationId}`);
  }

  const [conversation] = await db.insert(conversations).values({}).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: conversation.id, userId: profile.id },
    { conversationId: conversation.id, userId: recipientId },
  ]);

  redirect(`/messages/${conversation.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const profile = await requireProfile();
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = str(formData.get("body"));
  if (!conversationId || !body) throw new Error("Message cannot be empty");

  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, profile.id),
      ),
    )
    .limit(1);

  if (!participant) throw new Error("Not authorized");

  await db.insert(messages).values({
    conversationId,
    senderId: profile.id,
    body,
  });

  revalidatePath(`/messages/${conversationId}`);
}

/* ------------------------------------------------------------------ */
/* Reports & moderation                                                */
/* ------------------------------------------------------------------ */

export async function createReportAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = reportSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    reason: formData.get("reason"),
    details: str(formData.get("details")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid report");
  }

  await db.insert(reports).values({
    reporterId: profile.id,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });
}

export async function resolveReportAction(
  reportId: string,
  decision: "resolved" | "dismissed",
  note: string,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Not authorized");

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);
  if (!report) throw new Error("Report not found");

  await db
    .update(reports)
    .set({ status: decision, resolvedBy: profile.id, resolutionNote: note })
    .where(eq(reports.id, reportId));

  await db.insert(moderationActions).values({
    moderatorId: profile.id,
    action: `report.${decision}`,
    entityType: report.entityType,
    entityId: report.entityId,
    reason: note,
  });

  await audit(profile.id, `report.${decision}`, "report", reportId);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
}

export async function verifyBusinessAction(
  organizationId: string,
  decision: "approved" | "rejected",
  note: string,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Not authorized");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  if (!org) throw new Error("Organization not found");

  await db
    .update(organizations)
    .set({
      verified: decision === "approved",
      verificationStatus: decision,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  await db
    .update(businessVerifications)
    .set({
      status: decision,
      reviewedBy: profile.id,
      reviewNote: note,
      reviewedAt: new Date(),
    })
    .where(eq(businessVerifications.organizationId, organizationId));

  await notify(
    org.ownerId,
    "verification",
    `Business verification ${decision}`,
    note || undefined,
    "/business",
  );

  await audit(profile.id, `organization.${decision}`, "organization", organizationId);
  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath("/business");
}

export async function suspendUserAction(userId: string, suspend: boolean) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Not authorized");
  if (userId === profile.id) throw new Error("You cannot suspend yourself");

  await db
    .update(profiles)
    .set({ suspended: suspend, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  await audit(profile.id, suspend ? "user.suspend" : "user.restore", "user", userId);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export async function deleteAccountAction() {
  const profile = await requireProfile();
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  await db.delete(profiles).where(eq(profiles.id, profile.id));
  try {
    await auth.signOut();
  } catch {
    // ignore
  }
  redirect("/");
}

/* ------------------------------------------------------------------ */
/* FormData adapters for actions used in plain <form> elements         */
/* ------------------------------------------------------------------ */

export async function submitVerificationFormAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const notes = str(formData.get("notes"));
  if (!organizationId) throw new Error("Missing organization");
  await submitVerificationAction(organizationId, notes ?? "");
}

export async function addApplicationNoteFormAction(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const note = str(formData.get("note"));
  if (!applicationId || !note) return;
  await addApplicationNoteAction(applicationId, note);
}

export async function verifyBusinessFormAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const decision = formData.get("decision") === "approved" ? "approved" : "rejected";
  const note = str(formData.get("note")) ?? "";
  if (!organizationId) throw new Error("Missing organization");
  await verifyBusinessAction(organizationId, decision, note);
}

export async function resolveReportFormAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const decision = formData.get("decision") === "dismissed" ? "dismissed" : "resolved";
  const note = str(formData.get("note")) ?? "";
  if (!reportId) throw new Error("Missing report");
  await resolveReportAction(reportId, decision, note);
}

