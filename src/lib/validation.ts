import { z } from "zod";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  accountType: z.enum(["student", "business"]).default("student"),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1000).optional(),
  college: z.string().trim().max(160).optional(),
  degree: z.string().trim().max(120).optional(),
  branch: z.string().trim().max(120).optional(),
  graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),
  skills: z.string().max(600).optional(),
  interests: z.string().max(600).optional(),
  githubUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  linkedinUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  portfolioUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  visibility: z.enum(["public", "restricted"]).default("public"),
});

export const opportunitySchema = z.object({
  title: z.string().trim().min(3).max(160),
  type: z.enum([
    "internship",
    "job",
    "research",
    "scholarship",
    "hackathon",
    "other",
  ]),
  description: z.string().trim().min(20).max(8000),
  responsibilities: z.string().trim().max(4000).optional(),
  eligibility: z.string().trim().max(4000).optional(),
  skills: z.string().max(600).optional(),
  preferredSkills: z.string().max(600).optional(),
  location: z.string().trim().max(160).optional(),
  remote: z.enum(["onsite", "remote", "hybrid"]),
  compensation: z.string().trim().max(160).optional(),
  duration: z.string().trim().max(120).optional(),
  deadline: z.string().optional(),
  requiredDocuments: z.string().max(600).optional(),
  publish: z.coerce.boolean().optional(),
});

export const applicationSchema = z.object({
  opportunityId: z.string().uuid(),
  coverLetter: z.string().trim().max(4000).optional(),
  resumeUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  portfolioUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
});

export const projectSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(8000),
  abstract: z.string().trim().max(4000).optional(),
  objectives: z.string().trim().max(4000).optional(),
  category: z.string().trim().min(2).max(60),
  techStack: z.string().max(600).optional(),
  skillsRequired: z.string().max(600).optional(),
  coverImageUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  githubUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  demoUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  paperUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  collaborationOpen: z.coerce.boolean().optional(),
  publish: z.coerce.boolean().optional(),
});

export const mediaPostSchema = z.object({
  imageUrl: z.string().trim().refine(isHttpUrl, "Provide a valid image URL"),
  caption: z.string().trim().max(240).optional(),
  description: z.string().trim().max(2000).optional(),
  album: z.string().trim().max(120).optional(),
  college: z.string().trim().max(160).optional(),
  eventTag: z.string().trim().max(120).optional(),
  tags: z.string().max(600).optional(),
  visibility: z.enum(["public", "community", "private"]).default("public"),
});

export const communitySchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  guidelines: z.string().trim().max(4000).optional(),
  college: z.string().trim().max(160).optional(),
  category: z.string().trim().min(2).max(60).default("general"),
  joinPolicy: z.enum(["open", "request", "invite"]).default("open"),
});

export const discussionSchema = z.object({
  communityId: z.string().uuid(),
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(10).max(10000),
  tags: z.string().max(600).optional(),
});

export const eventSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(8000),
  type: z.enum(["workshop", "talk", "fest", "hackathon", "other"]),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
  timezone: z.string().trim().default("UTC"),
  location: z.string().trim().max(200).optional(),
  onlineUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  registrationDeadline: z.string().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  eligibility: z.string().trim().max(2000).optional(),
});

export const resourceSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
  category: z.string().trim().min(2).max(60),
  subject: z.string().trim().max(120).optional(),
  college: z.string().trim().max(160).optional(),
  url: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  fileUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  tags: z.string().max(600).optional(),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  website: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  logoUrl: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL").optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional(),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const reportSchema = z.object({
  entityType: z.enum([
    "project",
    "post",
    "opportunity",
    "resource",
    "event",
    "comment",
    "user",
  ]),
  entityId: z.string().uuid(),
  reason: z.string().trim().min(3).max(200),
  details: z.string().trim().max(2000).optional(),
});

export function csv(value: FormDataEntryValue | null | undefined): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function str(value: FormDataEntryValue | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
