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
    gsap.set(".fixed-bg-white", { opacity: 0 });

    const intro = gsap.to(".fixed-bg-image", {
      opacity: 1,
      duration: 1.4,
      ease: "power2.out",
    });

    const st = ScrollTrigger.create({
      trigger: "#features",
      start: "top 35%",
      end: "top top",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(".fixed-bg-image", {
          filter: `blur(${p * 24}px)`,
          scale: 1 + p * 0.08,
        });
        gsap.set(".fixed-bg-white", { opacity: p });
      },
    });

    return () => {
      intro.kill();
      st.kill();
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

      <div className="fixed-bg-white absolute inset-0 bg-white" />
    </div>
  );
}
