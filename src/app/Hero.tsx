"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Avatar21 from "@/components/avatar21";

const ORBIT_SIZES = ["40vmin", "65vmin", "95vmin", "130vmin", "170vmin"];
const ORBIT_OPACITY = [1, 0.75, 0.5, 0.28, 0.07];

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [orbitX, setOrbitX] = useState(413);
  const [orbitY, setOrbitY] = useState(0);
  const [orbitZoom, setOrbitZoom] = useState(0.74);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".hero-globe-inner",
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 1.6 },
          0
        )
        .fromTo(
          ".hero-bg",
          { opacity: 0 },
          { opacity: 1, duration: 1.4 },
          0
        )
        .fromTo(
          ".hero-eyebrow",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.8 },
          0.3
        )
        .fromTo(
          ".hero-title",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1 },
          0.4
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.9 },
          0.65
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 },
          0.9
        )
        .fromTo(
          ".orbit",
          { opacity: 0, scale: 0.9 },
          {
            opacity: (i: number) => ORBIT_OPACITY[i],
            scale: 1,
            duration: 1.4,
            stagger: 0.15,
          },
          0.3
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative h-screen w-full overflow-hidden bg-[#05050a]"
    >
      <div className="hero-bg absolute inset-0 opacity-0">
        <Image
          src="/nebg.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      <div
        className="absolute inset-0"
        style={{ transform: "translate(75px, 20px)" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="hero-globe-inner relative aspect-square w-full max-w-none opacity-0">
            <Image
              src="/hero-globe.png"
              alt=""
              fill
              priority
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `translate(${orbitX}px, ${orbitY}px) scale(${orbitZoom})`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {ORBIT_SIZES.map((size, i) => (
            <div
              key={size}
              className="orbit absolute rounded-full border border-white/20"
              style={{
                width: size,
                height: size,
                opacity: ORBIT_OPACITY[i],
                boxShadow: "0 0 20px rgba(120,160,255,0.08) inset",
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-start justify-end px-6 pb-24 text-left sm:px-12 md:px-20"
      >
        <p className="hero-eyebrow mb-4 text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          students &middot; projects &middot; experience
        </p>
        <h1
          className="hero-title font-semibold tracking-tight text-white"
          style={{ lineHeight: 1 }}
        >
          <span className="block text-7xl sm:text-8xl md:text-9xl">
            Tomorrow,
          </span>
          <span
            className="block bg-clip-text text-transparent text-7xl sm:text-8xl md:text-9xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #FF7F9B, #F89A9A, #D7A7FF)",
              lineHeight: 1.15,
              paddingBottom: "0.1em",
            }}
          >
            Together.
          </span>
        </h1>
        <p className="hero-sub mt-8 max-w-xl text-lg font-light text-white/75 sm:text-xl">
          Join a community of students building their future, one project at a
          time.
        </p>
        <div className="hero-cta mt-8 flex flex-col gap-4 sm:flex-row">
          <button className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105">
            Get Started
          </button>
          <button className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
            Learn More
          </button>
        </div>
        <div className="hero-cta mt-6">
          <Avatar21 />
        </div>
      </div>

      <header className="absolute left-0 right-0 -top-2 z-20 flex items-center justify-between px-6 sm:px-8">
        <Image
          src="/logo.png"
          alt="Collivio logo"
          width={120}
          height={40}
          priority
          className="h-auto w-24 sm:w-28 md:w-32"
        />
        <nav className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-base font-medium text-white/80 sm:gap-8 sm:text-lg">
          <a href="#" className="transition-colors hover:text-white">
            Home
          </a>
          <a href="#" className="transition-colors hover:text-white">
            About
          </a>
          <a href="#" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#" className="transition-colors hover:text-white">
            Contact
          </a>
        </nav>
        <a
          href="#"
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
        >
          Get Started
        </a>
      </header>

      <div className="absolute bottom-6 right-6 z-20 w-56 rounded-2xl border border-white/15 bg-black/70 p-4 backdrop-blur-md">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-white/50">
          Orbits
        </div>
        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
          <span>X</span>
          <span className="font-mono">{orbitX}px</span>
        </div>
        <input
          type="range"
          min={-1500}
          max={1500}
          step={1}
          value={orbitX}
          onChange={(e) => setOrbitX(parseInt(e.target.value))}
          className="mb-3 w-full accent-white"
        />
        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
          <span>Y</span>
          <span className="font-mono">{orbitY}px</span>
        </div>
        <input
          type="range"
          min={-1500}
          max={1500}
          step={1}
          value={orbitY}
          onChange={(e) => setOrbitY(parseInt(e.target.value))}
          className="mb-3 w-full accent-white"
        />
        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
          <span>Zoom</span>
          <span className="font-mono">{orbitZoom.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={3}
          step={0.01}
          value={orbitZoom}
          onChange={(e) => setOrbitZoom(parseFloat(e.target.value))}
          className="w-full accent-white"
        />
      </div>
    </div>
  );
}
