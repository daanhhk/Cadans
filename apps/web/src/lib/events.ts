import type { EventItem } from "@cadans/shared";

// Samenvatting van de events-lijst voor de §10 Instellingen-ingang ("Doelen & events").
// Toont het totaal + (indien aanwezig) het eerstvolgende A-doel op lexicografisch kleinste
// datum (yyyy-MM-dd sorteert = chronologisch).
export function eventsSummary(events: EventItem[]): string {
  if (events.length === 0) return "Nog geen events";
  const n = events.length;
  const woord = n === 1 ? "event" : "events";
  const aEvents = events.filter((e) => e.prioriteit === "A");
  if (aEvents.length === 0) return `${n} ${woord}`;
  const a = aEvents.reduce((min, e) => (e.datum < min.datum ? e : min));
  return `${n} ${woord} · A-doel: ${a.naam ?? "(naamloos)"} (${a.datum})`;
}
