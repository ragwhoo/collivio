"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CommunitySection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.set(
        [".eyebrow", ".title-line", ".body-copy", ".cta-link"],
        { opacity: 0, y: 36 }
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 70%",
          end: "top 25%",
          scrub: true,
        },
      });

      tl.to(".eyebrow", { opacity: 1, y: 0, duration: 1 }, 0)
        .to(".title-line", { opacity: 1, y: 0, stagger: 0.2, duration: 1 }, 0.15)
        .to(".body-copy", { opacity: 1, y: 0, duration: 1 }, 0.55)
        .to(".cta-link", { opacity: 1, y: 0, duration: 1 }, 0.8);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="community"
      className="relative flex min-h-screen items-center overflow-hidden px-6 py-32 text-left sm:px-12 md:px-20"
    >
      <div className="w-full max-w-4xl">
        <p className="eyebrow mb-4 text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          different minds · different skills · one future
        </p>

        <h1
          className="font-semibold tracking-tight text-white"
          style={{ lineHeight: 1 }}
        >
          <span className="title-line block text-7xl sm:text-8xl md:text-9xl">
            Where Ideas
          </span>
          <span
            className="title-line block bg-clip-text text-transparent text-7xl sm:text-8xl md:text-9xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #FF7F9B, #F89A9A, #D7A7FF)",
              lineHeight: 1.25,
              paddingBottom: "0.15em",
              marginTop: "-0.28em",
              overflow: "visible",
            }}
          >
            Connect.
          </span>
        </h1>

        <p className="body-copy mt-6 max-w-xl text-lg font-light text-white/75 sm:text-xl">
          Bring your perspective. Find people who think differently. Build
          something none of you could have built alone.
        </p>

        <div className="cta-link mt-8">
          <button className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105">
            Explore the community →
          </button>
        </div>
      </div>
    </section>
  );
}
