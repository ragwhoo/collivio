"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Smooth scrolling is only desirable on the marketing surfaces. On the
// authenticated app (and auth screens) it can fight native scrolling and
// leave pages stuck, so it is disabled there.
function useSmoothScrollEnabled() {
  const pathname = usePathname();
  if (!pathname) return true;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/dashboard")) return false;
  // All authenticated app routes live under these prefixes.
  const appPrefixes = [
    "/opportunities",
    "/research",
    "/media",
    "/communities",
    "/events",
    "/resources",
    "/students",
    "/applications",
    "/messages",
    "/bookmarks",
    "/notifications",
    "/profile",
    "/settings",
    "/business",
    "/admin",
    "/explore",
  ];
  if (appPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  return true;
}

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabled = useSmoothScrollEnabled();

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [enabled]);

  return <>{children}</>;
}