"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, Code2, TrendingUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
  {
    eyebrow: "FASTER COLLABORATION",
    title: "Find your people.",
    body: "Connect with like-minded students across colleges and domains.",
    stat: "118 ms",
    statLabel: "Average match time",
    icon: Users,
    background:
      "linear-gradient(135deg, #D46B7C 0%, #B64D69 45%, #8E3F5C 100%)",
    glow: "rgba(243, 138, 145, 0.45)",
  },
  {
    eyebrow: "REAL SKILLS",
    title: "Build real projects.",
    body: "Work on meaningful microprojects and showcase your work.",
    stat: "24 M+",
    statLabel: "Ideas turned into projects",
    icon: Code2,
    background:
      "linear-gradient(135deg, #A65BC0 0%, #8646A7 45%, #633D8D 100%)",
    glow: "rgba(193, 122, 224, 0.45)",
  },
  {
    eyebrow: "A BRIGHTER FUTURE",
    title: "Grow together.",
    body: "Learn, collaborate, and create opportunities — as a community.",
    stat: "15 K+",
    statLabel: "Active students this month",
    icon: TrendingUp,
    background:
      "linear-gradient(135deg, #F07A55 0%, #E2644D 45%, #C34E4B 100%)",
    glow: "rgba(255, 154, 98, 0.45)",
  },
] as const;

export default function Features() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const showcase = document.getElementById("showcase");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root,
            start: "top 75%",
          },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".feature-card", root);
      if (cards.length) {
        const split = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "center center",
            endTrigger: showcase ?? root,
            end: "top 60%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        cards.forEach((card, i) => {
          const dir = i === 0 ? -1 : i === 2 ? 1 : 0;
          split.fromTo(
            card,
            { xPercent: 0, yPercent: 0, scale: 1 },
            {
              xPercent: dir * 90,
              yPercent: i === 1 ? -25 : 15,
              scale: 1.7,
              ease: "none",
            },
            0
          );
        });

        ScrollTrigger.refresh();
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="features"
      className="relative flex min-h-screen flex-col justify-center px-6 py-10 sm:px-12 md:px-20"
    >
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {CARDS.map(
          ({ eyebrow, title, body, stat, statLabel, icon: Icon, background, glow }) => (
            <article
              key={eyebrow}
              className="feature-card relative overflow-hidden rounded-[20px] border border-white/25 p-7 opacity-0"
              style={{
                background,
                boxShadow: `0 20px 50px rgba(0, 0, 0, 0.2), 0 0 60px ${glow}`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 45%)",
                }}
              />
              <div className="relative flex flex-col gap-4 text-white">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  <Icon className="size-4" strokeWidth={2} />
                  {eyebrow}
                </div>
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {title}
                </h2>
                <p className="text-sm leading-relaxed text-white/80 sm:text-base">
                  {body}
                </p>
                <div className="mt-4 border-t border-white/20 pt-4">
                  <div className="text-3xl font-semibold sm:text-4xl">
                    {stat}
                  </div>
                  <div className="mt-1 text-xs text-white/65 sm:text-sm">
                    {statLabel}
                  </div>
                </div>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}
