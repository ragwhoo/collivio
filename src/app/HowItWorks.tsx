"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, Users, Hammer, Award } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Discover",
    body: "Browse open ideas and microprojects that match your skills and interests. Filter by domain, time commitment, and skill level so you only see work you can actually ship.",
    details: [
      "Personalized feed based on your stack",
      "Skill tags and difficulty filters",
      "Live project counts and deadlines",
    ],
    icon: Search,
    side: "left" as const,
  },
  {
    title: "Find collaborators",
    body: "Match with students across colleges who want to build the same thing. See verified skills, past ships, and availability before you commit to a team.",
    details: [
      "Cross-college talent pool",
      "Verified skill and portfolio tags",
      "Availability and time-zone match",
    ],
    icon: Users,
    side: "right" as const,
  },
  {
    title: "Build together",
    body: "Ship real work in small teams with shared goals and clear milestones. Track progress in one place so everyone knows what done looks like.",
    details: [
      "Shared milestones and check-ins",
      "Built-in chat and task board",
      "Auto progress updates for everyone",
    ],
    icon: Hammer,
    side: "left" as const,
  },
  {
    title: "Showcase your work",
    body: "Publish results to your profile and turn projects into opportunities. Recruiters and founders browse real builds — not just resumes.",
    details: [
      "Public project pages with demos",
      "Proof of contribution on each ship",
      "Opportunities routed to your inbox",
    ],
    icon: Award,
    side: "right" as const,
  },
] as const;

type PlacementKey =
  | "discover"
  | "find"
  | "build"
  | "showcase"
  | "student"
  | "recruiter";

type Placement = {
  src: string;
  x: number;
  y: number;
  w: number;
  rot: number;
};

const PLACEMENT_KEYS: PlacementKey[] = [
  "discover",
  "find",
  "build",
  "showcase",
  "student",
  "recruiter",
];

const ILLUSTRATION_KEYS: PlacementKey[] = [
  "discover",
  "find",
  "build",
  "showcase",
];

const CHARACTER_KEYS: PlacementKey[] = ["student", "recruiter"];

const DEFAULT_PLACEMENTS: Record<PlacementKey, Placement> = {
  discover: {
    src: "/illustrations/discover.svg",
    x: 88.83606432305008,
    y: 42.33129053310744,
    w: 80,
    rot: 0,
  },
  find: {
    src: "/illustrations/find-collaborators.svg",
    x: 11.000002384185791,
    y: 48.773009293663186,
    w: 80,
    rot: 0,
  },
  build: {
    src: "/illustrations/build-together.svg",
    x: 91.34374761581421,
    y: 44.58077804531798,
    w: 80,
    rot: 0,
  },
  showcase: {
    src: "/illustrations/showcase.svg",
    x: 11.390621423721313,
    y: 44.88752962241051,
    w: 80,
    rot: 0,
  },
  student: {
    src: "/characters/25.svg",
    x: 52,
    y: 50.0511298134418,
    w: 96.25,
    rot: 0,
  },
  recruiter: {
    src: "/characters/24.svg",
    x: 50,
    y: 48.824129112052404,
    w: 96.3,
    rot: 0,
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

  const enterEnd = 0.6;
  const exitStart = 0.55;
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

type StepEditProps = {
  placementKey: PlacementKey;
  placement: Placement;
  editMode: boolean;
  selected: boolean;
  onSelect: (key: PlacementKey) => void;
  onDrag: (key: PlacementKey, e: React.PointerEvent) => void;
  onResize: (key: PlacementKey, e: React.PointerEvent) => void;
};

function renderStep(
  step: (typeof STEPS)[number],
  index: number,
  isFirst: boolean,
  edit?: StepEditProps
) {
  const { title, body, details, icon: Icon, side } = step;
  const illu = edit?.placement;
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
      <div className="timeline-dot absolute left-1/2 top-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#FD9779] to-[#592AA8] shadow-lg">
        <Icon className="size-6 text-white" strokeWidth={2.2} />
      </div>

      <div
        className={`timeline-card relative z-10 w-full rounded-[20px] border border-white/60 bg-white/40 p-9 text-black shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:absolute sm:top-0 sm:bottom-0 sm:my-auto sm:h-fit sm:w-[calc(25vw+80px)] ${
          side === "left"
            ? "sm:left-[calc(50%-25vw-200px)] sm:right-auto"
            : "sm:right-[calc(50%-25vw-200px)] sm:left-auto"
        }`}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.75)",
        }}
      >
        <div
          className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/50 ${
            side === "left" ? "sm:justify-start" : ""
          }`}
        >
          <span className="inline-block size-1.5 rounded-full bg-gradient-to-br from-[#FD9779] to-[#592AA8]" />
          step {index + 1}
        </div>
        <h2 className="milestone-title text-2xl font-semibold leading-tight sm:text-3xl">
          {splitChars(title)}
        </h2>
        <p className="milestone-body mt-3 text-sm leading-relaxed text-black/60 sm:text-base">
          {splitChars(body)}
        </p>

        <ul className="mt-4 space-y-2 border-t border-black/5 pt-4">
          {details.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm leading-snug text-black/55"
            >
              <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#FD9779] to-[#592AA8]" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {illu && (
        <div
          className="timeline-illu absolute z-[5]"
          style={{
            left: `${illu.x}%`,
            top: `${illu.y}%`,
            width: `${illu.w}%`,
            transform: `translate(-50%, -50%) rotate(${illu.rot}deg)`,
            pointerEvents: edit?.editMode ? "auto" : "none",
            cursor: edit?.editMode ? "move" : undefined,
            touchAction: "none",
            outline:
              edit?.editMode && edit.selected
                ? "2px dashed #FD9779"
                : edit?.editMode
                  ? "1px dashed rgba(0,0,0,0.25)"
                  : undefined,
            outlineOffset: 4,
          }}
          onPointerDown={(e) => {
            if (!edit?.editMode) return;
            e.preventDefault();
            e.stopPropagation();
            edit.onSelect(edit.placementKey);
            edit.onDrag(edit.placementKey, e);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={illu.src}
            alt=""
            className="h-auto w-full select-none"
            draggable={false}
          />
          {edit?.editMode && (
            <div
              className="absolute -right-2.5 -bottom-2.5 size-5 rounded-full border-2 border-white bg-[#FD9779] shadow"
              style={{ cursor: "nwse-resize" }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                edit.onSelect(edit.placementKey);
                edit.onResize(edit.placementKey, e);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function HowItWorks() {
  const rootRef = useRef<HTMLElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [placements, setPlacements] =
    useState<Record<PlacementKey, Placement>>(DEFAULT_PLACEMENTS);
  const [selected, setSelected] = useState<PlacementKey>("discover");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "5" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setEditMode((m) => !m);
        setCopied(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onDrag = useCallback((key: PlacementKey, e: React.PointerEvent) => {
    const isCharacter = (CHARACTER_KEYS as string[]).includes(key);
    const bounds =
      (isCharacter
        ? (e.currentTarget as HTMLElement).closest(
            ".timeline-flood"
          )
        : (e.currentTarget as HTMLElement).closest(".timeline-step")) as
        | HTMLElement
        | null;
    if (!bounds) return;
    const rect = bounds.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...placements[key] };

    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      setPlacements((p) => ({
        ...p,
        [key]: {
          ...p[key],
          x: clamp(orig.x + dx, 0, 100),
          y: clamp(orig.y + dy, 0, 100),
        },
      }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [placements]);

  const onResize = useCallback((key: PlacementKey, e: React.PointerEvent) => {
    const isCharacter = (CHARACTER_KEYS as string[]).includes(key);
    const bounds =
      (isCharacter
        ? (e.currentTarget as HTMLElement).closest(".timeline-flood")
        : (e.currentTarget as HTMLElement).closest(".timeline-step")) as
        | HTMLElement
        | null;
    if (!bounds) return;
    const rect = bounds.getBoundingClientRect();
    const startX = e.clientX;
    const origW = placements[key].w;

    const move = (ev: PointerEvent) => {
      const dw = ((ev.clientX - startX) / rect.width) * 100;
      setPlacements((p) => ({
        ...p,
        [key]: { ...p[key], w: clamp(origW + dw, 5, 100) },
      }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [placements]);

  const copyJson = async () => {
    try {
      const payload = Object.fromEntries(
        PLACEMENT_KEYS.map((k) => [k, placements[k]])
      );
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const stepEdit = (i: number): StepEditProps => ({
    placementKey: PLACEMENT_KEYS[i],
    placement: placements[PLACEMENT_KEYS[i]],
    editMode,
    selected: selected === PLACEMENT_KEYS[i],
    onSelect: setSelected,
    onDrag,
    onResize,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanupFns: Array<() => void> = [];

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
      gsap.set(".timeline-illu", { opacity: 0 });

      const applyContinuum = () => {
        const leaf = root.querySelector<HTMLElement>(".timeline-leaf");
        const seedLine = window.innerHeight / 2;
        const leafH = leaf ? leaf.offsetHeight : 0;
        const flood = root.querySelector<HTMLElement>(".timeline-flood");
        const floodH = flood ? Math.min(flood.offsetHeight / 2, window.innerHeight) : 0;
        const total = seedLine + leafH + floodH;

        gsap.set(
          [".timeline-progress", ".timeline-leaf-progress", ".timeline-flood-progress"],
          {
            backgroundSize: `100% ${total}px`,
            backgroundRepeat: "no-repeat",
          }
        );
        gsap.set(".timeline-progress", { backgroundPosition: "0px 0px" });
        gsap.set(".timeline-leaf-progress", {
          backgroundPosition: `0px ${-seedLine}px`,
        });
        gsap.set(".timeline-flood-progress", {
          backgroundPosition: `0px ${-(seedLine + leafH)}px`,
        });
      };
      applyContinuum();

      gsap.set(".timeline-flood-progress", { scaleY: 0, scaleX: 1, width: 6 });
      gsap.set(".timeline-flood-axis", { opacity: 1 });
      gsap.set(".flood-hero3", { opacity: editMode ? 1 : 0 });
      gsap.set(".flood-community", {
        opacity: editMode ? 1 : 0,
        y: editMode ? 0 : 36,
      });

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
            const illu = step.querySelector(".timeline-illu") as HTMLElement | null;
            const isLeft = step.dataset.side === "left";
            const dir = isLeft ? -56 : 56;

            gsap.set(step, { autoAlpha: 1 });

            const enter = Math.min(Math.max((p - cardIn) / 0.35, 0), 1);
            const enterE = 1 - Math.pow(1 - enter, 3);

            gsap.set(card, { opacity: enterE, x: dir * (1 - enterE) });
            gsap.set(dot, { scale: Math.max(enterE * lineP, 0.001) });
            if (illu) gsap.set(illu, { opacity: enterE });

            revealChars(title, enterE);
            revealChars(body, enterE);
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
        const illu = step.querySelector(".timeline-illu") as HTMLElement | null;
        const isLeft = step.dataset.side === "left";
        const dir = isLeft ? -56 : 56;
        const isLast = stepIndex === leafSteps.length - 1;

        ScrollTrigger.create({
          trigger: step,
          start: "top 75%",
          end: isLast ? "bottom top" : "center center",
          scrub: true,
          onUpdate: (self) => {
            if (!isLast) {
              const enter = self.progress;
              const enterE = 1 - Math.pow(1 - enter, 3);

              gsap.set(card, { opacity: enterE, x: dir * (1 - enterE) });
              gsap.set(dot, { scale: Math.max(enterE, 0.001) });
              if (illu) gsap.set(illu, { opacity: enterE });
              revealChars(title, enterE);
              revealChars(body, enterE);
              return;
            }

            const enter = Math.min(self.progress / 0.35, 1);
            const enterE = 1 - Math.pow(1 - enter, 3);
            const exit =
              self.progress > 0.55 ? (self.progress - 0.55) / 0.45 : 0;
            const exitE = exit * exit;
            const vis = enterE * (1 - exitE);

            gsap.set(card, {
              opacity: vis,
              x: dir * (1 - enterE) + dir * exitE * 0.7,
              y: exitE * -40,
            });
            gsap.set(dot, {
              scale: Math.max(vis, 0.001),
            });
            if (illu) gsap.set(illu, { opacity: vis });
            revealChars(title, vis);
            revealChars(body, vis);
          },
          onLeaveBack: () => {
            gsap.set(card, { opacity: 0, x: dir, y: 0 });
            gsap.set(dot, { scale: 0 });
            if (illu) gsap.set(illu, { opacity: 0 });
            revealChars(title, 0);
            revealChars(body, 0);
          },
          onLeave: () => {
            if (!isLast) return;
            gsap.set(card, { opacity: 0, x: dir * 0.7, y: -40 });
            gsap.set(dot, { scale: 0.001 });
            if (illu) gsap.set(illu, { opacity: 0 });
          },
        });
      });

      ScrollTrigger.create({
        trigger: ".timeline-flood",
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          applyContinuum();
          const p = self.progress;
          const growEnd = 0.48;
          const expandEnd = 0.62;

          const header = document.querySelector("header");
          if (p > 0.06) {
            header?.classList.remove("nav-on-light");
          } else {
            header?.classList.add("nav-on-light");
          }

          const hero3El = root.querySelector<HTMLElement>(".flood-hero3");
          const communityEl = root.querySelector<HTMLElement>(".flood-community");
          if (hero3El) {
            if (editMode) {
              hero3El.style.opacity = "1";
            } else {
              const reveal = Math.min(
                Math.max((p - expandEnd) / 0.12, 0),
                1
              );
              hero3El.style.opacity = String(reveal);
            }
          }

          const contentReveal = editMode
            ? 1
            : Math.min(Math.max((p - expandEnd - 0.04) / 0.14, 0), 1);
          const contentE = 1 - Math.pow(1 - contentReveal, 3);
          if (communityEl) {
            communityEl.style.opacity = String(contentE);
            communityEl.style.transform = `translateY(${(1 - contentE) * 36}px)`;
          }

          const lineP = Math.min(p / growEnd, 1);
          gsap.set(".timeline-flood-progress", { scaleY: lineP });

          if (p <= expandEnd) {
            const expand =
              p <= growEnd ? 0 : (p - growEnd) / (expandEnd - growEnd);
            const e = expand <= 0 ? 0 : Math.pow(expand, 3);
            const w = 6 + (window.innerWidth - 6) * e;
            const bh = p <= growEnd ? "100%" : "100%";

            gsap.set([".timeline-flood-axis", ".timeline-flood-progress"], {
              width: w,
              height: bh,
              top: 0,
              bottom: 0,
              left: "50%",
              xPercent: -50,
              scaleY: p <= growEnd ? lineP : 1,
              borderRadius: w <= 12 ? 999 : 0,
              opacity: 1,
            });
            gsap.set(".timeline-flood-axis", { opacity: Math.max(1 - e, 0) });
            return;
          }

          gsap.set([".timeline-flood-axis", ".timeline-flood-progress"], {
            width: window.innerWidth,
            height: "100%",
            top: 0,
            bottom: 0,
            left: "50%",
            xPercent: -50,
            scaleY: 1,
            borderRadius: 0,
            opacity: 1,
          });
          gsap.set(".timeline-flood-axis", { opacity: 0 });
          gsap.set(".timeline-flood-progress", { opacity: 1 });
        },
      });

      // Keep viewport-dependent pixel math fresh when the window is
      // resized or the browser toggles fullscreen.
      let resizeRaf = 0;
      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          applyContinuum();
          ScrollTrigger.update();
        });
      };
      window.addEventListener("resize", onResize);
      cleanupFns.push(() => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(resizeRaf);
      });
    }, root);

    return () => {
      cleanupFns.forEach((fn) => fn());
      ctx.revert();
    };
  }, [editMode]);

  return (
    <section
      ref={rootRef}
      id="how-it-works"
      className="relative text-black"
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
                <div className="timeline-start-dot size-5 rounded-full border-2 border-white bg-gradient-to-br from-[#FD9779] to-[#592AA8] shadow-lg" />
              </div>

              <div className="timeline-axis absolute bottom-0 left-1/2 top-1/2 z-0 w-1.5 -translate-x-1/2 rounded-full bg-black/15" />
              <div
                className="timeline-progress absolute bottom-0 left-1/2 top-1/2 z-0 w-1.5 origin-top -translate-x-1/2 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, #FD9779, #C74990, #592AA8)",
                }}
              />

              <div className="relative z-10 h-full">
                {renderStep(STEPS[0], 0, true, stepEdit(0))}
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-leaf relative">
          <div className="timeline-leaf-axis absolute inset-y-0 left-1/2 z-0 w-1.5 -translate-x-1/2 rounded-full bg-black/15" />
          <div
            className="timeline-leaf-progress absolute inset-y-0 left-1/2 z-0 w-1.5 origin-top -translate-x-1/2 rounded-full"
            style={{
              background: "linear-gradient(180deg, #FD9779, #C74990, #592AA8)",
            }}
          />
          {STEPS.slice(1).map((step, i) =>
            renderStep(step, i + 1, false, stepEdit(i + 1))
          )}
        </div>

        <div className="timeline-flood relative h-[200vh]">
          <div className="sticky top-0 h-screen overflow-hidden">
            <div className="timeline-flood-axis absolute inset-y-0 left-1/2 z-0 w-1.5 -translate-x-1/2 rounded-full bg-black/15" />
            <div className="timeline-flood-progress absolute inset-y-0 left-1/2 z-0 w-1.5 origin-top -translate-x-1/2 rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, #FD9779, #C74990, #592AA8)",
              }}
            />

            <div className="flood-hero3 pointer-events-none absolute inset-0 z-[1] opacity-0">
              <Image
                src="/hero 3.png"
                alt=""
                fill
                priority
                className="object-cover object-center"
                sizes="100vw"
              />
            </div>

            <div className="flood-community pointer-events-none absolute inset-0 z-[10] flex flex-col items-start justify-center px-6 opacity-0 text-left sm:px-12 md:px-20">
              <div className="w-full max-w-4xl">
                <p className="hero-eyebrow mb-4 text-xs font-medium uppercase tracking-[0.25em] text-white/60">
                  different minds · different skills · one future
                </p>

                <h1
                  className="hero-title font-semibold tracking-tight text-white"
                  style={{ lineHeight: 1 }}
                >
                  <span className="hero-title-line block text-7xl sm:text-8xl md:text-9xl">
                    Where Ideas
                  </span>
                  <span
                    className="hero-title-line block bg-clip-text text-transparent text-7xl sm:text-8xl md:text-9xl"
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

                <p className="hero-sub mt-6 max-w-xl text-lg font-light text-white/75 sm:text-xl">
                  Bring your perspective. Find people who think differently.
                  Build something none of you could have built alone.
                </p>

                <div className="hero-cta pointer-events-auto mt-8">
                  <button className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105">
                    Explore the community →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="fixed right-4 bottom-4 z-[100] w-72 rounded-2xl border border-white/10 bg-black/90 p-4 text-white shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold tracking-[0.18em] text-white/60 uppercase">
              Placement
            </div>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70 hover:bg-white/20"
            >
              Esc 5
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {ILLUSTRATION_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                className={`rounded-full px-2.5 py-1 text-[11px] capitalize transition ${
                  selected === k
                    ? "bg-gradient-to-r from-[#FD9779] to-[#592AA8] text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(["x", "y", "w", "rot"] as const).map((field) => (
              <label key={field} className="flex flex-col gap-1 text-[10px] text-white/50 uppercase">
                {field}
                <input
                  type="number"
                  value={Math.round(placements[selected][field] * 10) / 10}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isNaN(v)) return;
                    setPlacements((p) => ({
                      ...p,
                      [selected]: {
                        ...p[selected],
                        [field]:
                          field === "w"
                            ? clamp(v, 5, 100)
                            : field === "rot"
                              ? clamp(v, -180, 180)
                              : clamp(v, 0, 100),
                      },
                    }));
                  }}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-xs text-white outline-none focus:border-[#FD9779]"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={copyJson}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#FD9779] to-[#592AA8] py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <p className="mt-2 text-[10px] leading-relaxed text-white/40">
              Drag image · corner handle to resize · press 5 to toggle
            </p>
        </div>
      )}
    </section>
  );
}
