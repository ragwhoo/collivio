import type { Metadata } from "next";
import Auth7 from "@/components/auth/Auth7";

export const metadata: Metadata = {
  title: "Sign in — Collivio",
};

export default function SignInPage() {
  return <Auth7 mode="signin" />;
}