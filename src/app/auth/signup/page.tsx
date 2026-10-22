import type { Metadata } from "next";
import Auth7 from "@/components/auth/Auth7";

export const metadata: Metadata = {
  title: "Sign Up — Collivio",
  description: "Create your Collivio account and start collaborating.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const accountType = type === "business" ? "business" : "student";

  return <Auth7 type={accountType} mode="signup" />;
}