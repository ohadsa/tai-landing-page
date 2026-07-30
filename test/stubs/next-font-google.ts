// next/font/google is rewritten by Next.js's SWC transform at build time and is
// not callable in a plain Vitest environment. These tests assert on metadata,
// not on font loading, so the loader is stubbed with the shape layout.tsx uses.
type FontResult = {
  className: string;
  variable: string;
  style: { fontFamily: string };
};

const stub = (family: string) => (): FontResult => ({
  className: `stub-${family.toLowerCase()}`,
  variable: `--font-${family.toLowerCase()}`,
  style: { fontFamily: family },
});

export const Geist = stub("Geist");
export const Geist_Mono = stub("GeistMono");
