"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";

// Simple Google SVG Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

type AccountType = "student" | "business";

export default function Auth7({ type }: { type?: AccountType }) {
  const typeLabel =
    type === "student" ? "Student" : type === "business" ? "Business" : null;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div
      className="flex h-svh w-full overflow-hidden bg-white text-black antialiased selection:bg-black selection:text-white"
      style={{ fontFamily: "var(--font-poppins), Arial, Helvetica, sans-serif" }}
    >
      {/* Left Form Section */}
      <div className="flex w-full min-w-0 flex-col lg:w-1/2">
        {/* Header Branding */}
        <div className="px-4 pt-4 sm:px-6 sm:pt-6 md:px-10 md:pt-8">
          <Link href="/" aria-label="Collivio home" className="block">
            <Image
              src="/logo dark.png"
              alt="Collivio logo"
              width={120}
              height={40}
              priority
              className="h-auto w-16 sm:w-20 md:w-24"
            />
          </Link>
        </div>

        {/* Form Container — one fullscreen section, page never scrolls */}
        <div className="flex flex-1 justify-center overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8 [@media(max-height:820px)]:py-2">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="my-auto w-full max-w-[420px]"
          >
            {/* Titles */}
            <motion.div variants={itemVariants} className="mb-4 text-center sm:mb-6 [@media(max-height:820px)]:mb-3">
              <h1 className="mb-1 text-2xl font-semibold tracking-tight text-black sm:text-3xl md:text-4xl [@media(max-height:820px)]:text-2xl">
                {typeLabel ? `Create your ${typeLabel} Account` : "Create your Account"}
              </h1>
              <p className="text-sm text-black">
                Let&apos;s get started with your 30 days free trial
              </p>
            </motion.div>

            {/* Google Login Button */}
            <motion.div variants={itemVariants} className="mb-3 sm:mb-4 [@media(max-height:820px)]:mb-2">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-50 active:bg-neutral-100"
              >
                <GoogleIcon className="text-lg" />
                Login with Google
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="relative mb-4 flex items-center sm:mb-6 [@media(max-height:820px)]:mb-3"
            >
              <div className="grow border-t border-neutral-200"></div>
              <span className="px-4 text-sm text-black">or</span>
              <div className="grow border-t border-neutral-200"></div>
            </motion.div>

            {/* Form */}
            <form className="flex flex-col gap-3 sm:gap-4 [@media(max-height:820px)]:gap-2">
              <input type="hidden" name="accountType" value={type ?? ""} />

              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-black"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-black placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 sm:py-3"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-black"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-black placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 sm:py-3"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-black"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-black placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 sm:py-3"
                />
              </motion.div>

              {/* Checkbox */}
              <motion.div
                variants={itemVariants}
                className="flex items-start gap-3"
              >
                <div className="flex h-5 items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-neutral-900"
                  />
                </div>
                <label htmlFor="terms" className="text-sm text-black">
                  I agree to all Terms, Privacy Policy and Fees
                </label>
              </motion.div>

              {/* Sign Up Button */}
              <motion.div variants={itemVariants} className="mt-1">
                <button
                  type="submit"
                  className="w-full rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Sign Up
                </button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              className="mt-4 text-sm text-black sm:mt-5 [@media(max-height:820px)]:mt-2"
            >
              Already have an account?{" "}
              <a
                href="/auth"
                className="font-semibold text-black hover:underline"
              >
                Log in
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block w-1/2 p-4">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem]">
          <img
            src="https://assets.watermelon.sh/auth-7.avif"
            alt="Cloudscape background"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}