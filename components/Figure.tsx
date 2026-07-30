import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { ImageRef } from "@/lib/content";

/**
 * True when the file referenced by a YAML `src` actually exists under public/.
 * Runs at build time on the server, so a missing file degrades to a placeholder
 * instead of throwing during static generation.
 */
export function imageExists(src: string): boolean {
  if (!src) return false;
  const relative = src.replace(/^\/+/, "");
  return fs.existsSync(path.join(process.cwd(), "public", relative));
}

type FigureProps = {
  image: ImageRef;
  /** CSS aspect-ratio value, e.g. "4 / 5". Reserves layout space either way. */
  ratio: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/**
 * Renders an image when the file exists, and a placeholder holding the exact
 * same box when it does not. Dropping a real file at the YAML path swaps it in
 * with no layout shift.
 */
export function Figure({
  image,
  ratio,
  sizes,
  className,
  priority = false,
}: FigureProps) {
  const exists = imageExists(image.src);

  return (
    <div
      className={`figure${className ? ` ${className}` : ""}`}
      style={{ aspectRatio: ratio }}
    >
      {exists ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="figure__img"
        />
      ) : (
        <div className="figure__placeholder" role="img" aria-label={image.alt}>
          <span className="figure__mark" aria-hidden="true" />
          <span className="figure__caption">{image.alt}</span>
          <span className="figure__path" aria-hidden="true">
            {image.src}
          </span>
        </div>
      )}
    </div>
  );
}
