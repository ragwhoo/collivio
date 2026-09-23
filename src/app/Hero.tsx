"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Hammer, Users, TrendingUp, Sprout } from "lucide-react";
import Avatar21 from "@/components/avatar21";

const ORBIT_SIZES = ["40vmin", "65vmin", "95vmin", "130vmin", "170vmin"];
const ORBIT_OPACITY = [1, 0.75, 0.5, 0.28, 0.07];

const ORBIT_CARDS = [
  { label: "Build projects", icon: Hammer, orbit: 2, angle: 30 },
  { label: "Meet people", icon: Users, orbit: 2, angle: 210 },
  { label: "Gain experience", icon: TrendingUp, orbit: 3, angle: 155 },
  { label: "Grow together", icon: Sprout, orbit: 2, angle: 310 },
] as const;

const ORBIT_BALLS = [
  { orbit: 1, angle: 45, color: "#FF7F9B" },
  { orbit: 3, angle: 200, color: "#F89A9A" },
  { orbit: 2, angle: 340, color: "#D7A7FF" },
] as const;

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [orbitX] = useState(413);
  const [orbitY] = useState(0);
  const [orbitZoom] = useState(0.74);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".hero-globe-inner",
          { opacity: 0, filter: "blur(24px)" },
          { opacity: 1, filter: "blur(0px)", duration: 1.1 },
          0
        )
        .fromTo(
          ".hero-eyebrow",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5 },
          0.25
        )
        .fromTo(
          ".hero-title-line",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.22 },
          0.55
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.55 },
          1.2
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 },
          1.6
        )
        .fromTo(
          ".nav-logo",
          { opacity: 0, y: -16 },
          { opacity: 1, y: 0, duration: 0.5 },
          2.0
        )
        .fromTo(
          ".nav-item",
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 },
          2.15
        )
        .fromTo(
          ".nav-cta",
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: "transform" },
          2.4
        )
        .fromTo(
          ".orbit",
          { opacity: 0, scale: 0.9 },
          {
            opacity: (i: number) => ORBIT_OPACITY[i],
            scale: 1,
            duration: 1.0,
            stagger: 0.1,
          },
          0.2
        )
        .fromTo(
          ".orbit-pill",
          { opacity: 0, scale: 0.8, rotation: (i: number) => 35 + i * 30 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: (i: number) => 0.9 + i * 0.25,
            ease: "power2.out",
            stagger: 0.06,
          },
          0.7
        )
        .fromTo(
          ".orbit-ball",
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 },
          0.9
        )
        .fromTo(
          ".orbit-revolve-ball",
          { rotation: (i: number) => -40 - i * 25 },
          {
            rotation: 0,
            duration: (i: number) => 0.85 + i * 0.2,
            ease: "power2.out",
            stagger: 0.06,
          },
          0.7
        )
        .fromTo(
          ".orbit-revolve-pill",
          { rotation: (i: number) => -35 - i * 30 },
          {
            rotation: 0,
            duration: (i: number) => 0.9 + i * 0.25,
            ease: "power2.out",
            stagger: 0.06,
          },
          0.7
        )
        .fromTo(
          ".orbit-glow",
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" },
          0.55
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <>
    <div
      ref={rootRef}
      className="relative h-screen w-full overflow-hidden"
    >
      <div
        className="absolute inset-0 z-[3]"
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
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          transform: `translate(${orbitX}px, ${orbitY}px) scale(${orbitZoom})`,
        }}
      >
        <div className="orbit-system absolute inset-0 flex items-center justify-center">
          <div
            className="orbit-glow pointer-events-none absolute size-[45vmin] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,127,155,0.7) 0%, rgba(248,154,154,0.45) 35%, rgba(215,167,255,0.2) 60%, transparent 75%)",
              boxShadow:
                "0 0 100px 40px rgba(255,127,155,0.45), 0 0 180px 80px rgba(215,167,255,0.25)",
              filter: "blur(12px)",
              opacity: 0,
            }}
          />
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
          {ORBIT_BALLS.map(({ orbit, angle, color }) => {
            const radiusMatch = ORBIT_SIZES[orbit].match(/^(\d+(?:\.\d+)?)vmin$/);
            const radius = radiusMatch ? parseFloat(radiusMatch[1]) / 2 : 0;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <div
                key={`${orbit}-${angle}`}
                className="orbit-revolve-ball absolute inset-0"
              >
                <div
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}vmin)`,
                    top: `calc(50% + ${y}vmin)`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="orbit-ball size-3 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 12px 4px ${color}, 0 0 28px 8px ${color}66`,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {ORBIT_CARDS.map(({ label, icon: Icon, orbit, angle }) => {
            const radiusMatch = ORBIT_SIZES[orbit].match(/^(\d+(?:\.\d+)?)vmin$/);
            const radius = radiusMatch ? parseFloat(radiusMatch[1]) / 2 : 0;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <div
                key={label}
                className="orbit-revolve-pill absolute inset-0"
              >
                <div
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}vmin)`,
                    top: `calc(50% + ${y}vmin)`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="orbit-pill flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md"
                    style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
                  >
                    <Icon className="size-4 shrink-0 text-white/90" strokeWidth={2} />
                    <span className="whitespace-nowrap text-xs font-medium text-white sm:text-sm">
                      {label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="absolute inset-0 z-10 flex flex-col items-start justify-end px-6 pb-24 text-left sm:px-12 md:px-20"
      >
        <p className="hero-eyebrow mb-4 text-xs font-medium uppercase tracking-[0.25em] text-white/60 opacity-0">
          students   ·   projects   ·   experience
        </p>
        <h1
          className="hero-title font-semibold tracking-tight text-white"
          style={{ lineHeight: 1 }}
        >
          <span className="hero-title-line block text-7xl opacity-0 sm:text-8xl md:text-9xl">
            Tomorrow,
          </span>
          <span
            className="hero-title-line block bg-clip-text text-transparent text-7xl opacity-0 sm:text-8xl md:text-9xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #FF7F9B, #F89A9A, #D7A7FF)",
              lineHeight: 1.25,
              paddingBottom: "0.15em",
              marginTop: "-0.28em",
              overflow: "visible",
            }}
          >
            Together.
          </span>
        </h1>
        <p className="hero-sub mt-3 max-w-xl text-lg font-light text-white/75 opacity-0 sm:text-xl">
          Join a community of students building their future, one project at a
          time.
        </p>
        <div className="hero-cta mt-8 flex flex-col gap-4 opacity-0 sm:flex-row">
          <button className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105">
            Get Started
          </button>
          <button className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
            Learn More
          </button>
        </div>
        <div className="hero-cta mt-6 opacity-0">
          <Avatar21 />
        </div>
      </div>

      <header className="fixed left-0 right-0 -top-2 z-50 flex items-center justify-between px-6 pb-3 sm:px-8">
        <div className="nav-logo relative h-auto w-24 opacity-0 sm:w-28 md:w-32">
          <Image
            src="/logo.png"
            alt="Collivio logo"
            width={120}
            height={40}
            priority
            className="nav-logo-light h-auto w-full"
          />
          <Image
            src="/logo dark.png"
            alt="Collivio logo"
            width={120}
            height={40}
            className="nav-logo-dark absolute inset-0 h-auto w-full"
          />
        </div>
        <nav className="nav-links absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-base font-medium text-white/80 sm:gap-8 sm:text-lg">
          <a href="#" className="nav-item opacity-0 transition-colors hover:text-white">
            Home
          </a>
          <a href="#" className="nav-item opacity-0 transition-colors hover:text-white">
            About
          </a>
          <a href="#features" className="nav-item opacity-0 transition-colors hover:text-white">
            Features
          </a>
          <a href="#" className="nav-item opacity-0 transition-colors hover:text-white">
            Contact
          </a>
        </nav>
        <a href="#" className="nav-cta group relative opacity-0">
          <span className="nav-cta-pill block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-all duration-200 group-hover:scale-105">
            Get Started
          </span>
        </a>
      </header>
    </div>
    </>
  );
}
