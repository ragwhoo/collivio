import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Sign in — Collivio",
};

export default function SignInPage() {
  return <SignInForm />;
}
