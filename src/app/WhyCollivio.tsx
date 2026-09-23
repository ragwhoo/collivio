"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REASONS = [
  {
    title: "Discover",
    body: "Find projects and ideas that match their interests, skills, and ambitions.",
  },
  {
    title: "Connect",
    body: "Meet students from different colleges and disciplines who want to build the same things.",
  },
  {
    title: "Build",
    body: "Turn ideas into real microprojects, gain practical experience, and learn by doing.",
  },
  {
    title: "Showcase",
    body: "Create a portfolio of things they've actually built — not just a list of courses or certificates.",
  },
] as const;

const PARAGRAPHS = [
  "Because students shouldn't have to build alone.",
  "We saw a gap between what students learn and what they actually get to build.",
  "There are thousands of students with ideas, skills, and the willingness to create — but finding the right people, the right project, and a real opportunity to work together isn't always easy.",
  "Most platforms help you either learn, network, or showcase. Collivio brings those pieces together.",
] as const;

function splitWhyChars(text: string) {
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
        <span className="how-char inline-block" key={`q-${i}`} style={{ color: "#fff" }}>
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

function setWhyWipe(p: number) {
  const title = document.querySelector<HTMLElement>(".why-title");
  const content = document.querySelector<HTMLElement>(".why-intro-content");
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

  const enterEnd = 0.48;
  const exitStart = 0.58;
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

const GRADIENT_BG = "linear-gradient(135deg, #FF7F9B, #F89A9A, #D7A7FF)";

export default function WhyCollivio() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      setWhyWipe(0);

      ScrollTrigger.create({
        trigger: ".why-intro",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => setWhyWipe(self.progress),
        onLeave: () => setWhyWipe(1),
        onEnterBack: () => setWhyWipe(1),
        onLeaveBack: () => setWhyWipe(0),
      });

      const paragraphs = gsap.utils.toArray<HTMLElement>(".why-paragraph");
      paragraphs.forEach((el) => {
        revealChars(el, 0);
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          end: "top 40%",
          scrub: true,
          onUpdate: (self) => revealChars(el, self.progress),
          onLeaveBack: () => revealChars(el, 0),
        });
      });

      const reasonCards = gsap.utils.toArray<HTMLElement>(".why-reason");
      reasonCards.forEach((card) => {
        const title = card.querySelector(".why-reason-title") as HTMLElement;
        const body = card.querySelector(".why-reason-body") as HTMLElement;
        revealChars(title, 0);
        revealChars(body, 0);
        gsap.set(card, { opacity: 0, y: 36 });

        ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          end: "top 45%",
          scrub: true,
          onUpdate: (self) => {
            const e = 1 - Math.pow(1 - self.progress, 3);
            gsap.set(card, { opacity: e, y: 36 * (1 - e) });
            revealChars(title, e);
            revealChars(body, e);
          },
          onLeaveBack: () => {
            gsap.set(card, { opacity: 0, y: 36 });
            revealChars(title, 0);
            revealChars(body, 0);
          },
        });
      });

      const ideaBlocks = gsap.utils.toArray<HTMLElement>(".why-idea-block");
      ideaBlocks.forEach((el) => {
        const heading = el.querySelector<HTMLElement>(".why-idea-title");
        const paras = el.querySelectorAll<HTMLElement>(".why-paragraph");
        if (heading) revealChars(heading, 0);
        paras.forEach((p) => revealChars(p, 0));

        ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          end: "top 30%",
          scrub: true,
          onUpdate: (self) => {
            const e = 1 - Math.pow(1 - self.progress, 3);
            if (heading) revealChars(heading, e);
            paras.forEach((p, i) => {
              const delayed = Math.min(
                Math.max((self.progress - i * 0.15) / 0.7, 0),
                1
              );
              revealChars(p, delayed);
            });
          },
          onLeaveBack: () => {
            if (heading) revealChars(heading, 0);
            paras.forEach((p) => revealChars(p, 0));
          },
        });
      });

      const tagline = root.querySelector<HTMLElement>(".why-tagline");
      if (tagline) {
        revealChars(tagline, 0);
        ScrollTrigger.create({
          trigger: tagline,
          start: "top 85%",
          end: "top 50%",
          scrub: true,
          onUpdate: (self) => revealChars(tagline, self.progress),
          onLeaveBack: () => revealChars(tagline, 0),
        });
      }

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onEnter: () =>
          document.querySelector("header")?.classList.remove("nav-on-light"),
        onEnterBack: () =>
          document.querySelector("header")?.classList.remove("nav-on-light"),
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="why-collivio"
      className="relative text-white"
      style={{ background: GRADIENT_BG }}
    >
      <div className="why-intro relative h-[180vh] px-6">
        <div className="sticky top-0 flex h-screen items-center justify-center">
          <div className="why-intro-content text-center">
            <h1
              className="why-title font-semibold tracking-tight text-white"
              style={{
                lineHeight: 1,
                padding: "0.2em 0.15em",
                margin: "-0.45em -0.15em",
              }}
            >
              <span className="block whitespace-nowrap text-7xl sm:text-8xl md:text-[9rem] lg:text-[11rem]">
                {splitWhyChars("Why Collivio?")}
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-10">
        <div className="space-y-8">
          {PARAGRAPHS.map((text) => (
            <p
              key={text}
              className="why-paragraph text-xl leading-relaxed font-medium text-white/90 sm:text-2xl"
            >
              {splitChars(text)}
            </p>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16">
        <p className="why-paragraph mb-6 text-lg text-white/85 sm:text-xl">
          {splitChars("We wanted to create a place where students can:")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="why-reason rounded-[20px] border border-white/40 p-7"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.12))",
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                <span className="inline-block size-1.5 rounded-full bg-white" />
                <h3 className="why-reason-title text-white">{splitChars(reason.title)}</h3>
              </div>
              <p className="why-reason-body text-sm leading-relaxed text-white/85 sm:text-base">
                {splitChars(reason.body)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="why-idea-block mx-auto max-w-3xl px-6 pb-16">
        <h2 className="why-idea-title mb-6 text-3xl font-semibold text-white sm:text-4xl">
          {splitChars("The idea behind Collivio")}
        </h2>
        <div className="space-y-6">
          <p className="why-paragraph text-lg leading-relaxed text-white/90 sm:text-xl">
            {splitChars(
              "A student's potential shouldn't be limited by their college, their network, or whether they already know the right people."
            )}
          </p>
          <p className="why-paragraph text-lg leading-relaxed text-white/90 sm:text-xl">
            {splitChars(
              "Collivio is built to make collaboration easier — connecting students, ideas, skills, and opportunities in one place."
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-28">
        <p className="why-tagline text-2xl font-semibold text-white sm:text-3xl">
          {splitChars(
            "Find your people. Build something real. Grow together."
          )}
        </p>
      </div>
    </section>
  );
}
