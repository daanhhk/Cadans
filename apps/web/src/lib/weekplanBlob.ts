/**
 * weekplanBlob — serialisatie van het voorstel naar de GAS-blob-vorm (het plan-van-record).
 *
 * Doel: `weekplans.entries_json` in D1 draagt exact de vorm die de bevroren GAS in
 * DocProp `weekplan_<maandag>` zet (Algorithm.gs:238-256; zie docs/PLAN-VAN-RECORD-RECON.md §4.2).
 * Dat is de ENIGE durabele plan-van-record — kolom G en `proposal_<datum>` worden gewist
 * (cleanupOldProposals_, Algorithm.gs:723).
 *
 * Per dag met sessies één entry; dagen zónder sessies leveren GEEN entry (GAS:
 * `if (!sessions.length) return;`). Voorbije dagen hebben geen sessies meer en worden
 * daarom door de worker-freeze uit de bestaande blob behouden, niet door deze serializer.
 */
import { ensureIntent_ } from "@cadans/engine";
import type { ProposalDay, ProposalWeek, ProposalWorkout } from "./proposal";

/** Zone-buckets in de vaste GAS-volgorde. */
const BUCKETS = ["low", "high", "anaerobic"] as const;
type Bucket = (typeof BUCKETS)[number];

/** Eén weekplan-entry (de GAS-aggregaat-vorm, Algorithm.gs:238-256). */
export interface WeekplanEntry {
  datum: string; // yyyy-MM-dd
  workoutType: string | null;
  archetypeId: string | null;
  naam: string;
  variantId: string | null;
  zones: string[];
  intent: Record<Bucket, number>;
  blokken: unknown[] | null;
  structuur: unknown[] | null;
  tss: number;
  minuten: number;
  reden: string;
  sessies: WeekplanSessie[];
}

export interface WeekplanSessie {
  naam: string;
  totaalMin: number;
  tss: number;
  intent: Record<Bucket, number>;
  eindopmerking: string;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

/**
 * 3a-VORM (BEWUSTE AFWIJKING van GAS' `ensureIntent_`).
 *
 * GAS draagt twee onafhankelijke velden: `zones` (bucket-SET) en `intent` (bucket-MINUTEN).
 * `intentZonesForDate_` (Algorithm.gs:278) leest de SET; Cadans heeft die functie niet geport
 * en leidt "bucket zit in de set" af uit `intent[bucket] > 0` — de aanname die
 * packages/engine/src/weekprep.ts:12-16 expliciet declareert.
 *
 * Die aanname breekt op GAS' eigen `ensureIntent_`: die fabriceert voor élke workout zonder
 * eigen intent 55% low-minuten (`intent.low = total - per * workZones.length`), óók als
 * `zones` GEEN 'low' bevat (bv. zones:["high"] in planner.ts:1908). Cadans zou die dag dan
 * als low-gedekt tellen waar GAS dat niet doet.
 *
 * Daarom nullen we hier elke bucket die niet in `zones` zit. Zo geldt weer
 * `intent[b] > 0 ⇔ b ∈ zones` en klopt de engine-aanname zonder de engine aan te raken.
 * Gevolg: de blob is NIET byte-gelijk aan een GAS-export — de migratie-import transformeert
 * de GAS-blobs (docs/PLAN-VAN-RECORD-RECON.md §3a, optie B).
 */
export function zeroIntentOutsideZones(
  intent: Record<string, unknown>,
  zones: string[],
): Record<Bucket, number> {
  const inZones = new Set(zones);
  const out = { low: 0, high: 0, anaerobic: 0 } as Record<Bucket, number>;
  for (const b of BUCKETS) if (inZones.has(b)) out[b] = num(intent[b]);
  return out;
}

/** Eén sessie → de `sessies[]`-vorm (GAS Algorithm.gs:253). */
function sessieFrom(s: ProposalWorkout): WeekplanSessie {
  const zones = Array.isArray(s.zones) ? s.zones.map(String) : [];
  return {
    naam: typeof s.naam === "string" ? s.naam : "",
    totaalMin: Math.round(num(s.totaalMin)),
    tss: Math.round(num(s.tss)),
    intent: zeroIntentOutsideZones(
      ensureIntent_(s) as Record<string, unknown>,
      zones,
    ),
    eindopmerking: typeof s.eindopmerking === "string" ? s.eindopmerking : "",
  };
}

/**
 * Eén voorstel-dag → één weekplan-entry, of null als de dag geen sessies draagt.
 * Aggregatie 1:1 met GAS (Algorithm.gs:217-256): minuten/tss/intent gesommeerd,
 * zones/blokken/structuur samengevoegd, naam samengevat bij meerdere sessies.
 */
export function entryFromDay(
  d: ProposalDay,
  doel: string | null,
): WeekplanEntry | null {
  const sessions = d.sessions || [];
  if (!sessions.length) return null;

  let sumMin = 0;
  let sumTss = 0;
  const aggIntent: Record<Bucket, number> = { low: 0, high: 0, anaerobic: 0 };
  const aggBlok: unknown[] = [];
  const aggStruct: unknown[] = [];
  const zoneSet = new Set<string>();

  for (const s of sessions) {
    sumMin += num(s.totaalMin);
    sumTss += num(s.tss);
    const zones = Array.isArray(s.zones) ? s.zones.map(String) : [];
    // 3a: per sessie eerst nullen, dán sommeren — anders lekt de gefabriceerde
    // low alsnog het aggregaat in.
    const it = zeroIntentOutsideZones(
      ensureIntent_(s) as Record<string, unknown>,
      zones,
    );
    for (const b of BUCKETS) aggIntent[b] += it[b];
    if (Array.isArray(s.blokken)) for (const b of s.blokken) aggBlok.push(b);
    if (Array.isArray(s.structuur))
      for (const r of s.structuur) aggStruct.push(r);
    for (const z of zones) zoneSet.add(z);
  }

  // Aggregaat-naam (GAS Algorithm.gs:231-236): gelijke sessies → "Pendel N× <m>m";
  // gemengd (Z2 + engine) → mix-naam. Eén sessie → de sessie-naam zelf.
  const eersteNaam =
    typeof sessions[0].naam === "string" ? sessions[0].naam : "";
  let naam = eersteNaam;
  if (sessions.length > 1) {
    const namen = sessions.map((s) =>
      typeof s.naam === "string" ? s.naam : "",
    );
    const alleZelfde = namen.every((n) => n === namen[0]);
    naam = alleZelfde
      ? `Pendel ${sessions.length}× ${Math.round(num(sessions[0].totaalMin))}m`
      : `Pendel Z2 + ${doel ?? ""} intervallen`;
  }

  return {
    datum: d.datum,
    workoutType: d.voorgesteldType,
    // 1b (recency-seed) leest archetypeId + variantId uit de blob → ze MOETEN mee.
    // GEMETEN (laag 1a): `variantId` wordt gevuld (bv. "ss_2x20", "z2_cadans"), maar
    // `archetypeId` is in de huidige engine STRUCTUREEL null — `keyIntensity` zet 'm nog
    // niet (planner.ts:1455 "INERT tot keyIntensity een archetypeId zet (commit 2)").
    // De blob draagt het veld dus wél, met waarde null. Laag 1b moet daarop rekenen: een
    // recency-seed die alléén op archetypeId matcht, blijft leeg tot die engine-commit
    // landt; `variantId` is nu de enige bruikbare rotatie-sleutel. GEFLAGD, niet opgelost
    // (engine is read-only in 1a).
    archetypeId: d.archetypeId ?? strOrNull(sessions[0].archetypeId),
    naam,
    variantId: strOrNull(sessions[0].variantId),
    zones: Array.from(zoneSet),
    intent: aggIntent,
    blokken: aggBlok.length ? aggBlok : null,
    structuur: aggStruct.length ? aggStruct : null,
    tss: Math.round(sumTss),
    minuten: Math.round(sumMin),
    reden: d.reden ?? "",
    sessies: sessions.map(sessieFrom),
  };
}

/** Het hele voorstel → de entries van die week (dagen zonder sessies vallen weg). */
export function buildWeekplanEntries(
  week: ProposalWeek,
  doel: string | null,
): WeekplanEntry[] {
  const out: WeekplanEntry[] = [];
  for (const d of week.days || []) {
    const e = entryFromDay(d, doel);
    if (e) out.push(e);
  }
  return out;
}

/** De 7 ISO-datums van de week die op `mondayISO` begint (lokale kalender). */
export function weekDatesFrom(mondayISO: string): string[] {
  const [y, m, d] = mondayISO.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(y, (m || 1) - 1, (d || 1) + i);
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    out.push(`${dt.getFullYear()}-${mm}-${dd}`);
  }
  return out;
}

/**
 * V14-INVARIANT (7 rijen). `dagIdx` is POSITIONEEL (proposal.ts: `.map((pd, i) => ...)`),
 * dus een blob→grid-terugvertaling die minder dan zeven posities levert, schuift alle
 * volgende dagen op en wijst het plan naar de verkeerde dag. Deze helper dwingt dat af:
 * altijd exact zeven posities, op datum uitgelijnd, ontbrekende dagen expliciet null.
 * Entries buiten de week worden genegeerd (het recent-venster draagt 8 weken).
 */
export function entriesToWeekSlots(
  entries: unknown[],
  mondayISO: string,
): (WeekplanEntry | null)[] {
  const byDate = new Map<string, WeekplanEntry>();
  for (const raw of entries || []) {
    const e = raw as Partial<WeekplanEntry> | null;
    if (!e || typeof e.datum !== "string") continue;
    byDate.set(e.datum, e as WeekplanEntry);
  }
  const slots = weekDatesFrom(mondayISO).map((iso) => byDate.get(iso) ?? null);
  if (slots.length !== 7) {
    throw new Error(
      `weekplan-slots: verwacht 7 posities, kreeg ${slots.length}`,
    );
  }
  return slots;
}

/**
 * DEDUP-vergelijking: zijn de NIET-BEVROREN dagen (vandaag/toekomst) van `next` gelijk
 * aan wat er al ligt? Het verleden telt niet mee — dat bevriest de worker toch
 * (Algorithm.gs:185 snapshotDayAction_). Gelijk → PUT overslaan.
 */
export function sameForwardEntries(
  next: WeekplanEntry[],
  stored: unknown[],
  todayISO: string,
): boolean {
  const fwd = (e: { datum?: unknown }) =>
    typeof e?.datum === "string" && e.datum >= todayISO;
  const a = next.filter(fwd);
  const b = (stored || [])
    .filter((e): e is WeekplanEntry => fwd(e as { datum?: unknown }))
    .map((e) => e);
  if (a.length !== b.length) return false;
  const key = (e: unknown) => JSON.stringify(e);
  const bByDate = new Map(b.map((e) => [e.datum, key(e)]));
  for (const e of a) {
    if (bByDate.get(e.datum) !== key(e)) return false;
  }
  return true;
}
