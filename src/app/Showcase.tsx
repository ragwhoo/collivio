"use client";

import { useRef } from "react";

export default function Showcase() {
  const rootRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={rootRef}
      id="showcase"
      className="relative flex h-[12vh] items-center justify-center overflow-hidden"
    />
  );
}
