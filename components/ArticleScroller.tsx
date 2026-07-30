"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Horizontal article rail: drag to scroll with a pointer, plus a slow automatic
 * drift that reverses at each end. The drift pauses on hover, during a drag,
 * on narrow screens, and under prefers-reduced-motion.
 */
export function ArticleScroller({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;

    let dragging = false;
    let paused = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      startX = event.clientX;
      startScroll = scroller.scrollLeft;
      scroller.classList.add("dragging");
      scroller.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      scroller.scrollLeft = startScroll - (event.clientX - startX) * 1.2;
    };
    const endDrag = () => {
      dragging = false;
      scroller.classList.remove("dragging");
    };
    const onEnter = () => (paused = true);
    const onLeave = () => {
      paused = false;
      endDrag();
    };

    scroller.addEventListener("pointerdown", onPointerDown);
    scroller.addEventListener("pointermove", onPointerMove);
    scroller.addEventListener("pointerup", endDrag);
    scroller.addEventListener("pointercancel", endDrag);
    scroller.addEventListener("mouseenter", onEnter);
    scroller.addEventListener("mouseleave", onLeave);

    // The rail only needs a "drag sideways" hint when there is actually
    // something off-screen. With few articles on a wide viewport everything
    // fits, and the hint would be telling the reader about content that
    // does not exist.
    const section = scroller.closest(".writing") as HTMLElement | null;
    const syncScrollable = () => {
      if (!section) return;
      const overflows = scroller.scrollWidth > scroller.clientWidth + 4;
      section.dataset.scrollable = String(overflows);
    };
    syncScrollable();
    const resizeObserver = new ResizeObserver(syncScrollable);
    resizeObserver.observe(scroller);

    // In a right-to-left scroller the start is scrollLeft 0 and scrolling
    // onward drives it negative, so raw comparisons against a positive max
    // never fire. Measuring distance travelled works in both directions.
    const rtl = getComputedStyle(scroller).direction === "rtl";

    // Guarantee the rail opens at the reader's starting edge — scrollLeft 0 is
    // the start in both writing directions (it runs negative from there in
    // RTL). Assigned directly rather than via scrollIntoView: that method also
    // scrolls ancestors on the block axis, which dragged the whole page down to
    // the rail on load.
    scroller.scrollLeft = 0;

    let timer: ReturnType<typeof setInterval> | undefined;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let direction = 1;
      timer = setInterval(() => {
        if (paused || dragging || window.innerWidth < 700) return;
        const max = scroller.scrollWidth - scroller.clientWidth;
        const travelled = Math.abs(scroller.scrollLeft);
        if (travelled >= max - 5) direction = -1;
        if (travelled <= 5) direction = 1;
        scroller.scrollBy({
          left: direction * 260 * (rtl ? -1 : 1),
          behavior: "smooth",
        });
      }, 4200);
    }

    return () => {
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointermove", onPointerMove);
      scroller.removeEventListener("pointerup", endDrag);
      scroller.removeEventListener("pointercancel", endDrag);
      scroller.removeEventListener("mouseenter", onEnter);
      scroller.removeEventListener("mouseleave", onLeave);
      resizeObserver.disconnect();
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="article-scroller" ref={ref} role="region" aria-label={label}>
      <div className="article-track">{children}</div>
    </div>
  );
}
