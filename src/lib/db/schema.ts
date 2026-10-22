import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["student", "business", "admin"]);
export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
]);
export const opportunityType = pgEnum("opportunity_type", [
  "internship",
  "job",
  "research",
  "scholarship",
  "hackathon",
  "other",
]);
export const opportunityStatus = pgEnum("opportunity_status", [
  "draft",
  "published",
  "closed",
]);
export const remoteMode = pgEnum("remote_mode", ["onsite", "remote", "hybrid"]);
export const applicationStatus = pgEnum("application_status", [
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
]);
export const projectStatus = pgEnum("project_status", [
  "draft",
  "published",
  "archived",
]);
export const projectVisibility = pgEnum("project_visibility", [
  "public",
  "unlisted",
  "private",
]);
export const collaborationStatus = pgEnum("collaboration_status", [
  "pending",
  "accepted",
  "rejected",
]);
export const mediaVisibility = pgEnum("media_visibility", [
  "public",
  "community",
  "private",
]);
export const joinPolicy = pgEnum("join_policy", ["open", "request", "invite"]);
export const memberStatus = pgEnum("member_status", ["active", "pending"]);
export const memberRole = pgEnum("member_role", ["member", "moderator", "owner"]);
export const eventType = pgEnum("event_type", [
  "workshop",
  "talk",
  "fest",
  "hackathon",
  "other",
]);
export const registrationStatus = pgEnum("registration_status", [
  "registered",
  "waitlisted",
  "cancelled",
]);
export const reportStatus = pgEnum("report_status", [
  "open",
  "resolved",
  "dismissed",
]);
export const profileVisibility = pgEnum("profile_visibility", [
  "public",
  "restricted",
]);
export const entityType = pgEnum("entity_type", [
  "project",
  "post",
  "opportunity",
  "resource",
  "event",
  "comment",
  "user",
]);

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: text("auth_user_id").notNull(),
    email: text("email").notNull(),
    role: userRole("role").notNull().default("student"),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    college: text("college"),
    degree: text("degree"),
    branch: text("branch"),
    graduationYear: integer("graduation_year"),
    skills: text("skills").array().notNull().default([]),
    interests: text("interests").array().notNull().default([]),
    githubUrl: text("github_url"),
    linkedinUrl: text("linkedin_url"),
    portfolioUrl: text("portfolio_url"),
    visibility: profileVisibility("visibility").notNull().default("public"),
    onboarded: boolean("onboarded").notNull().default(false),
    suspended: boolean("suspended").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("profiles_auth_user_idx").on(t.authUserId),
    index("profiles_role_idx").on(t.role),
  ],
);

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("follows_pair_idx").on(t.followerId, t.followingId)],
);

/* ------------------------------------------------------------------ */
/* Organizations & verification                                        */
/* ------------------------------------------------------------------ */

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    website: text("website"),
    logoUrl: text("logo_url"),
    description: text("description"),
    verified: boolean("verified").notNull().default(false),
    verificationStatus: verificationStatus("verification_status")
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("organizations_slug_idx").on(t.slug),
    index("organizations_owner_idx").on(t.ownerId),
  ],
);

export const businessVerifications = pgTable("business_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  documents: text("documents").array().notNull().default([]),
  notes: text("notes"),
  status: verificationStatus("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Opportunities & applications                                        */
/* ------------------------------------------------------------------ */

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    type: opportunityType("type").notNull().default("internship"),
    description: text("description").notNull(),
    responsibilities: text("responsibilities"),
    eligibility: text("eligibility"),
    skills: text("skills").array().notNull().default([]),
    preferredSkills: text("preferred_skills").array().notNull().default([]),
    location: text("location"),
    remote: remoteMode("remote").notNull().default("onsite"),
    compensation: text("compensation"),
    duration: text("duration"),
    deadline: timestamp("deadline", { withTimezone: true }),
    requiredDocuments: text("required_documents").array().notNull().default([]),
    status: opportunityStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("opportunities_slug_idx").on(t.slug),
    index("opportunities_org_idx").on(t.organizationId),
    index("opportunities_status_idx").on(t.status),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: applicationStatus("status").notNull().default("submitted"),
    coverLetter: text("cover_letter"),
    resumeUrl: text("resume_url"),
    portfolioUrl: text("portfolio_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("applications_unique_idx").on(t.opportunityId, t.studentId),
    index("applications_student_idx").on(t.studentId),
  ],
);

export const applicationStatusHistory = pgTable("application_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  status: applicationStatus("status").notNull(),
  note: text("note"),
  changedBy: uuid("changed_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const applicationNotes = pgTable("application_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Research hub                                                        */
/* ------------------------------------------------------------------ */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    abstract: text("abstract"),
    objectives: text("objectives"),
    category: text("category").notNull().default("software"),
    techStack: text("tech_stack").array().notNull().default([]),
    skillsRequired: text("skills_required").array().notNull().default([]),
    coverImageUrl: text("cover_image_url"),
    gallery: text("gallery").array().notNull().default([]),
    githubUrl: text("github_url"),
    demoUrl: text("demo_url"),
    paperUrl: text("paper_url"),
    referenceLinks: text("reference_links").array().notNull().default([]),
    status: projectStatus("status").notNull().default("draft"),
    visibility: projectVisibility("visibility").notNull().default("public"),
    collaborationOpen: boolean("collaboration_open").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("projects_slug_idx").on(t.slug),
    index("projects_owner_idx").on(t.ownerId),
    index("projects_status_idx").on(t.status),
  ],
);

export const projectContributors = pgTable(
  "project_contributors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("contributor"),
    canEdit: boolean("can_edit").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("project_contributors_unique_idx").on(t.projectId, t.userId),
  ],
);

export const collaborationRequests = pgTable(
  "collaboration_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    message: text("message"),
    status: collaborationStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("collaboration_requests_unique_idx").on(
      t.projectId,
      t.requesterId,
    ),
  ],
);

export const projectLikes = pgTable(
  "project_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("project_likes_unique_idx").on(t.projectId, t.userId)],
);

/* ------------------------------------------------------------------ */
/* Comments (polymorphic by nullable FKs)                              */
/* ------------------------------------------------------------------ */

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    mediaPostId: uuid("media_post_id"),
    discussionId: uuid("discussion_id"),
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("comments_project_idx").on(t.projectId)],
);

/* ------------------------------------------------------------------ */
/* Media lab                                                           */
/* ------------------------------------------------------------------ */

export const mediaPosts = pgTable(
  "media_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    caption: text("caption"),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    album: text("album"),
    college: text("college"),
    eventTag: text("event_tag"),
    tags: text("tags").array().notNull().default([]),
    visibility: mediaVisibility("visibility").notNull().default("public"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("media_posts_author_idx").on(t.authorId),
    index("media_posts_created_idx").on(t.createdAt),
  ],
);

export const mediaLikes = pgTable(
  "media_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaPostId: uuid("media_post_id")
      .notNull()
      .references(() => mediaPosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("media_likes_unique_idx").on(t.mediaPostId, t.userId)],
);

/* ------------------------------------------------------------------ */
/* Communities & discussions                                           */
/* ------------------------------------------------------------------ */

export const communities = pgTable(
  "communities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    guidelines: text("guidelines"),
    college: text("college"),
    category: text("category").notNull().default("general"),
    joinPolicy: joinPolicy("join_policy").notNull().default("open"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("communities_slug_idx").on(t.slug)],
);

export const communityMembers = pgTable(
  "community_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("member"),
    status: memberStatus("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("community_members_unique_idx").on(t.communityId, t.userId),
  ],
);

export const discussions = pgTable(
  "discussions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    body: text("body").notNull(),
    tags: text("tags").array().notNull().default([]),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("discussions_slug_idx").on(t.slug),
    index("discussions_community_idx").on(t.communityId),
  ],
);

export const discussionReplies = pgTable("discussion_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  discussionId: uuid("discussion_id")
    .notNull()
    .references(() => discussions.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    type: eventType("type").notNull().default("other"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    timezone: text("timezone").notNull().default("UTC"),
    location: text("location"),
    onlineUrl: text("online_url"),
    registrationDeadline: timestamp("registration_deadline", {
      withTimezone: true,
    }),
    capacity: integer("capacity"),
    eligibility: text("eligibility"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("events_slug_idx").on(t.slug)],
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: registrationStatus("status").notNull().default("registered"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("event_registrations_unique_idx").on(t.eventId, t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Resource library                                                    */
/* ------------------------------------------------------------------ */

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    subject: text("subject"),
    college: text("college"),
    url: text("url"),
    fileUrl: text("file_url"),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("resources_category_idx").on(t.category)],
);

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("conversation_participants_unique_idx").on(
      t.conversationId,
      t.userId,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId),
    index("messages_sender_idx").on(t.senderId),
  ],
);

export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("blocks_pair_idx").on(t.blockerId, t.blockedId)],
);

/* ------------------------------------------------------------------ */
/* Cross-cutting                                                       */
/* ------------------------------------------------------------------ */

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    entityType: entityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("bookmarks_unique_idx").on(
      t.userId,
      t.entityType,
      t.entityId,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    entityType: entityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    reason: text("reason").notNull(),
    details: text("details"),
    status: reportStatus("status").notNull().default("open"),
    resolvedBy: uuid("resolved_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reports_status_idx").on(t.status)],
);

export const moderationActions = pgTable("moderation_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  moderatorId: uuid("moderator_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: entityType("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audit_logs_actor_idx").on(t.actorId)],
);

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type Profile = typeof profiles.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type MediaPost = typeof mediaPosts.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Report = typeof reports.$inferSelect;
