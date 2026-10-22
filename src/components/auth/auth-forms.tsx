"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { signInAction, signUpAction, type AuthState } from "@/app/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className={inputClass}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
      />
    </label>
  );
}

function ErrorNote({ state }: { state: AuthState }) {
  if (!state?.error) return null;
  return (
    <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm" role="alert">
      {state.error}
    </p>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, undefined);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-8 block w-32 overflow-hidden" aria-label="Collivio home">
        <Image src="/logo dark.png" alt="Collivio" width={1080} height={1080} className="h-24 w-auto max-w-none" />
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Sign in to continue to your Collivio dashboard.
      </p>
      <form action={action} className="mt-6 flex flex-col gap-4">
        <ErrorNote state={state} />
        <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@college.edu" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-sm">
        New to Collivio?{" "}
        <Link href="/auth/signup" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm({ accountType }: { accountType: "student" | "business" }) {
  const [state, action, pending] = useActionState(signUpAction, undefined);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-8 block w-32 overflow-hidden" aria-label="Collivio home">
        <Image src="/logo dark.png" alt="Collivio" width={1080} height={1080} className="h-24 w-auto max-w-none" />
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {accountType === "business"
          ? "Register your organization. Publishing requires admin verification."
          : "Join students across colleges to build, share and collaborate."}
      </p>
      <form action={action} className="mt-6 flex flex-col gap-4">
        <ErrorNote state={state} />
        <input type="hidden" name="accountType" value={accountType} />
        <Field label="Full name" name="name" autoComplete="name" required placeholder="Ada Lovelace" />
        <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@college.edu" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
