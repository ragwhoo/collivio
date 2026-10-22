import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  csv,
  emailSchema,
  eventSchema,
  opportunitySchema,
  profileSchema,
  signUpSchema,
  str,
} from "@/lib/validation";

describe("emailSchema", () => {
  it("normalizes casing and whitespace", () => {
    expect(emailSchema.parse("  Student@Example.COM ")).toBe("student@example.com");
  });

  it("rejects malformed emails", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("defaults to a student account", () => {
    const parsed = signUpSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    });
    expect(parsed.accountType).toBe("student");
  });

  it("enforces password and name minimums", () => {
    expect(
      signUpSchema.safeParse({ name: "A", email: "a@example.com", password: "short" }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "long-enough",
        accountType: "admin",
      }).success,
    ).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts empty optional URLs", () => {
    const parsed = profileSchema.parse({
      displayName: "Ada Lovelace",
      bio: "",
      githubUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
    });
    expect(parsed.githubUrl).toBe("");
    expect(parsed.visibility).toBe("public");
  });

  it("rejects an invalid URL", () => {
    expect(
      profileSchema.safeParse({ displayName: "Ada", githubUrl: "not a url" }).success,
    ).toBe(false);
  });

  it("coerces graduation year from a form value", () => {
    const parsed = profileSchema.parse({ displayName: "Ada", graduationYear: "2027" });
    expect(parsed.graduationYear).toBe(2027);
  });
});

describe("opportunitySchema", () => {
  const base = {
    title: "Backend Intern",
    type: "internship",
    description: "A".repeat(20),
    remote: "remote",
  };

  it("requires a meaningful description", () => {
    expect(opportunitySchema.safeParse({ ...base, description: "too short" }).success).toBe(false);
  });

  it("rejects unknown opportunity types", () => {
    expect(opportunitySchema.safeParse({ ...base, type: "volunteering" }).success).toBe(false);
  });

  it("coerces the publish checkbox", () => {
    expect(opportunitySchema.parse({ ...base, publish: "on" }).publish).toBe(true);
    expect(opportunitySchema.parse(base).publish).toBeUndefined();
  });
});

describe("applicationSchema", () => {
  it("requires a UUID opportunity id", () => {
    expect(
      applicationSchema.safeParse({ opportunityId: "not-a-uuid" }).success,
    ).toBe(false);
    expect(
      applicationSchema.safeParse({
        opportunityId: "c0000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(true);
  });
});

describe("eventSchema", () => {
  it("defaults the timezone and coerces capacity", () => {
    const parsed = eventSchema.parse({
      title: "Demo night",
      description: "Student teams show what they built.",
      type: "talk",
      startsAt: "2026-11-01T18:00",
      capacity: "120",
    });
    expect(parsed.timezone).toBe("UTC");
    expect(parsed.capacity).toBe(120);
  });
});

describe("form helpers", () => {
  it("csv trims and drops empty entries", () => {
    expect(csv(" React, TypeScript ,, ")).toEqual(["React", "TypeScript"]);
    expect(csv(null)).toEqual([]);
  });

  it("str trims and converts blanks to undefined", () => {
    expect(str("  hello ")).toBe("hello");
    expect(str("   ")).toBeUndefined();
    expect(str(null)).toBeUndefined();
  });
});
