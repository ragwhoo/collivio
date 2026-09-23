"use client";

import Image from "next/image";

export default function NextSection() {
  return (
    <section
      id="next"
      className="relative flex min-h-screen flex-col items-center justify-center gap-16 px-6 py-24 text-white"
      style={{ background: "#05050a" }}
    >
      <Image
        src="/transparentlogo.svg"
        alt="Collivio logo"
        width={1200}
        height={400}
        priority
        className="h-auto w-[min(92vw,1100px)] object-contain"
      />

      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-white/75">
          ready when you are
        </p>
        <h2
          className="font-semibold tracking-tight"
          style={{ lineHeight: 1.05 }}
        >
          Start building
          <br />
          with Collivio.
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105">
            Get Started
          </button>
          <button className="rounded-full border border-white/50 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15">
            Talk to us
          </button>
        </div>
      </div>
    </section>
  );
}
