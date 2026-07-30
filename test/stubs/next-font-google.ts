// next/font/google is rewritten by Next.js's SWC transform at build time and is
// not callable in a plain Vitest environment. Tests here assert on rendered
// content and metadata, never on font loading, so the loaders are stubbed.
//
// Add an export here when layout.tsx starts using another Google font —
// otherwise the suite fails with "<FontName> is not a function".
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

export const Instrument_Serif = stub("InstrumentSerif");
export const Inter = stub("Inter");
export const Geist = stub("Geist");
export const Geist_Mono = stub("GeistMono");
