import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Coming Soon — Collivio",
  description:
    "Collivio is almost here. Stay tuned — something great is on the way.",
};

export default function ComingSoon() {
  return (
    <main
      className="relative flex h-svh flex-col items-center justify-center overflow-hidden px-[clamp(1.5rem,4.17vw,5rem)] py-[clamp(2rem,5vh,4rem)] text-center text-white"
      style={{
        background:
          "radial-gradient(1100px 750px at 12% 8%, rgba(253,151,121,0.5), transparent 60%), radial-gradient(1000px 850px at 88% 18%, rgba(120,79,224,0.6), transparent 65%), radial-gradient(900px 900px at 75% 95%, rgba(199,73,144,0.45), transparent 60%), radial-gradient(700px 700px at 30% 90%, rgba(89,42,168,0.6), transparent 65%), #0e0a24",
      }}
    >
      <Link
        href="/"
        className="absolute left-[clamp(1.25rem,1.67vw,2rem)] top-[clamp(0.75rem,1.2vw,1.75rem)] opacity-90 transition-opacity hover:opacity-100"
      >
        <Image
          src="/logo.png"
          alt="Collivio logo"
          width={120}
          height={40}
          priority
          className="h-auto w-24 sm:w-28 md:w-32"
        />
      </Link>

      <div className="flex flex-col items-center">
        <p className="mb-[clamp(0.75rem,1vw,1.25rem)] text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          collivio · stay tuned
        </p>

        <h1
          className="font-semibold tracking-tight text-white"
          style={{ lineHeight: 1 }}
        >
          <span className="block text-[clamp(3rem,min(calc(11vw_+_20px),calc(19vh_+_20px)),14rem)]">
            Coming
          </span>
          <span
            className="block bg-clip-text text-transparent text-[clamp(3rem,min(calc(11vw_+_20px),calc(19vh_+_20px)),14rem)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #FF7F9B, #F89A9A, #D7A7FF)",
              lineHeight: 1.25,
              paddingBottom: "0.15em",
              marginTop: "-0.28em",
              overflow: "visible",
            }}
          >
            Soon.
          </span>
        </h1>

        <p className="mx-auto -mt-[clamp(0.5rem,1.2vw,1.5rem)] max-w-xl text-[clamp(1rem,1.04vw,1.25rem)] font-light text-white/75">
          We&apos;re putting the finishing touches on Collivio. Something great
          is on the way — check back soon.
        </p>

        <div className="mt-[clamp(1.5rem,2.5vw,2.5rem)]">
          <Link
            href="/"
            className="inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
          >
            Back to home →
          </Link>
        </div>
      </div>
    </main>
  );
}
