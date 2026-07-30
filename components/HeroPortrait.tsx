"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Applies a small parallax drift to the hero portrait as the page scrolls.
 * Skipped entirely under prefers-reduced-motion.
 */
export function HeroPortrait({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Below the desktop breakpoint the portrait sits in the single-column flow.
    // Nudging it on scroll there just fights the reader's own scrolling and
    // costs a transform every frame for no compositional gain.
    if (!window.matchMedia("(min-width: 981px)").matches) return;

    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.min(window.scrollY * 0.055, 38);
        element.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="portrait-shell" ref={ref}>
      {children}
    </div>
  );
}
