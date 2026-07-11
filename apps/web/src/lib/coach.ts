// Presentatie-helpers voor de door de gebruiker instelbare coach-naam + user-naam
// (settings.coachNaam / settings.naam — GEEN engine-input). GEDEELD door de AppShell-header
// (§1) en de coach-impact-box-kop (§6), zodat de "Coach"-default op ÉÉN plek leeft.

/** Woordmerk/kop-naam: getrimde coachNaam of de "Coach"-default, UPPERCASE. */
export function displayCoach(coachNaam: string | null | undefined): string {
  return (coachNaam?.trim() || "Coach").toUpperCase();
}

/**
 * Avatar-initialen uit de user-naam: ≥2 woorden → eerste letter van de eerste twee
 * woorden; 1 woord → de eerste twee letters; leeg/null → "". Altijd UPPERCASE.
 * ("Daan Korteweg"→"DK", "Merckx"→"ME", ""→"").
 */
export function initials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
