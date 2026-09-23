"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, Users, Hammer, Award } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Discover",
    body: "Browse open ideas and microprojects that match your skills and interests.",
    icon: Search,
    side: "left" as const,
  },
  {
    title: "Find collaborators",
    body: "Match with students across colleges who want to build the same thing.",
    icon: Users,
    side: "right" as const,
  },
  {
    title: "Build together",
    body: "Ship real work in small teams with shared goals and clear milestones.",
    icon: Hammer,
    side: "left" as const,
  },
  {
    title: "Showcase your work",
    body: "Publish results to your profile and turn projects into opportunities.",
    icon: Award,
    side: "right" as const,
  },
] as const;

function splitChars(text: string) {
  return text.split("").map((ch, i) => {
    if (ch === " ") return " ";
    return (
      <span className="char" key={`${ch}-${i}`}>
        {ch}
      </span>
    );
  });
}

function revealChars(el: HTMLElement, progress: number, blur = 4) {
  const chars = el.querySelectorAll<HTMLElement>(".char");
  const n = chars.length;
  if (!n) return;
  chars.forEach((char, i) => {
    const start = (i / n) * 0.7;
    const end = start + 0.3;
    const p = Math.min(Math.max((progress - start) / (end - start), 0), 1);
    char.style.opacity = String(0.1 + p * 0.9);
    char.style.filter = p >= 1 ? "none" : `blur(${blur * (1 - p)}px)`;
    char.style.transform = `rotate(${3 * (1 - p)}deg)`;
  });
}

function splitHowChars(text: string) {
  return text.split("").map((ch, i) => {
    if (ch === " ") {
      return (
        <span className="how-char inline-block" key={`sp-${i}`} style={{ width: "0.3em" }}>
          {" "}
        </span>
      );
    }
    if (ch === "?") {
      return (
        <span
          className="how-char how-char-accent inline-block"
          key={`q-${i}`}
        >
          {ch}
        </span>
      );
    }
    return (
      <span className="how-char inline-block" key={`${ch}-${i}`}>
        {ch}
      </span>
    );
  });
}

function setHowWipe(p: number) {
  const title = document.querySelector<HTMLElement>(".how-title");
  const content = document.querySelector<HTMLElement>(".how-intro-content");
  if (!title || !content) return;

  const chars = title.querySelectorAll<HTMLElement>(".how-char");

  if (p < 0.02) {
    content.style.opacity = "0";
    chars.forEach((ch) => {
      ch.style.opacity = "0";
      ch.style.filter = "blur(18px)";
      ch.style.transform = "translateY(0.35em) rotate(6deg) scale(0.92)";
    });
    return;
  }

  content.style.opacity = "1";

  const enterEnd = 0.38;
  const exitStart = 0.72;
  const enterP = Math.min(p / enterEnd, 1);

  const n = chars.length;
  chars.forEach((ch, i) => {
    const start = (i / n) * 0.55;
    const end = start + 0.45;
    const raw = (enterP - start) / (end - start);
    const t = Math.min(Math.max(raw, 0), 1);
    const e = 1 - Math.pow(1 - t, 3);

    ch.style.opacity = String(e);
    ch.style.filter = t >= 1 ? "none" : `blur(${18 * (1 - e)}px)`;
    ch.style.transform = `translateY(${0.45 * (1 - e)}em) rotate(${8 * (1 - e)}deg) scale(${0.88 + 0.12 * e})`;
  });

  if (p > exitStart) {
    const exitP = (p - exitStart) / (1 - exitStart);

    content.style.opacity = "1";
    content.style.transform = "translateY(0) scale(1)";
    content.style.filter = "blur(0px)";

    chars.forEach((ch, i) => {
      const start = ((n - 1 - i) / n) * 0.55;
      const end = start + 0.45;
      const raw = (exitP - start) / (end - start);
      const t = Math.min(Math.max(raw, 0), 1);
      const e = t * t;

      ch.style.opacity = String(1 - e);
      ch.style.filter = e <= 0 ? "none" : `blur(${18 * e}px)`;
      ch.style.transform = `translateY(${-0.45 * e}em) rotate(${-8 * e}deg) scale(${1 - 0.12 * e})`;
    });
  } else {
    content.style.opacity = "1";
    content.style.transform = "translateY(0) scale(1)";
    content.style.filter = "blur(0px)";
  }
}

function renderStep(
  step: (typeof STEPS)[number],
  index: number,
  isFirst: boolean
) {
  const { title, body, icon: Icon, side } = step;
  return (
    <div
      key={title}
      data-side={side}
      data-first={isFirst ? "true" : undefined}
      className={`timeline-step relative flex items-center ${
        isFirst
          ? "h-full"
          : "mx-auto min-h-screen w-full max-w-5xl px-6 py-24"
      }`}
    >
      <div className="timeline-dot absolute left-1/2 top-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#FF7F9B] to-[#D7A7FF] shadow-lg">
        <Icon className="size-6 text-white" strokeWidth={2.2} />
      </div>

      <div
        className={`timeline-card relative z-10 w-full rounded-[20px] border border-black/10 bg-white p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:w-[calc(50%-3rem)] ${
          side === "left" ? "mr-auto sm:pr-4" : "ml-auto sm:pl-4"
        }`}
      >
        <div
          className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/50 ${
            side === "left" ? "sm:justify-start" : ""
          }`}
        >
          <span className="inline-block size-1.5 rounded-full bg-gradient-to-br from-[#FF7F9B] to-[#D7A7FF]" />
          step {index + 1}
        </div>
        <h2 className="milestone-title text-2xl font-semibold leading-tight sm:text-3xl">
          {splitChars(title)}
        </h2>
        <p className="milestone-body mt-3 text-sm leading-relaxed text-black/60 sm:text-base">
          {splitChars(body)}
        </p>

        {index === STEPS.length - 1 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-black/10">
            <Image
              src="/Hero2.png"
              alt="Collivio product"
              width={640}
              height={360}
              className="h-auto w-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      setHowWipe(0);

      ScrollTrigger.create({
        trigger: ".how-intro",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => setHowWipe(self.progress),
        onLeave: () => setHowWipe(1),
        onEnterBack: () => setHowWipe(1),
        onLeaveBack: () => setHowWipe(0),
      });

      const seedSteps = gsap.utils.toArray<HTMLElement>(".timeline-seed .timeline-step");
      const leafSteps = gsap.utils.toArray<HTMLElement>(".timeline-leaf .timeline-step");

      seedSteps.forEach((step) => {
        const card = step.querySelector(".timeline-card") as HTMLElement;
        const dot = step.querySelector(".timeline-dot") as HTMLElement;
        const title = step.querySelector(".milestone-title") as HTMLElement;
        const body = step.querySelector(".milestone-body") as HTMLElement;
        const isLeft = step.dataset.side === "left";

        gsap.set(step, { autoAlpha: 0 });
        gsap.set(card, { opacity: 0, x: isLeft ? -56 : 56 });
        gsap.set(dot, { scale: 0 });
        revealChars(title, 0);
        revealChars(body, 0);
      });

      leafSteps.forEach((step) => {
        const card = step.querySelector(".timeline-card") as HTMLElement;
        const dot = step.querySelector(".timeline-dot") as HTMLElement;
        const title = step.querySelector(".milestone-title") as HTMLElement;
        const body = step.querySelector(".milestone-body") as HTMLElement;
        const isLeft = step.dataset.side === "left";

        gsap.set(card, { opacity: 0, x: isLeft ? -56 : 56 });
        gsap.set(dot, { scale: 0 });
        revealChars(title, 0);
        revealChars(body, 0);
      });

      gsap.set(".timeline-progress", { scaleY: 0, scaleX: 1, width: 6 });
      gsap.set(".timeline-leaf-progress", { scaleY: 0, scaleX: 1, width: 6 });
      gsap.set(".timeline-start", { autoAlpha: 0, scale: 0.4 });
      gsap.set(".timeline-axis", { opacity: 0 });

      const applyContinuum = () => {
        const leaf = root.querySelector<HTMLElement>(".timeline-leaf");
        const seedLine = window.innerHeight / 2;
        const leafH = leaf ? leaf.offsetHeight : 0;
        const total = seedLine + leafH;

        gsap.set([".timeline-progress", ".timeline-leaf-progress"], {
          backgroundSize: `100% ${total}px`,
          backgroundRepeat: "no-repeat",
        });
        gsap.set(".timeline-progress", { backgroundPosition: "0px 0px" });
        gsap.set(".timeline-leaf-progress", {
          backgroundPosition: `0px ${-seedLine}px`,
        });
      };
      applyContinuum();

      ScrollTrigger.create({
        trigger: ".timeline-seed",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          applyContinuum();
          const p = self.progress;
          const dotEnd = 0.12;
          const lineEnd = 0.72;
          const cardIn = 0.2;

          const dotP = Math.min(p / dotEnd, 1);
          const dotE = 1 - Math.pow(1 - dotP, 3);

          gsap.set(".timeline-start", {
            autoAlpha: dotE,
            scale: 0.4 + 0.6 * dotE,
          });

          const lineP =
            p <= dotEnd
              ? 0
              : Math.min((p - dotEnd) / (lineEnd - dotEnd), 1);

          gsap.set(".timeline-axis", {
            opacity: dotE > 0.5 ? 1 : 0,
          });
          gsap.set(".timeline-progress", {
            scaleY: lineP,
          });

          seedSteps.forEach((step, i) => {
            if (i !== 0) {
              gsap.set(step, { autoAlpha: 0 });
              return;
            }
            const card = step.querySelector(".timeline-card") as HTMLElement;
            const dot = step.querySelector(".timeline-dot") as HTMLElement;
            const title = step.querySelector(".milestone-title") as HTMLElement;
            const body = step.querySelector(".milestone-body") as HTMLElement;
            const isLeft = step.dataset.side === "left";
            const dir = isLeft ? -56 : 56;

            gsap.set(step, { autoAlpha: 1 });

            const enter = Math.min(
              Math.max((p - cardIn) / 0.35, 0),
              1
            );
            const enterE = 1 - Math.pow(1 - enter, 3);

            gsap.set(card, { opacity: enterE, x: dir * (1 - enterE) });
            gsap.set(dot, { scale: Math.max(enterE * lineP, 0.001) });

            revealChars(title, Math.min(Math.max((p - cardIn) / 0.45, 0), 1));
            revealChars(
              body,
              Math.min(Math.max((p - cardIn - 0.08) / 0.4, 0), 1)
            );
          });

          gsap.set(".timeline-axis", {
            width: 6,
            top: "50%",
            bottom: 0,
            left: "50%",
            xPercent: -50,
            borderRadius: 999,
          });
          gsap.set(".timeline-progress", {
            width: 6,
            top: "50%",
            bottom: 0,
            left: "50%",
            xPercent: -50,
            scaleY: lineP,
            borderRadius: 999,
          });
        },
        onLeave: () => {
          seedSteps.forEach((step) => gsap.set(step, { autoAlpha: 1 }));
        },
        onEnterBack: () => {
          seedSteps.forEach((step, i) =>
            gsap.set(step, { autoAlpha: i === 0 ? 1 : 0 })
          );
        },
      });

      ScrollTrigger.create({
        trigger: ".timeline-leaf",
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          applyContinuum();
          gsap.set(".timeline-leaf-progress", {
            scaleY: self.progress,
          });
        },
      });

      leafSteps.forEach((step, stepIndex) => {
        const card = step.querySelector(".timeline-card") as HTMLElement;
        const dot = step.querySelector(".timeline-dot") as HTMLElement;
        const title = step.querySelector(".milestone-title") as HTMLElement;
        const body = step.querySelector(".milestone-body") as HTMLElement;
        const isLeft = step.dataset.side === "left";
        const dir = isLeft ? -56 : 56;
        const isLast = stepIndex === leafSteps.length - 1;

        ScrollTrigger.create({
          trigger: step,
          start: isLast ? "top 75%" : "top 75%",
          end: isLast ? "bottom 25%" : "center center",
          scrub: true,
          onUpdate: (self) => {
            if (!isLast) {
              const enter = self.progress;
              const enterE = 1 - Math.pow(1 - enter, 3);

              gsap.set(card, { opacity: enterE, x: dir * (1 - enterE) });
              gsap.set(dot, { scale: Math.max(enterE, 0.001) });
              revealChars(title, enter);
              revealChars(body, Math.min(enter * 1.2, 1));
              return;
            }

            const enter = Math.min(self.progress / 0.5, 1);
            const enterE = 1 - Math.pow(1 - enter, 3);
            const exit =
              self.progress > 0.6 ? (self.progress - 0.6) / 0.4 : 0;
            const exitE = exit * exit;

            const opacity = enterE * (1 - exitE);
            const x = dir * (1 - enterE) + dir * exitE * 0.6;

            gsap.set(card, { opacity, x });
            gsap.set(dot, { scale: Math.max(enterE * (1 - exitE), 0.001) });
            revealChars(title, Math.min(enter - exitE * 1.5, 1));
            revealChars(
              body,
              Math.min(Math.min(enter * 1.2, 1) - exitE * 1.5, 1)
            );
          },
          onLeaveBack: () => {
            gsap.set(card, { opacity: 0, x: dir });
            gsap.set(dot, { scale: 0 });
            revealChars(title, 0);
            revealChars(body, 0);
          },
          onLeave: () => {
            if (!isLast) return;
            gsap.set(card, { opacity: 0, x: dir * 0.6 });
            gsap.set(dot, { scale: 0.001 });
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="how-it-works"
      className="relative bg-white text-black"
    >
      <div className="how-intro relative h-[180vh] px-6">
        <div className="sticky top-0 flex h-screen items-center justify-center">
          <div className="how-intro-content text-center">
            <h1
              className="how-title font-semibold tracking-tight"
              style={{
                lineHeight: 1,
                padding: "0.2em 0.15em",
                margin: "-0.45em -0.15em",
              }}
            >
              <span className="block whitespace-nowrap text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem]">
                {splitHowChars(" How? ")}
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="timeline-stage relative">
        <div className="timeline-seed relative h-[220vh]">
          <div className="sticky top-0 h-screen overflow-hidden">
            <div className="timeline-track relative mx-auto h-full max-w-5xl px-6">
              <div className="timeline-start absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                <div className="timeline-start-dot size-5 rounded-full border-2 border-white bg-gradient-to-br from-[#FF7F9B] to-[#D7A7FF] shadow-lg" />
              </div>

              <div className="timeline-axis absolute bottom-0 left-1/2 top-1/2 z-0 w-1.5 -translate-x-1/2 rounded-full bg-black/15" />
              <div
                className="timeline-progress absolute bottom-0 left-1/2 top-1/2 z-0 w-1.5 origin-top -translate-x-1/2 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, #FF7F9B, #F89A9A, #D7A7FF)",
                }}
              />

              <div className="relative z-10 h-full">
                {renderStep(STEPS[0], 0, true)}
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-leaf relative">
          <div className="timeline-leaf-axis absolute inset-y-0 left-1/2 z-0 w-1.5 -translate-x-1/2 rounded-full bg-black/15" />
          <div
            className="timeline-leaf-progress absolute inset-y-0 left-1/2 z-0 w-1.5 origin-top -translate-x-1/2 rounded-full"
            style={{
              background: "linear-gradient(180deg, #FF7F9B, #F89A9A, #D7A7FF)",
            }}
          />
          {STEPS.slice(1).map((step, i) => renderStep(step, i + 1, false))}
        </div>
      </div>
    </section>
  );
}
