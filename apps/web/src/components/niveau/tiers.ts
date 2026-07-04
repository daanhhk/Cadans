// W/kg-tier-tabel — EXACT uit design/src/niveau.jsx `TIERS`. De design heeft de
// /50-niveau-taal (engine `niveauTier_`) VERLATEN; W/kg + deze tiers zijn de enige
// niveau-taal. tierIndex = de eerste grens die de W/kg onderschrijdt.
export const TIERS: { label: string; max: number }[] = [
  { label: "Beginner", max: 2.5 },
  { label: "Recreatief", max: 3.0 },
  { label: "Getraind", max: 3.5 },
  { label: "Gevorderd", max: 4.1 },
  { label: "Zeer goed", max: 4.8 },
  { label: "Elite", max: 99 },
];

export function tierIndex(wkg: number): number {
  const i = TIERS.findIndex((t) => wkg < t.max);
  return i === -1 ? TIERS.length - 1 : i;
}
