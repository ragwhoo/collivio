import { describe, expect, it } from "vitest";
import {
  canEditProject,
  canManageOrganization,
  canModerateCommunity,
  canPublishOpportunity,
  canViewApplication,
  canViewProject,
  isValidApplicationTransition,
  slugify,
} from "@/lib/authz";

describe("application transitions", () => {
  it("allows the documented forward path", () => {
    expect(isValidApplicationTransition("submitted", "under_review")).toBe(true);
    expect(isValidApplicationTransition("under_review", "shortlisted")).toBe(true);
    expect(isValidApplicationTransition("shortlisted", "interview")).toBe(true);
    expect(isValidApplicationTransition("interview", "accepted")).toBe(true);
  });

  it("allows withdrawal from active states", () => {
    expect(isValidApplicationTransition("submitted", "withdrawn")).toBe(true);
    expect(isValidApplicationTransition("under_review", "withdrawn")).toBe(true);
    expect(isValidApplicationTransition("interview", "withdrawn")).toBe(true);
  });

  it("treats terminal states as final", () => {
    for (const status of ["accepted", "rejected", "withdrawn"] as const) {
      expect(isValidApplicationTransition(status, "submitted")).toBe(false);
      expect(isValidApplicationTransition(status, "accepted")).toBe(false);
    }
  });

  it("rejects backwards transitions", () => {
    expect(isValidApplicationTransition("shortlisted", "submitted")).toBe(false);
    expect(isValidApplicationTransition("interview", "under_review")).toBe(false);
  });
});

describe("organization permissions", () => {
  const owner = { id: "owner", role: "student" as const };
  const other = { id: "other", role: "student" as const };
  const admin = { id: "admin", role: "admin" as const };

  it("lets the owner and admins manage an organization", () => {
    expect(canManageOrganization(owner, { ownerId: "owner" })).toBe(true);
    expect(canManageOrganization(admin, { ownerId: "someone-else" })).toBe(true);
    expect(canManageOrganization(other, { ownerId: "owner" })).toBe(false);
  });

  it("only publishes for a verified, approved owner", () => {
    const approved = { ownerId: "owner", verified: true, verificationStatus: "approved" as const };
    expect(canPublishOpportunity(owner, approved)).toBe(true);
  });

  it("refuses unverified, pending or foreign organizations", () => {
    expect(
      canPublishOpportunity(owner, {
        ownerId: "owner",
        verified: false,
        verificationStatus: "approved",
      }),
    ).toBe(false);
    expect(
      canPublishOpportunity(owner, {
        ownerId: "owner",
        verified: true,
        verificationStatus: "pending",
      }),
    ).toBe(false);
    expect(
      canPublishOpportunity(other, {
        ownerId: "owner",
        verified: true,
        verificationStatus: "approved",
      }),
    ).toBe(false);
    expect(canPublishOpportunity(owner, null)).toBe(false);
  });

  it("still allows admins to publish on behalf of an organization", () => {
    expect(
      canPublishOpportunity(admin, {
        ownerId: "owner",
        verified: false,
        verificationStatus: "pending",
      }),
    ).toBe(true);
  });
});

describe("application visibility", () => {
  const student = { id: "student", role: "student" as const };
  const stranger = { id: "stranger", role: "student" as const };
  const owner = { id: "owner", role: "business" as const };
  const admin = { id: "admin", role: "admin" as const };
  const application = { studentId: "student" };

  it("allows the applicant and the organization owner", () => {
    expect(canViewApplication(student, application, { ownerId: "owner" })).toBe(true);
    expect(canViewApplication(owner, application, { ownerId: "owner" })).toBe(true);
  });

  it("allows admins but not unrelated students", () => {
    expect(canViewApplication(admin, application, { ownerId: "owner" })).toBe(true);
    expect(canViewApplication(stranger, application, { ownerId: "owner" })).toBe(false);
    expect(canViewApplication(stranger, application, null)).toBe(false);
  });
});

describe("project permissions", () => {
  const owner = { id: "owner", role: "student" as const };
  const contributor = { id: "contributor", role: "student" as const };
  const stranger = { id: "stranger", role: "student" as const };
  const admin = { id: "admin", role: "admin" as const };
  const project = { ownerId: "owner" };

  it("lets owners, editors and admins edit", () => {
    expect(canEditProject(owner, project)).toBe(true);
    expect(canEditProject(contributor, project, { canEdit: true })).toBe(true);
    expect(canEditProject(admin, project)).toBe(true);
    expect(canEditProject(stranger, project, { canEdit: false })).toBe(false);
  });

  it("exposes public published projects to anonymous viewers", () => {
    expect(
      canViewProject(null, { ownerId: "owner", visibility: "public", status: "published" }),
    ).toBe(true);
    expect(
      canViewProject(null, { ownerId: "owner", visibility: "private", status: "published" }),
    ).toBe(false);
    expect(
      canViewProject(null, { ownerId: "owner", visibility: "public", status: "draft" }),
    ).toBe(false);
  });

  it("lets owners, contributors and admins view private projects", () => {
    const privateProject = { ownerId: "owner", visibility: "private" as const, status: "draft" as const };
    expect(canViewProject(owner, privateProject)).toBe(true);
    expect(canViewProject(admin, privateProject)).toBe(true);
    expect(
      canViewProject(contributor, privateProject, { userId: "contributor", canEdit: false }),
    ).toBe(true);
    expect(canViewProject(stranger, privateProject)).toBe(false);
  });
});

describe("community moderation", () => {
  const viewer = { id: "viewer", role: "student" as const };
  const admin = { id: "admin", role: "admin" as const };

  it("allows active owners and moderators only", () => {
    expect(canModerateCommunity(viewer, { userId: "viewer", role: "owner", status: "active" })).toBe(
      true,
    );
    expect(
      canModerateCommunity(viewer, { userId: "viewer", role: "moderator", status: "active" }),
    ).toBe(true);
    expect(canModerateCommunity(viewer, { userId: "viewer", role: "member", status: "active" })).toBe(
      false,
    );
    expect(canModerateCommunity(viewer, { userId: "viewer", role: "owner", status: "pending" })).toBe(
      false,
    );
    expect(canModerateCommunity(viewer, { userId: "other", role: "owner", status: "active" })).toBe(
      false,
    );
  });

  it("allows admins without a membership", () => {
    expect(canModerateCommunity(admin, null)).toBe(true);
  });
});

describe("slugify", () => {
  it("normalizes titles into stable slugs", () => {
    expect(slugify("  Hello, Collivio World!  ")).toBe("hello-collivio-world");
    expect(slugify("C++ & Rust: notes")).toBe("c-rust-notes");
  });

  it("caps length at 80 characters", () => {
    expect(slugify("a".repeat(200))).toHaveLength(80);
  });
});
