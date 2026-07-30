import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { ImageRef } from "@/lib/content";

/**
 * True when the file referenced by a YAML `src` actually exists under public/.
 * Runs on the server at build time, so a missing file degrades to a placeholder
 * instead of throwing during static generation.
 */
export function imageExists(src: string): boolean {
  if (!src) return false;
  const relative = src.replace(/^\/+/, "");
  return fs.existsSync(path.join(process.cwd(), "public", relative));
}

type FigureProps = {
  image: ImageRef;
  sizes: string;
  /** Shown inside the placeholder while the real file is missing. */
  pendingLabel: string;
  priority?: boolean;
};

/**
 * Renders the image when the file exists, and a placeholder filling the same
 * box when it does not. The parent element controls dimensions, so dropping a
 * real file at the YAML path swaps it in with no layout shift.
 */
export function Figure({ image, sizes, pendingLabel, priority = false }: FigureProps) {
  if (imageExists(image.src)) {
    return (
      <div className="figure">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className="figure">
      <div className="figure-placeholder" role="img" aria-label={image.alt}>
        <span className="mark" aria-hidden="true" />
        <span className="caption">{image.alt}</span>
        <span className="path" aria-hidden="true">
          {pendingLabel}: {image.src}
        </span>
      </div>
    </div>
  );
}
