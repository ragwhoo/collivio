import type { Metadata } from "next";
import Auth7 from "@/components/auth/Auth7";

export const metadata: Metadata = {
  title: "Sign Up — Collivio",
  description: "Create your Collivio account and start collaborating.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const accountType = type === "student" || type === "business" ? type : undefined;

  return <Auth7 type={accountType} />;
}