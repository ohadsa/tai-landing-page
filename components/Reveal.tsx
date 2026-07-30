"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /**
   * Position within a group. Exposed to CSS as `--i` so the stylesheet owns the
   * stagger timing; the delay is capped there so long lists never crawl.
   */
  index?: number;
};

/**
 * Fades content up once as it scrolls into view, then leaves it alone.
 *
 * Deliberately one-shot rather than scroll-linked. A scroll-driven reveal is
 * bidirectional — scrolling back up replays every section — which reads as
 * restless on a site meant for reading. Continuous effects that genuinely
 * benefit from scroll linkage live in the `@supports (animation-timeline)`
 * layer in globals.css instead.
 *
 * The hidden starting state is applied by CSS only under `html.js`, so with
 * JavaScript disabled the content renders plainly visible rather than being
 * stranded at opacity 0.
 */
export function Reveal({ children, className, index }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.12,
        // Start the reveal slightly after the element crosses the edge rather
        // than exactly at it — triggering on contact reads as premature,
        // because the element is still visually arriving.
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      // Index 0 is deliberately omitted: its delay is zero either way, and the
      // CSS falls back with var(--i, 0).
      style={
        index !== undefined && index > 0
          ? ({ "--i": index } as CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}
