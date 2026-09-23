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

    gsap.set(".fixed-bg-image", { opacity: 0, filter: "blur(0px)", scale: 1 });
    gsap.set(".fixed-bg-white", { opacity: 0, background: "transparent" });

    const intro = gsap.to(".fixed-bg-image", {
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
        gsap.set(".fixed-bg-image", {
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
          gsap.set(".fixed-bg-white", { opacity: 0, background: "transparent" });
        } else {
          gsap.set(".fixed-bg-white", {
            opacity: 1,
            background: `radial-gradient(circle at 50% 100%, #fff 0%, #fff ${r}%, transparent ${Math.min(r + 12, 150)}%)`,
          });
        }
      },
      onLeaveBack: () => {
        gsap.set(".fixed-bg-white", { opacity: 0, background: "transparent" });
        gsap.set(".fixed-bg-image", { filter: "blur(0px)", scale: 1 });
        document.querySelector("header")?.classList.remove("nav-on-light");
      },
    });

    return () => {
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
    </div>
  );
}
