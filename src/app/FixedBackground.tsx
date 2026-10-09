"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FixedBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const image = root.querySelector<HTMLElement>(".fixed-bg-image");
    const white = root.querySelector<HTMLElement>(".fixed-bg-white");
    const svg = root.querySelector<HTMLElement>(".fixed-bg-svg");
    if (!image || !white || !svg) return;

    gsap.set(image, { opacity: 0, filter: "blur(0px)", scale: 1 });
    gsap.set(white, { opacity: 0, background: "transparent" });
    gsap.set(svg, { opacity: 0 });

    const intro = gsap.to(image, {
      opacity: 1,
      duration: 1.4,
      ease: "power2.out",
    });

    const stWhite = ScrollTrigger.create({
      trigger: "#features",
      start: "top 35%",
      end: "top top",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const r = p * 140;
        gsap.set(image, {
          filter: `blur(${p * 24}px)`,
          scale: 1 + p * 0.08,
        });
        const header = document.querySelector("header");
        if (p > 0.45) {
          header?.classList.add("nav-on-light");
        } else {
          header?.classList.remove("nav-on-light");
        }
        if (p < 0.02) {
          gsap.set(white, { opacity: 0, background: "transparent" });
          gsap.set(svg, { opacity: 0 });
        } else {
          gsap.set(white, {
            opacity: 1,
            background: `radial-gradient(circle at 50% 100%, #fff 0%, #fff ${r}%, transparent ${Math.min(r + 12, 150)}%)`,
          });
          gsap.set(svg, { opacity: 1 });
        }
      },
      onLeaveBack: () => {
        gsap.set(white, { opacity: 0, background: "transparent" });
        gsap.set(svg, { opacity: 0 });
        gsap.set(image, { filter: "blur(0px)", scale: 1 });
        document.querySelector("header")?.classList.remove("nav-on-light");
      },
    });

    // Re-evaluate progress-driven values after a resize/fullscreen toggle.
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => ScrollTrigger.update());
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(resizeRaf);
      intro.kill();
      stWhite.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05050a]"
      aria-hidden
    >
      <div className="fixed-bg-image absolute inset-0">
        <Image
          src="/nebg.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="fixed-bg-white absolute inset-0" />
      <div className="fixed-bg-svg absolute inset-0 bg-[url('/bg.svg')] bg-cover bg-center bg-no-repeat" />
    </div>
  );
}
