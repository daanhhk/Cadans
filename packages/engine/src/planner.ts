/**
 * planner.ts — Core: assignWorkouts + generieke workouts + buildWorkout router
 * naar doel-specifieke libraries. 1:1 port of the PURE functions in
 * training/src/Algorithm.gs (the generator / allocator / builders).
 *
 * Zone-classificatie, TSS, DSL/ZWO en de doel-agnostische archetype-laag leven in
 * zusters (./zones, ./archetypes, ./coach, ./workouts/*, ./niveau) en worden
 * geïmporteerd — nooit her-geport. Logger.log → console.debug. Utilities.formatDate
 * (…,'Europe/Amsterdam',fmt) → formatDate(x, fmt). mesoFactor (utils) is de pure
 * variant (de loadCarry-DocProp-demping is uit-geport in utils).
 *
 * DATA-IN: gatherWeekplanEntries_(horizonWeeks, baseMonday, readWeekplan) — de
 * PropertiesService-read is vervangen door de injecteerbare readWeekplan-accessor
 * (key → reeds-geparste array | null). assignWorkouts geeft null door (untested pad).
 */

import {
  ARCHETYPES,
  expandArchetype_,
  goalWorkout_,
  profileForDoel_,
  recencyFromWeekplan_,
} from "./archetypes";
import { intentFromType_ } from "./coach";
import { segmentsFromBlokken_ } from "./niveau";
import {
  bpmBelow,
  bpmRange,
  formatDate,
  mesoFactor,
  stripTime_,
  watts,
  wattsRange,
  weekStartDate,
} from "./utils";
import { climbPools_, workoutForBeklimmingen } from "./workouts/beklimmingen";
import { conditiePools_, workoutForConditie } from "./workouts/conditie";
import { ftpPools_, workoutForFtp } from "./workouts/ftp";
import { vo2Pools_, workoutForVo2max } from "./workouts/vo2max";
import {
  pctZoneBucket_,
  scaleBlocksToFit_,
  tssFromZoneMinutes_,
  typeBucket_,
  workoutZones,
} from "./zones";

// Feedback-loop drempels.
export const DEKKING_MIN_MIN = 15; // ≥15min werkelijk in bucket = gedekt
export const DEBT_FORCE_HIGH_MIN = 30; // high-debt > 30min → force weekend combo
export const DEBT_FORCE_ANAER_MIN = 20; // anaerobic-debt > 20min → idem

// Compensatie-suggesties voor open vrije dagen (feedback-blok).
export const SUGGESTIE_MAX_MIN = 90; // cap op voorgestelde duur per vrije dag
export const SUGGESTIE_MIN_MIN = 30; // onder dit niveau geen suggestie

// Volume-advies drempel (informatief).
export const VOLUME_ADVIES_MAX_SUGGESTIE = 120; // cap suggestie per rit op 120min

/**
 * Entry point — gekoppeld aan menu item "Genereer voorstel voor deze week".
 */
// Knip-a (puur): wat doet de weekplan-snapshot met een dag? VOORBIJE dag (dISO < todayISO) mét 'n
// vorige entry → 'freeze' (behoud, ONGEACHT train/type — dekt gemist én beschikbaarheid-uitgezet);
// voorbij zónder vorige entry → 'rebuild' als er 'n type is, anders 'skip'. Vandaag/toekomst volgt
// het NIEUWE plan: 'rebuild' bij train+type, anders 'skip' — NOOIT bevriezen.
export function snapshotDayAction_(
  dISO: any,
  todayISO: any,
  hasPrev: any,
  train: any,
  voorgesteldType: any,
): string {
  if (dISO < todayISO) {
    if (hasPrev) return "freeze";
    return voorgesteldType ? "rebuild" : "skip";
  }
  return train && voorgesteldType ? "rebuild" : "skip";
}

/**
 * Fase 2 — Onderhoud-fase-pin: pint de ENGINE-macrofase op 'Base' als doel === 'Onderhoud'
 * (→ allocActive TRUE + een eerste-klas fase, geen missing-key), anders passthrough. PUUR.
 * Alléén de engine-allocatiebron (generateProposal → assignWorkouts → allocateQualityWeek_) wordt
 * hierdoor gewrapt; de payload/display-fase-sites tonen de echte computeMacroPhase-uitkomst (label = Fase 3).
 */
export function effectiveMacroFase_(fase: any, settings: any): any {
  return settings && settings.doel === "Onderhoud" ? "Base" : fase;
}

/**
 * Kiest een workout-categorie die de grootste positieve debt-bucket
 * aanpakt. Null als er geen significant tekort (<5 min) is.
 */
export function debtPreferredType_(debt: any, doel: any, macroFase: any): any {
  if (!debt) return null;
  let best = null,
    bestVal = 4; // drempel 5
  ["anaerobic", "high", "low"].forEach((b) => {
    if (debt[b] > bestVal) {
      bestVal = debt[b];
      best = b;
    }
  });
  if (!best) return null;
  if (best === "anaerobic") return "vo2max";
  if (best === "high") {
    if (doel === "Beklimmingen") return "klim";
    return macroFase === "Peak" ? "threshold" : "sweet_spot";
  }
  return "long_z2";
}

/**
 * Geeft de intent (tijd-in-zone in min per bucket) van een workout terug.
 * Variant-workouts hebben dit al; voor overige workouts schatten we het:
 * ~45% van de tijd als werk in de niet-low zones, rest naar low.
 */
export function ensureIntent_(wo: any): any {
  if (wo.intent) return wo.intent;
  const total = wo.totaalMin || 0;
  const intent: any = { low: 0, high: 0, anaerobic: 0 };
  const zones = wo.zones && wo.zones.length ? wo.zones : ["low"];
  const workZones = zones.filter((z: any) => z !== "low");
  if (!workZones.length) {
    intent.low = total;
    return intent;
  }
  const per = Math.round((total * 0.45) / workZones.length);
  workZones.forEach((z: any) => {
    if (intent[z] != null) intent[z] += per;
  });
  intent.low = Math.max(0, total - per * workZones.length);
  return intent;
}

// v2c: zone-bucket → korte NL-term voor de reden-string (UI).
export function redenZoneLabel_(b: any): string {
  return b === "low"
    ? "duur"
    : b === "high"
      ? "intensiteit"
      : b === "anaerobic"
        ? "anaeroob"
        : String(b || "");
}

// ════════════════════════════════════════════════════════════════
// FASE 1b — week-brede kwaliteitsplaatsing (PUUR; getest). DORMANT tot de C4-wiring.
// ════════════════════════════════════════════════════════════════

// Bevat de workout 'high' of 'anaerobic'? (= kwaliteit/hard).
export function isHardType_(type: any, doel: any): boolean {
  const z = workoutZones(type, doel);
  return z.indexOf("high") >= 0 || z.indexOf("anaerobic") >= 0;
}
// Hardste load-bucket van een type: anaerobic > high > low; null als leeg.
export function primaryBucketOfType_(type: any, doel: any): any {
  const z = workoutZones(type, doel);
  if (z.indexOf("anaerobic") >= 0) return "anaerobic";
  if (z.indexOf("high") >= 0) return "high";
  if (z.indexOf("low") >= 0) return "low";
  return null;
}

/**
 * Week-brede kwaliteitsallocatie (PUUR — geen Sheet/DocProp). Returnt
 * { [dagIdx]: {role, type, archetypeId} } voor elke future-eligible dag.
 * role ∈ 'quality'|'longride'|'longride_efforts'|'endurance'. Plaatst eerst de
 * lange rit, dan debt-pre-claim, dan resterende quality-slots gespreid +
 * coverage-gebiast (forward), en vult de rest met endurance.
 */
export function allocateQualityWeek_(
  days: any,
  profiel: any,
  macroFase: any,
  dekking: any,
  recency: any,
  recentHardDate: any,
  debt: any,
  settings: any,
  today: any,
  taperActief: any,
  taperCtx: any,
  weekDays?: any,
): any {
  const plan: any = {};
  if (!profiel) return plan;
  const doel = settings.doel;
  const quota =
    (profiel.kwaliteitPerWeek && profiel.kwaliteitPerWeek[macroFase]) || 0;
  if (quota <= 0) return plan;

  const todayT = stripTime_(today).getTime();
  function dayTapers_(d: any): boolean {
    if (!taperActief || !taperCtx || !taperCtx.datum || !d.datum) return false;
    const dt = Math.round(
      (stripTime_(taperCtx.datum).getTime() - stripTime_(d.datum).getTime()) /
        86400000,
    );
    return dt >= 0 && dt <= taperCtx.venster;
  }
  function eligible_(d: any): boolean {
    return (
      d.train === true &&
      (d.type === "vrij" || d.type === "weekend" || d.type === "pendel") &&
      !d.gedaan &&
      d.datum &&
      stripTime_(d.datum).getTime() >= todayT &&
      !dayTapers_(d)
    );
  }

  // 0. quota − reeds-voltooide harde dagen (NB: bij wiring met tePlannen = 0; zie HANDOFF).
  let doneHard = 0;
  const doneScan = weekDays && weekDays.length ? weekDays : days;
  doneScan.forEach((d: any) => {
    if (d.gedaan && isHardType_(d.voorgesteldType, doel)) doneHard++;
  });
  let remaining = Math.max(0, quota - doneHard);
  const cov: any = {
    low: !!dekking.low,
    high: !!dekking.high,
    anaerobic: !!dekking.anaerobic,
  };
  const rec = (recency || []).slice();
  // Pass 1: weekvolume (uren) voor de volume-adaptieve Base-intent-weging — Σ beschikbare minuten
  // over de volle week (weekDays indien meegegeven, anders de meegegeven days) / 60.
  const volBron = weekDays && weekDays.length ? weekDays : days;
  let weekV = 0;
  volBron.forEach((d: any) => {
    weekV += Number(d.minuten) || 0;
  });
  weekV = weekV / 60;
  const elig = days.filter(eligible_);
  const planned: any = {};

  const spreiding = profiel.spreiding || {};
  const minGap = spreiding.midweekMinGap != null ? spreiding.midweekMinGap : 1;
  const weekendBlok = !!spreiding.weekendBlok;

  function dayByIdx_(idx: any): any {
    for (let i = 0; i < days.length; i++)
      if (days[i].dagIdx === idx) return days[i];
    return null;
  }
  function hardAnchors_(): any[] {
    const a: any[] = [];
    if (recentHardDate)
      a.push({ t: stripTime_(recentHardDate).getTime(), weekend: false });
    Object.keys(plan).forEach((k) => {
      const p = plan[k];
      if (p.role === "longride_efforts" || p.role === "quality") {
        const dd = dayByIdx_(Number(k));
        if (dd && dd.datum)
          a.push({
            t: stripTime_(dd.datum).getTime(),
            weekend: dd.type === "weekend",
          });
      }
    });
    return a;
  }
  function gapDays_(d: any, a: any): number {
    return Math.abs(
      Math.round((stripTime_(d.datum).getTime() - a.t) / 86400000),
    );
  }
  function gapOK_(d: any, anchors: any): boolean {
    for (let i = 0; i < anchors.length; i++) {
      const g = gapDays_(d, anchors[i]);
      if (g < minGap + 1) {
        const adjWeekend =
          g === 1 && d.type === "weekend" && anchors[i].weekend && weekendBlok;
        if (!adjWeekend) return false;
      }
    }
    return true;
  }
  function formsWeekendPair_(d: any, anchors: any): boolean {
    if (d.type !== "weekend") return false;
    for (let i = 0; i < anchors.length; i++) {
      if (anchors[i].weekend && gapDays_(d, anchors[i]) === 1) return true;
    }
    return false;
  }
  function minGapTo_(d: any, anchors: any): number {
    let m = 9999;
    for (let i = 0; i < anchors.length; i++) {
      const g = gapDays_(d, anchors[i]);
      if (g < m) m = g;
    }
    return m;
  }
  // Spreiding-prioriteit: (1) geen weekend-paar vormen, (2) max gap, (3) pendel-voorkeur, (4) laagste dagIdx.
  function pickBestSpread_(cands: any, anchors: any): any {
    let best: any = null,
      bk: any = null;
    cands.forEach((d: any) => {
      const k = {
        pair: formsWeekendPair_(d, anchors) ? 1 : 0,
        gap: minGapTo_(d, anchors),
        pendel: d.type === "pendel" ? 0 : 1,
        idx: d.dagIdx,
      };
      if (!bk) {
        best = d;
        bk = k;
        return;
      }
      if (k.pair !== bk.pair) {
        if (k.pair < bk.pair) {
          best = d;
          bk = k;
        }
        return;
      }
      if (k.gap !== bk.gap) {
        if (k.gap > bk.gap) {
          best = d;
          bk = k;
        }
        return;
      }
      if (k.pendel !== bk.pendel) {
        if (k.pendel < bk.pendel) {
          best = d;
          bk = k;
        }
        return;
      }
      if (k.idx < bk.idx) {
        best = d;
        bk = k;
      }
    });
    return best;
  }

  // 1. lange rit — langste eligible niet-pendel dag (tie: hoogste dagIdx).
  if ((profiel.langeRitPerWeek || 0) >= 1) {
    let lr: any = null;
    elig.forEach((d: any) => {
      if (d.type === "pendel") return;
      if (
        !lr ||
        d.minuten > lr.minuten ||
        (d.minuten === lr.minuten && d.dagIdx > lr.dagIdx)
      )
        lr = d;
    });
    if (lr) {
      const efforts =
        !!spreiding.effortsInLangeRit &&
        (macroFase === "Build" || macroFase === "Peak");
      if (efforts) {
        plan[lr.dagIdx] = {
          role: "longride_efforts",
          type: "combo_long_with_efforts",
          archetypeId: null,
        };
        cov.low = true;
        cov.high = true;
        remaining = Math.max(0, remaining - 1);
      } else {
        plan[lr.dagIdx] = {
          role: "longride",
          type: "long_z2",
          archetypeId: null,
        };
        cov.low = true;
      }
      planned[lr.dagIdx] = true;
    }
  }

  // 2. debt pre-claim (één slot met de debt-type). Fase 2: profiel.debtEnabled:false (Onderhoud)
  //    zet 'm uit — de week-allocator krijgt raw debt (regel ~1020), dus hier apart gaten.
  if (remaining > 0 && debt && profiel.debtEnabled !== false) {
    const dp = debtPreferredType_(debt, doel, macroFase);
    if (dp && dp !== "long_z2" && dp !== "recovery") {
      const anc2 = hardAnchors_();
      const pick = pickBestSpread_(
        elig.filter((d: any) => !planned[d.dagIdx] && gapOK_(d, anc2)),
        anc2,
      );
      if (pick) {
        plan[pick.dagIdx] = { role: "quality", type: dp, archetypeId: null };
        const b = primaryBucketOfType_(dp, doel);
        if (b) cov[b] = true;
        planned[pick.dagIdx] = true;
        remaining--;
      }
    }
  }

  // 3. resterende quality-slots.
  let guard = 0;
  while (remaining > 0 && guard++ < 20) {
    const anchors = hardAnchors_();
    const cands = elig.filter(
      (d: any) => !planned[d.dagIdx] && gapOK_(d, anchors),
    );
    if (!cands.length) break;
    const sel = pickBestSpread_(cands, anchors);
    if (!sel) break;
    // Pass 1: Base loopt nu via dezelfde goalWorkout_-keuze als Build/Peak (was hardcoded
    // sweet_spot), mét de weekvolume-laag (weekV) → Base polariseert (vo2 verschijnt bij hoog volume).
    const bt = Math.min(
      sel.type === "pendel" ? settings.pendelDuurMin || 80 : sel.minuten,
      (profiel && profiel.maxDuurMin) || Infinity,
    ); // Fase 2: maxDuurMin-cap (Onderhoud 45); geen veld → Infinity → 4 doelen byte-identiek
    const gw = goalWorkout_(profiel, macroFase, bt, rec, cov, weekV);
    if (gw) {
      plan[sel.dagIdx] = {
        role: "quality",
        type: gw.type,
        archetypeId: gw.archetypeId,
      };
      rec.push({
        intent: intentFromType_(gw.type),
        archetypeId: gw.archetypeId,
      });
      const b2 = primaryBucketOfType_(gw.type, doel);
      if (b2) cov[b2] = true;
      planned[sel.dagIdx] = true;
      remaining--;
    } else {
      planned[sel.dagIdx] = "skip"; // geen archetype past → uit de pool, géén quality
    }
  }

  // 4. endurance-fill — elke resterende eligible dag.
  elig.forEach((d: any) => {
    if (plan[d.dagIdx]) return;
    plan[d.dagIdx] = {
      role: "endurance",
      type: d.type === "pendel" ? "pendel_z2" : "long_z2",
      archetypeId: null,
    };
  });
  return plan;
}

// Recency-seed-horizon (weken): hoeveel opgeslagen weekplan-snapshots worden samengevoegd tot
// de cross-week archetype-recency. Instelbaar.
export const RECENCY_HORIZON_WEEKS = 8;

// Verzamelt weekplan-entries over de laatste `horizonWeeks` (incl. de week van baseMonday) via
// kalender-rekenkunde (DST-veilig, geen ms-aftrek). Zelfde formatDate als de seed-read.
// DATA-IN: readWeekplan(key) → reeds-geparste array | null (was PropertiesService + JSON.parse).
// Ontbrekende/lege/niet-array-weken dragen niets bij; recencyFromWeekplan_ filtert + sorteert
// de samengevoegde lijst zelf op datum + kwaliteit.
export function gatherWeekplanEntries_(
  horizonWeeks: any,
  baseMonday: any,
  readWeekplan: any,
): any {
  const monday = baseMonday || weekStartDate(new Date());
  let out: any[] = [];
  for (let k = 0; k < horizonWeeks; k++) {
    const d = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() - 7 * k,
    );
    const key = "weekplan_" + formatDate(d, "yyyy-MM-dd");
    const raw = readWeekplan ? readWeekplan(key) : null;
    if (!raw) continue;
    if (Array.isArray(raw)) out = out.concat(raw);
  }
  return out;
}

export function assignWorkouts(
  days: any,
  settings: any,
  mesoWeek: any,
  macroFase: any,
  dekking: any,
  wellness: any,
  klimType: any,
  recentHardDate: any,
  debt: any,
  isTripEvent: any,
  taperCtx: any,
  weekDays: any,
  // 13e, OPTIONELE param (laag 1b): de al-gegatherde weekplan-entries voor de
  // cross-week recency-seed. Weggelaten/null → byte-identiek aan vóór 1b (dezelfde
  // lege gather via de null-reader). Zie docs/RECENCY-1B-RECON.md.
  recencyEntries?: any,
): void {
  const doel = settings.doel;
  // Taper is een per-dag-overlay (Deel 2): taperCtx = { datum, venster, isTrip }
  // of null. macroFase is hier ALTIJD de onderliggende fase (nooit 'Taper').
  const taperActief = !!(taperCtx && taperCtx.datum && taperCtx.venster > 0);
  const isEventRecovery = macroFase === "Recovery";
  const isMesoRecovery = mesoWeek === 4;
  // 3d stap 2 — TAPER-GUARD (blok-anchoring): onderdruk de kalender-deload IN de taper-week ÉN de
  // week ervoor (dagen(weekMaandag → taperdatum) ∈ [0 .. 7 + venster]). Zo is de pre-taper-week een
  // normale (belaste) opbouwweek en is de taper zélf de deload; taper-dagen overrulen sowieso per dag.
  let nearTaper = false;
  if (taperCtx?.datum && days?.length && days[0]?.datum) {
    const daysToTaper = Math.floor(
      (stripTime_(taperCtx.datum).getTime() -
        stripTime_(days[0].datum).getTime()) /
        86400000,
    );
    nearTaper = daysToTaper >= 0 && daysToTaper <= 7 + (taperCtx.venster || 0);
  }
  const isRecovery = isMesoRecovery && !nearTaper;
  const isTestWeek = macroFase === "Test";
  let testGedaan = false;
  let openersGedaan = false;
  // Avoid-consecutive-hard: laatste harde dag vóór het te-plannen venster.
  let lastHardDate = recentHardDate ? stripTime_(recentHardDate) : null;
  // Debt-weging alleen in opbouwfasen (niet tijdens taper/recovery —
  // dan geen compensatie-intensiteit forceren; herstel respecteren).
  const debtActief =
    !!debt &&
    !taperActief &&
    !isEventRecovery &&
    !isRecovery &&
    profileForDoel_(settings.doel).debtEnabled !== false; // Fase 2: profiel-gate (Onderhoud debtEnabled:false); geen veld → undefined !== false → true
  const debtWerk: any = debtActief
    ? { low: debt.low, high: debt.high, anaerobic: debt.anaerobic }
    : null;
  // C4: week-brede kwaliteitsplaatsing actief in Base/Build/Peak (NIET Recovery/Test/event-recovery).
  const allocActive =
    !isEventRecovery &&
    !isRecovery &&
    !isTestWeek &&
    (macroFase === "Base" || macroFase === "Build" || macroFase === "Peak");

  // Sorteer op dagIdx zodat ma→zo wordt verwerkt
  days.sort((a: any, b: any) => a.dagIdx - b.dagIdx);

  // 2b.2: recency voor goalWorkout_ — zaai (best-effort) uit de opgeslagen weekplan-snapshot,
  // vul in-loop aan met elke toegewezen kwaliteitsdag (ma→zo). Deterministisch (geen Math.random).
  let qualityRecency: any[] = [];
  try {
    // Cross-week seed: voeg de laatste RECENCY_HORIZON_WEEKS weekplan-snapshots samen (niet enkel
    // deze week) zodat de archetype-rotatie ook over weekgrenzen heen mijdt. Een lege huidige week
    // mag de seed niet blokkeren → geen wpRaw0-guard meer (die las alleen deze week).
    // DATA-IN (laag 1b): de caller mag de al-gegatherde entries meegeven (recencyEntries).
    // Weggelaten/null → de oude null-accessor → lege seed → byte-identiek gedrag.
    qualityRecency = recencyFromWeekplan_(
      recencyEntries != null
        ? recencyEntries
        : gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS, null, null),
      null,
    );
  } catch (e0) {}

  // C4: bouw 't week-plan ÉÉN keer (vóór de per-dag-loop), gevoed met dezelfde dekking/recency.
  const allocToday = stripTime_(new Date());
  const quotaPlan = allocActive
    ? allocateQualityWeek_(
        days,
        profileForDoel_(settings.doel),
        macroFase,
        dekking,
        qualityRecency,
        recentHardDate,
        debt,
        settings,
        allocToday,
        taperActief,
        taperCtx,
        weekDays,
      )
    : {};

  days.forEach((d: any) => {
    let type: any;
    let reden = ""; // v2c: primaire reden bij het FINALE type
    let redenCode: string | null = null; // 2a: machineleesbare reden-code NAAST de string (additief)
    let debtForced = false; // debt-geforceerde compensatie → exempt van avoid-consecutive-hard
    let archetypeId: any = null; // 2b.2: door goalWorkout_ gekozen archetype (alleen vrij-keyIntensity-dagen)

    // Per-dag taper-gating: een dag tapert ALLEEN als hij 0..venster dagen vóór
    // het taper-event ligt; anders (ook post-event) → normale toewijzing.
    const dToTaper =
      taperActief && d.datum
        ? Math.round(
            (stripTime_(taperCtx.datum).getTime() -
              stripTime_(d.datum).getTime()) /
              86400000,
          )
        : null;
    const dayTapers =
      taperActief &&
      dToTaper != null &&
      dToTaper >= 0 &&
      dToTaper <= taperCtx.venster;

    if (isEventRecovery) {
      // Recovery-week na A-race: alles easy Z2.
      type = "recovery";
      reden = "Herstel — herstelweek na A-race";
      redenCode = "recovery_post_race";
    } else if (dayTapers) {
      if (taperCtx.isTrip) {
        // Tour-taper: meerdaagse rittenreis vraagt durability, geen race-snap.
        // Endurance-volume vasthouden; alleen de laatste 2 dagen kort + soepel.
        const isLaatste2 = dToTaper <= 2;
        type = isLaatste2 ? "taper_z2_kort" : "tour_taper_z2";
        reden = isLaatste2
          ? "Korte taper-rit — vers worden voor de trip"
          : "Taper-duurrit — durability vasthouden";
        redenCode = isLaatste2 ? "taper_trip_short" : "taper_trip_endurance";
      } else {
        // Race-taper: één korte openers-sessie, rest korte Z2.
        if (!openersGedaan && (d.type === "vrij" || d.type === "weekend")) {
          type = "taper_openers";
          openersGedaan = true;
          reden = "Openers — kort en scherp voor de wedstrijd";
          redenCode = "taper_openers";
        } else {
          type = "taper_z2_kort";
          reden = "Korte taper-rit — vers worden";
          redenCode = "taper_race_short";
        }
      }
    } else if (isRecovery) {
      // Recovery week: alleen lichte sessies
      if (d.type === "pendel") type = "pendel_z2";
      else if (d.type === "weekend") type = "long_z2";
      else type = "recovery";
      reden = "Herstel — herstelweek";
      redenCode = "recovery_week";
    } else if (
      isTestWeek &&
      !testGedaan &&
      (d.type === "vrij" || d.type === "weekend")
    ) {
      type = "test";
      testGedaan = true;
      reden = "Test — FTP/conditie bepalen";
      redenCode = "test";
    } else if (allocActive && quotaPlan[d.dagIdx]) {
      // C4: week-allocator-plaatsing (quality/longride/endurance) — overrulet de per-dag-takken.
      const qp = quotaPlan[d.dagIdx];
      type = qp.type;
      archetypeId = qp.archetypeId || null;
      reden =
        qp.role === "quality"
          ? "Sleutelsessie · " +
            doel +
            " — fase " +
            macroFase +
            " (week-plaatsing)"
          : qp.role === "longride_efforts"
            ? "Lange rit met efforts — week-plaatsing"
            : qp.role === "longride"
              ? "Lange duurrit — week-plaatsing"
              : "Duurrit — week-plaatsing";
      // 2a.1: elke week-allocator-rol krijgt een coach-narrative-code (hergebruik key_session/
      // long_with_efforts; long_ride/endurance nieuw) → geen droge reden meer op plaatsing-dagen.
      redenCode =
        qp.role === "quality"
          ? "key_session"
          : qp.role === "longride_efforts"
            ? "long_with_efforts"
            : qp.role === "longride"
              ? "long_ride"
              : "endurance";
    } else if (d.type === "pendel") {
      type =
        isTripEvent && (macroFase === "Build" || macroFase === "Peak")
          ? "pendel_trip_intervals" // tocht-pendel → sweet-spot/tempo (zie genericPendelIntervals)
          : "pendel_" + doelKey(doel) + "_intervals";
      reden = "Pendelrit — vaste woon-werkrit";
      redenCode = "commute";
    } else if (d.type === "weekend") {
      // Debt-aware: groot high/anaerobic tekort → forceer combo met
      // expliciete high-blokken (i.p.v. alleen long_z2 + klim-sim).
      if (debtActief && debtWerk.high > DEBT_FORCE_HIGH_MIN) {
        type = "combo_long_with_efforts";
        debtWerk.high = 0; // gecompenseerd
        debtForced = true;
        reden = "Inhaalsessie — " + redenZoneLabel_("high") + " tekort";
        redenCode = "catchup_high";
      } else if (debtActief && debtWerk.anaerobic > DEBT_FORCE_ANAER_MIN) {
        type = "combo_long_with_efforts";
        debtWerk.anaerobic = 0;
        debtForced = true;
        reden = "Inhaalsessie — " + redenZoneLabel_("anaerobic") + " tekort";
        redenCode = "catchup_anaerobic";
      } else if (!dekking.low) {
        type = "long_z2";
        reden = "Lange duurrit — weekend";
        redenCode = "long_weekend";
      } else if (!dekking.high && macroFase !== "Base") {
        type = "combo_long_with_efforts";
        reden = "Lange rit met blokken — intensiteit aanvullen";
        redenCode = "long_with_efforts";
      } else {
        type = "long_z2";
        reden = "Lange duurrit — weekend";
        redenCode = "long_weekend";
      }
    } else if (d.type === "vrij") {
      // Debt-weging: prioriteer grootste positieve tekort-bucket.
      const dp = debtWerk
        ? debtPreferredType_(debtWerk, doel, macroFase)
        : null;
      if (dp) {
        type = dp;
        const dpBucket = typeBucket_(dp, doel);
        debtWerk[dpBucket] = 0; // verbruikt → volgende dag andere bucket
        reden = "Inhaalsessie — " + redenZoneLabel_(dpBucket) + " tekort";
        redenCode = "catchup_" + dpBucket; // catchup_low|catchup_high|catchup_anaerobic
      } else {
        const kiOut: any = {};
        type = keyIntensity(doel, macroFase, dekking, klimType, isTripEvent, {
          beschikbareTijd: d.minuten,
          recency: qualityRecency,
          settings: settings,
          out: kiOut,
        });
        archetypeId = kiOut.archetypeId || null;
        reden = "Sleutelsessie · " + doel + " — fase " + macroFase;
        redenCode = "key_session";
      }
    } else if (d.type === "recovery") {
      type = "recovery";
      reden = "Herstel — ingeroosterd";
      redenCode = "recovery_scheduled";
    } else {
      type = "recovery";
      reden = "Rustige dag — geen sleutelprikkel nodig";
      redenCode = "easy_no_key";
    }

    // Avoid-consecutive-hard: als de vorige kalenderdag een harde dag was
    // (deze week of vorige week) en deze dag óók hard zou zijn → downgrade
    // naar long_z2. Voorkomt twee zware dagen op rij, ook over de weekgrens.
    const zonesPre = workoutZones(type, doel);
    let isHard =
      zonesPre.indexOf("high") >= 0 || zonesPre.indexOf("anaerobic") >= 0;
    if (isHard && !debtForced && d.datum && lastHardDate) {
      const prevDay = stripTime_(
        new Date(d.datum.getTime() - 24 * 60 * 60 * 1000),
      );
      if (prevDay.getTime() === lastHardDate.getTime()) {
        type = d.type === "pendel" ? "pendel_z2" : "long_z2"; // C4: pendel-aware downgrade
        isHard = false;
        archetypeId = null; // 2b.2: type gedowngraded → archetype-keuze vervalt
        reden = "Rustige duurrit — dag na een zware dag"; // load-context wint
        redenCode = "demote_recent_hard";
      }
    }

    d.voorgesteldType = type;
    d.reden = reden;
    d.redenCode = redenCode; // 2a: additief, reist mee met de reden-string
    d.archetypeId = archetypeId; // 2b.2: reist mee naar de build-loop (engine-sessie)
    if (archetypeId)
      qualityRecency.push({
        intent: intentFromType_(type),
        archetypeId: archetypeId,
      });
    const zones = workoutZones(type, doel);
    zones.forEach((z: any) => {
      dekking[z] = true;
    });
    if (isHard && d.datum) lastHardDate = stripTime_(d.datum);
  });

  // Wellness-demotie pass: pas type aan op basis van HRV/slaap-signaal
  if (
    wellness &&
    (wellness.signal === "demote" || wellness.signal === "recovery")
  ) {
    days.forEach((d: any) => {
      if (!d.voorgesteldType) return;
      if (wellness.signal === "recovery") {
        d.voorgesteldType = "recovery";
        d.archetypeId = null; // 2b.2: type gewijzigd → archetype vervalt
        d.reden = "Herstel — wellness laag";
        d.redenCode = "demote_wellness_rest"; // 2a: overschrijft de dag-code net als reden
      } else {
        const gedemoot =
          d.type === "pendel" ? "pendel_z2" : demoteType_(d.voorgesteldType); // C4: pendel-aware demote
        if (gedemoot !== d.voorgesteldType) {
          d.voorgesteldType = gedemoot;
          d.archetypeId = null; // 2b.2: gedemoot → archetype vervalt
          d.reden = "Lichter gehouden — wellness laag";
          d.redenCode = "demote_wellness_light";
        }
      }
    });
  }
}

// ── Wellness signal + demotion ─────────────────────────────

/**
 * Maps high-intensity workout types naar lichtere alternatieven voor
 * 'demote' signal. Types die niet in de map staan blijven onveranderd.
 */
export const DEMOTE_MAP: any = {
  // FTP
  sweet_spot: "tempo",
  threshold: "tempo",
  // VO2max
  vo2_short: "tempo",
  vo2_medium: "tempo",
  vo2_long: "tempo",
  vo2_3015: "long_z2",
  microbursts: "long_z2",
  vo2max: "tempo",
  // Beklimmingen
  big_gear: "tempo",
  bergsim: "tempo",
  ss_lang: "tempo",
  low_cad: "tempo",
  // Conditie
  fatox: "long_z2",
  // Combos
  combo_long_with_efforts: "long_z2",
  combo_z2_vo2: "long_z2",
  combo_ss_sprints: "tempo",
  combo_all_three: "combo_long_with_efforts",
  // Pendel — terug-intervallen vervangen door pendel_z2
  pendel_ftp_intervals: "pendel_z2",
  pendel_vo2_intervals: "pendel_z2",
  pendel_conditie_intervals: "pendel_z2",
  pendel_climb_intervals: "pendel_z2",
  pendel_trip_intervals: "pendel_z2",
  // Test → recovery (geen testen tijdens slechte recovery)
  test: "recovery",
};

export function demoteType_(type: any): any {
  return DEMOTE_MAP[type] || type;
}

export function doelKey(doel: any): string {
  if (doel === "FTP") return "ftp";
  if (doel === "VO2max") return "vo2";
  if (doel === "Conditie") return "conditie";
  if (doel === "Beklimmingen") return "climb";
  return "ftp";
}

/**
 * Kiest de key-intensity workout voor een vrije dag op basis van doel,
 * macro-fase en wat nog open staat in dekking.
 */
export function keyIntensity(
  doel: any,
  macroFase: any,
  dekking: any,
  klimType: any,
  isTripEvent: any,
  ctx?: any,
): any {
  if (macroFase === "Taper") return "taper_openers"; // defensief — taper handled in assignWorkouts
  if (macroFase === "Recovery") return "recovery";

  // Kwaliteitsdag in Build/Peak. 2b.2: goalWorkout_ (profiel-gedreven) vervangt de
  // climbTypeWorkout_-STAP; climbTypeWorkout_ blijft FALLBACK (geen ctx = revert-pad, of
  // goalWorkout_ null = geen archetype past binnen de beschikbare tijd). Daarna de trip-tak.
  if (macroFase === "Build" || macroFase === "Peak") {
    const gw =
      ctx && ctx.settings
        ? goalWorkout_(
            profileForDoel_(ctx.settings.doel),
            macroFase,
            ctx.beschikbareTijd,
            ctx.recency,
            dekking,
          )
        : null;
    if (gw) {
      if (ctx && ctx.out) ctx.out.archetypeId = gw.archetypeId;
      return gw.type;
    }
    const ct = climbTypeWorkout_(klimType, macroFase, dekking);
    if (ct) return ct;
    // Trip/tocht-event zonder klim-routing → duur-key i.p.v. doel-FTP-intervallen.
    if (isTripEvent) return "long_z2";
  }

  // Categorie-types → variant-pools (selectVariant_ roteert de vorm).
  if (doel === "FTP") {
    if (macroFase === "Base") return "sweet_spot";
    if (macroFase === "Build") return dekking.high ? "threshold" : "sweet_spot";
    if (macroFase === "Peak") return "threshold";
    return "sweet_spot";
  }
  if (doel === "VO2max") return "vo2max";
  if (doel === "Conditie") return "conditie";
  if (doel === "Beklimmingen") return "klim";
  return "sweet_spot";
}

/**
 * Klim-type-gestuurde keuze van de kwaliteitsdag-categorie (event-driven).
 * Mapt naar variant-pool categorieën i.p.v. losse types:
 *   kort    → vo2max  (pool bevat 8x2 / 30-30 / 40-20 explosief)
 *   lang    → threshold / sweet_spot (sustained)
 *   gemengd → afwisselen op basis van dekking
 *   vlak    → null (val terug op doel-standaard)
 */
export function climbTypeWorkout_(
  klimType: any,
  _macroFase: any,
  dekking: any,
): any {
  if (!klimType || klimType === "vlak") return null;
  if (klimType === "kort") return "vo2max";
  if (klimType === "lang") return dekking.high ? "threshold" : "sweet_spot";
  if (klimType === "gemengd") return dekking.anaerobic ? "threshold" : "vo2max";
  return null;
}

// ════════════════════════════════════════════════════════════════
// VARIANT-ENGINE (DEEL 3) — pools + selectie + renderer
// ════════════════════════════════════════════════════════════════

/** Weken sinds doel-startdatum (deterministisch, reproduceerbaar). */
export function weekIndexFromStart_(settings: any): number {
  const start = settings.doelStart || new Date();
  const s0 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const ws = weekStartDate(new Date());
  const diff = Math.floor(
    (ws.getTime() - s0.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  return diff < 0 ? 0 : diff;
}

/** Verzamelt alle pools (generiek + per doel-library) in één object. */
export function getPool_(type: any): any {
  const pools: any = {};
  function merge(p: any): void {
    if (p)
      Object.keys(p).forEach((k) => {
        pools[k] = p[k];
      });
  }
  merge(genericPools_());
  merge(ftpPools_());
  merge(vo2Pools_());
  merge(conditiePools_());
  merge(climbPools_());
  return pools[type] || null;
}

export function findVariantById_(pool: any, id: any): any {
  for (let i = 0; i < pool.length; i++) if (pool[i].id === id) return pool[i];
  return null;
}

/**
 * Kiest een variant uit de pool voor `type`. Pure functie van
 * (type, weekIndex, slot) — geen DocProp-state meer.
 *
 * Roteert wekelijks via weekIndex EN verschilt per dag via slot (dagIdx),
 * zodat twee dagen van hetzelfde type NIET dezelfde workout krijgen.
 * Omdat opslag (assignWorkouts) en render (renderProposal) beide met
 * dezelfde (weekIndex, dagIdx) aanroepen, matchen ze altijd zonder cache.
 */
export function selectVariant_(type: any, weekIndex: any, slot: any): any {
  const pool = getPool_(type);
  if (!pool || !pool.length) return null;
  const idx =
    (((weekIndex + (slot || 0)) % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

/**
 * Rendert een variant-spec naar een workout-object met intent.
 * adj(basePct) = basePct — identiteit sinds T28 (karakter-invariantie M74-M78);
 * meso/fase raken het %FTP per blok niet meer, alleen duur (mins) en mix.
 * intent = target tijd-in-zone (min) per load-focus bucket.
 * mins (optioneel) = beschikbare minuten — als gegeven, krimpen blocks
 * via scaleBlocksToFit_ zodat totaalMin onder mins blijft waar mogelijk.
 *
 * ADDITIEF: emit ook `blokken` = geordende [{minuten, zone}] (zone uit
 * %FTP via pctZoneBucket_) voor de dashboard zone-balk. structuur/intent/
 * generatie ongewijzigd.
 */
export function renderVariant_(
  variant: any,
  settings: any,
  mesoWeek: any,
  macroFase: any,
  mins?: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  // T28: karakter-invariantie (M74-M78). De meso-/fase-%FTP-hendel is verwijderd —
  // adj is de identiteit, dus elk blok houdt zijn nominale %FTP over álle mesoweken en
  // fasen. mesoWeek/macroFase blijven in de signatuur (macroFase voedt de naam; de
  // duur-inpassing loopt via mins/scaleBlocksToFit_ en is ongewijzigd).
  const adj = (p: number): number => p;

  let warm = variant.warmup || 12,
    cool = variant.cooldown || 10;
  // Pack short sessions: bij ≤75 min beschikbaar trimmen we de warmup/
  // cooldown alvast, anders eet die overhead te veel van de main op
  // (een 3×10 threshold past dan niet meer in 60 min).
  if (mins && mins <= 75) {
    warm = Math.min(warm, 10);
    cool = Math.min(cool, 8);
  }

  const rawBlocks = variant.blocks(adj);
  const blocks = scaleBlocksToFit_(rawBlocks, mins, warm, cool);
  const ingekort = blocks !== rawBlocks;

  // 3d stap 2 — KWALITEITS-RAMP (tijd-in-zone). Zelfde mechaniek als expandArchetype_: in
  // opbouwweken (f>1) rekt de core-WERKtijd ×workScale; de ruimte komt EERST uit de endurance-
  // fill (gap), DAN uit de cooldown (tot 5), DAN uit de warmup (tot 8). %FTP ONgemoeid
  // (adj=identiteit) → karakter-invariant. Totaal blijft ≤ mins. f=1 → byte-identiek.
  let workScale = 1;
  {
    const f = mesoWeek != null ? mesoFactor(mesoWeek) : 1;
    if (f > 1 && mins) {
      let nomWork = 0,
        nomRest = 0;
      blocks.forEach((b: any) => {
        if (b.kind === "int") {
          const onM = b.onMin != null ? b.onMin : b.onSec / 60;
          const offM = b.offMin != null ? b.offMin : b.offSec / 60;
          nomWork += b.reps * onM;
          nomRest += b.reps * offM;
        } else {
          nomWork += b.durMin;
        }
      });
      if (nomWork > 0) {
        const fillNominal = mins - (warm + nomWork + nomRest + cool);
        const coolTrimMax = Math.max(0, cool - 5);
        const warmTrimMax = Math.max(0, warm - 8);
        const room = Math.max(0, fillNominal) + coolTrimMax + warmTrimMax;
        const addedWork = Math.min(nomWork * (f - 1), room);
        if (addedWork > 0) {
          workScale = (nomWork + addedWork) / nomWork;
          const fillUsed = Math.min(addedWork, Math.max(0, fillNominal));
          let rem = addedWork - fillUsed;
          const coolTrim = Math.min(rem, coolTrimMax);
          rem -= coolTrim;
          const warmTrim = Math.min(rem, warmTrimMax);
          warm -= warmTrim;
          cool -= coolTrim;
        }
      }
    }
  }

  const structuur: any[] = [
    [
      "Warmup",
      warm + " min",
      wattsRange(ftp, 50, 68),
      bpmBelow(lthr, 85),
      "Inrijden, opbouwend",
    ],
  ];
  const intent: any = { low: warm + cool, high: 0, anaerobic: 0 };
  let mainMin = 0;
  const blokken: any[] = [
    { minuten: warm, zone: "rust", pctLo: 50, pctHi: 68 },
  ]; // warmup laag-intensief

  blocks.forEach((b: any) => {
    if (b.kind === "int") {
      const onMin = (b.onMin != null ? b.onMin : b.onSec / 60) * workScale;
      const offMin = b.offMin != null ? b.offMin : b.offSec / 60;
      const onStr =
        b.onMin != null
          ? Math.round(b.onMin * workScale * 10) / 10 + " min"
          : Math.round(b.onSec * workScale) + " sec";
      const offStr = b.offMin != null ? b.offMin + " min" : b.offSec + " sec";
      structuur.push([
        b.label,
        b.reps + "x " + onStr,
        wattsRange(ftp, b.onPct - 2, b.onPct + 2),
        bpmRange(lthr, 95, 106),
        offStr + " rust @ " + b.offPct + "%",
      ]);
      intent[variant.zone] += b.reps * onMin;
      intent.low += b.reps * offMin;
      mainMin += b.reps * (onMin + offMin);
      // per rep: werk-blok + rust-blok → interval-vorm in de balk
      const onZone = pctZoneBucket_(b.onPct),
        offZone = pctZoneBucket_(b.offPct);
      for (let rr = 0; rr < b.reps; rr++) {
        if (onMin > 0)
          blokken.push({
            minuten: Math.round(onMin * 10) / 10,
            zone: onZone,
            pctLo: b.onPct - 2,
            pctHi: b.onPct + 2,
          });
        if (offMin > 0)
          blokken.push({
            minuten: Math.round(offMin * 10) / 10,
            zone: offZone,
            pctLo: b.offPct,
            pctHi: b.offPct,
          });
      }
    } else {
      // steady — 3d stap 2: ramp de core-werktijd (durMin ×workScale).
      const z = b.zone || variant.zone;
      const dm = Math.round(b.durMin * workScale * 10) / 10;
      structuur.push([
        b.label,
        dm + " min",
        wattsRange(ftp, b.pct - 2, b.pct + 2),
        bpmRange(lthr, 78, 92),
        b.note || "Stabiel",
      ]);
      intent[z] += dm;
      mainMin += dm;
      blokken.push({
        minuten: dm,
        zone: pctZoneBucket_(b.pct),
        pctLo: b.pct - 2,
        pctHi: b.pct + 2,
      });
    }
  });

  // (A) Endurance-fill: lange dag → vul de restduur met Z2 i.p.v. onder-vullen.
  // Vaste harde set (scaleBlocksToFit_ schaalt reps NIET omhoog) + Z2-rest.
  if (mins) {
    const gap = mins - warm - cool - mainMin;
    if (gap >= 5) {
      structuur.push([
        "Z2 endurance",
        gap + " min",
        wattsRange(ftp, 63, 72),
        bpmRange(lthr, 78, 88),
        "Aanvullende duur — rustige Z2",
      ]);
      blokken.push({ minuten: gap, zone: "z2", pctLo: 63, pctHi: 72 });
      mainMin += gap;
      intent.low += gap; // helper telt deze als low (0.7) → IF daalt
    }
  }

  structuur.push([
    "Cooldown",
    cool + " min",
    wattsRange(ftp, 45, 55),
    "—",
    "Easy uit",
  ]);
  blokken.push({ minuten: cool, zone: "rust", pctLo: 45, pctHi: 55 });

  const totaalMin = warm + cool + mainMin;
  Object.keys(intent).forEach((k) => {
    intent[k] = Math.round(intent[k]);
  });

  const tooLong =
    mins && totaalMin > mins ? { available: mins, needed: totaalMin } : null;

  return {
    naam:
      variant.naam + " (" + macroFase + (ingekort ? ", ingekort" : "") + ")",
    focus: variant.zone,
    zones: [variant.zone],
    variantId: variant.id,
    totaalMin: totaalMin,
    structuur: structuur,
    intent: intent,
    blokken: blokken,
    tss: tssFromZoneMinutes_(intent),
    eindopmerking:
      variant.tip ||
      variant.naam + " — variant van deze week (roteert wekelijks).",
    tooLong: tooLong,
  };
}

// ════════════════════════════════════════════════════════════════
// TRAININGEN-BIBLIOTHEEK (read-side) — {categorie → varianten[]} via de
// BESTAANDE pure builders (renderVariant_ + segmentsFromBlokken_ +
// tssFromZoneMinutes_). Géén DocProp-state; veilig per request.
// ════════════════════════════════════════════════════════════════

// Display-categorie → engine-pool-type + design-tokens. zoneVar = marker/naam-
// kleur uit het 6-zone-model (tr_cats.png + tokens.css). defaultDur = slider-start.
// Sweet Spot + FTP/Drempel delen --zone-4 (amber, threshold-familie; geen aparte token).
export const TRAINING_CATS_: any = [
  {
    key: "herstel",
    label: "Herstel",
    type: "recovery",
    zoneVar: "--zone-1",
    fase: "Base",
    defaultDur: 45,
    omschrijving: "Actief herstel, heel rustig",
  },
  {
    key: "duur",
    label: "Duurvermogen",
    type: "long_z2",
    zoneVar: "--zone-2",
    fase: "Base",
    defaultDur: 120,
    omschrijving: "Aerobe basis · lange rustige ritten",
  },
  {
    key: "tempo",
    label: "Tempo",
    type: "tempo",
    zoneVar: "--zone-3",
    fase: "Build",
    defaultDur: 75,
    omschrijving: "Stevig aeroob · comfortabel-hard",
  },
  {
    key: "sweetspot",
    label: "Sweet Spot",
    type: "sweet_spot",
    zoneVar: "--zone-4",
    fase: "Build",
    defaultDur: 75,
    omschrijving: "Veel prikkel · beheersbare vermoeidheid",
  },
  {
    key: "ftp",
    label: "FTP / Drempel",
    type: "threshold",
    zoneVar: "--zone-4",
    fase: "Build",
    defaultDur: 75,
    omschrijving: "Rond je 1-uurs vermogen",
  },
  {
    key: "vo2max",
    label: "VO2max",
    type: "vo2max",
    zoneVar: "--zone-5",
    fase: "Peak",
    defaultDur: 75,
    omschrijving: "Korte, felle intervallen",
  },
];

// Herstel heeft geen variant-pool → kleine declaratieve set in dezelfde spec-vorm.
export function recoveryPool_(): any {
  return [
    {
      id: "rec_licht",
      naam: "Hersteldrit licht",
      zone: "low",
      warmup: 5,
      cooldown: 5,
      blocks: (a: any) => [
        { kind: "steady", label: "Herstel", durMin: 35, pct: a(50) },
      ],
      tip: "Heel licht — actief herstel, niet pushen.",
    },
    {
      id: "rec_los",
      naam: "Benen losdraaien",
      zone: "low",
      warmup: 5,
      cooldown: 5,
      blocks: (a: any) => [
        { kind: "steady", label: "Soepel", durMin: 20, pct: a(48) },
      ],
      tip: "Soepel draaien op hoge cadans.",
    },
  ];
}

/**
 * Bouwt de Trainingen-bibliotheek: per categorie tot 5 varianten met ZoneBar-
 * segmenten (+hoogtePct), blok-structuur (label/duur/watt) en zone-gewogen TSS —
 * alles uit de bestaande builders. `intent` {low,high,anaerobic} gaat mee zodat
 * de client de duur-slider live kan herrekenen (extra duur → Z2 → tssFromZoneMinutes_).
 * @return [{ key,label,zoneVar,omschrijving,defaultDur,type, variants:[...] }]
 */
export function getTrainingLibrary_(settings: any): any {
  return TRAINING_CATS_.map((cat: any) => {
    const pool =
      cat.type === "recovery" ? recoveryPool_() : getPool_(cat.type) || [];
    const variants = pool.slice(0, 5).map((v: any) => {
      const wo = renderVariant_(v, settings, 1, cat.fase, cat.defaultDur);
      return {
        variantId: v.id,
        naam: v.naam,
        type: cat.type,
        durMin: wo.totaalMin,
        intent: {
          low: wo.intent.low || 0,
          high: wo.intent.high || 0,
          anaerobic: wo.intent.anaerobic || 0,
        },
        segmenten: segmentsFromBlokken_(wo.blokken) || [],
        structuur: wo.structuur,
        tss: wo.tss,
        tip: v.tip || "",
      };
    });
    return {
      key: cat.key,
      label: cat.label,
      zoneVar: cat.zoneVar,
      omschrijving: cat.omschrijving,
      defaultDur: cat.defaultDur,
      type: cat.type,
      variants: variants,
    };
  });
}

// ── Day-override: bouw de gekozen workout (bibliotheek-variant óf vrije rit) ──
// Bibliotheek: render de SPECIFIEKE variant (variantId) op de gekozen duur; valt
// terug op buildWorkout(type) als de variant ontbreekt. Vrij/groep: synthese met
// één steady-blok (intensiteit → %FTP-zone) zodat TSS/zones bestaan voor Garmin.
export const FREE_RIDE_PCT_: any = { rustig: 65, tempo: 80, stevig: 96 };
export const FREE_RIDE_ZONE_: any = {
  rustig: "low",
  tempo: "high",
  stevig: "high",
};

export function buildFreeRideWorkout_(ov: any, settings: any): any {
  const dur = Math.max(20, Math.round(ov.durMin || 90));
  const pct = FREE_RIDE_PCT_[ov.intensiteit] || 65;
  const zone = FREE_RIDE_ZONE_[ov.intensiteit] || "low";
  const intent: any = { low: 0, high: 0, anaerobic: 0 };
  intent[zone] = dur;
  const label = ov.ritType === "groep" ? "Groepsrit" : "Vrije rit";
  return {
    naam: label + " · " + (ov.intensiteit || "rustig"),
    focus: "free",
    zones: [zone],
    totaalMin: dur,
    intent: intent,
    blokken: [{ minuten: dur, zone: pctZoneBucket_(pct) }],
    structuur: [
      [
        label,
        dur + " min",
        wattsRange(settings.ftp, pct - 8, pct + 4),
        "—",
        "Op gevoel rijden",
      ],
    ],
    tss: tssFromZoneMinutes_(intent),
    eindopmerking: label + " op gevoel — geen vaste blokstructuur.",
  };
}

export function buildOverrideWorkout_(
  ov: any,
  settings: any,
  mesoWeek: any,
  macroFase: any,
  eventCtx: any,
  dagIdx: any,
): any {
  if (!ov) return null;
  // T28 fase 2a-i: een bewuste RUSTDAG levert geen workout. null is hier geen fout-pad maar
  // de betekenis zelf — de caller zet de override-pin en laat de sessies leeg.
  if (ov.type === "rest") return null;
  if (ov.type === "free") return buildFreeRideWorkout_(ov, settings);
  const dur = Math.max(20, Math.round(ov.durMin || 60));
  if (ov.variantId) {
    const pool =
      ov.workoutType === "recovery"
        ? recoveryPool_()
        : getPool_(ov.workoutType);
    const v = pool ? findVariantById_(pool, ov.variantId) : null;
    if (v) return renderVariant_(v, settings, mesoWeek, macroFase, dur);
  }
  return buildWorkout(
    ov.workoutType,
    dur,
    settings,
    mesoWeek,
    macroFase,
    eventCtx,
    dagIdx,
  );
}

/** Generieke pools (doel-onafhankelijk): lange Z2 + tempo. */
export function genericPools_(): any {
  return {
    long_z2: [
      {
        id: "z2_steady",
        naam: "Lange Z2 steady",
        zone: "low",
        warmup: 10,
        cooldown: 5,
        blocks: (a: any) => [
          { kind: "steady", label: "Z2", durMin: 90, pct: a(70) },
        ],
        tip: "Continu Z2 — aerobe motor.",
      },
      {
        id: "z2_cadans",
        naam: "Z2 + hoge cadans",
        zone: "low",
        warmup: 10,
        cooldown: 5,
        blocks: (a: any) => [
          { kind: "steady", label: "Z2", durMin: 50, pct: a(70) },
          {
            kind: "int",
            label: "Hoge cadans 95+rpm",
            reps: 3,
            onMin: 10,
            onPct: a(72),
            offMin: 5,
            offPct: a(60),
          },
        ],
        tip: "Z2 met cadans-blokken 95+ rpm — pedaalefficiëntie.",
      },
      {
        id: "z2_progressief",
        naam: "Z2 progressief",
        zone: "low",
        warmup: 10,
        cooldown: 5,
        blocks: (a: any) => [
          { kind: "steady", label: "Z2", durMin: 70, pct: a(68) },
          { kind: "steady", label: "Bovenkant Z2", durMin: 20, pct: a(75) },
        ],
        tip: "Laatste 20% naar bovenkant Z2.",
      },
      {
        id: "z2_nuchter",
        naam: "Z2 nuchter",
        zone: "low",
        warmup: 10,
        cooldown: 5,
        blocks: (a: any) => [
          { kind: "steady", label: "Z2 nuchter", durMin: 80, pct: a(68) },
        ],
        tip: "Ochtend nuchter, strak Z2 — vetverbranding.",
      },
    ],
    tempo: [
      {
        id: "tempo_2x20",
        naam: "Tempo 2×20",
        zone: "high",
        warmup: 12,
        cooldown: 8,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "Tempo",
            reps: 2,
            onMin: 20,
            onPct: a(82),
            offMin: 5,
            offPct: 50,
          },
        ],
      },
      {
        id: "tempo_3x15",
        naam: "Tempo 3×15",
        zone: "high",
        warmup: 12,
        cooldown: 8,
        blocks: (a: any) => [
          {
            kind: "int",
            label: "Tempo",
            reps: 3,
            onMin: 15,
            onPct: a(80),
            offMin: 4,
            offPct: 50,
          },
        ],
      },
      {
        id: "tempo_45",
        naam: "Tempo 45min continu",
        zone: "high",
        warmup: 12,
        cooldown: 8,
        blocks: (a: any) => [
          { kind: "steady", label: "Tempo continu", durMin: 45, pct: a(78) },
        ],
      },
    ],
  };
}

/**
 * Bouwt een concrete workout. Variant-pools eerst, dan generieke/doel-
 * specifieke routing. macroFase/meso schalen intensiteit binnen de variant.
 */
export function buildWorkout(
  type: any,
  mins: any,
  settings: any,
  mesoWeek: any,
  macroFase: any,
  eventCtx?: any,
  slot?: any,
  archetypeId?: any,
  // T28 fase 3b-copy: richting van de pendelrit ('heen'/'terug'), alleen relevant voor
  // pendel_z2. Optioneel, default 'heen' → byte-identiek voor alle bestaande callers.
  leg: "heen" | "terug" = "heen",
): any {
  // FASE 1 deel 2b.2 — een gekozen archetype expandeert direct (overrulet de type-dispatch).
  // LIVE (niet inert): keyIntensity zet de archetypeId op :859 en de week-allocator via
  // quotaPlan op :626 — gemeten op de kwaliteitsdagen in Base/Build/Peak
  // (docs/RECENCY-1B-RECON.md §3). Onbekend id → val door naar de dispatch.
  if (archetypeId) {
    let arec = null;
    for (let ai = 0; ai < ARCHETYPES.length; ai++) {
      if (ARCHETYPES[ai].id === archetypeId) {
        arec = ARCHETYPES[ai];
        break;
      }
    }
    if (arec) {
      const awo = expandArchetype_(arec, {
        ftp: settings.ftp,
        lthr: settings.lthr,
        doelMin: mins,
        // 3d stap 2: mesoWeek voedt de kwaliteits-ramp (mesoFactor) in expandArchetype_.
        mesoWeek,
      });
      if (awo) {
        awo.archetypeId = archetypeId;
        return awo;
      }
    }
  }
  const doel = settings.doel;

  // Taper-workouts (event-driven laatste week)
  if (type === "taper_openers") return genericTaperOpeners(settings);
  if (type === "taper_z2_kort") return genericTaperZ2Kort(mins, settings);
  if (type === "tour_taper_z2")
    return genericTourTaperZ2(mins, settings, eventCtx);

  // long_z2 met event-context → endurance scaling (behoud event-feature)
  if (type === "long_z2" && eventCtx)
    return genericLongZ2(mins, settings, mesoWeek, eventCtx);

  // Variant-pool categorie? (vo2max/sweet_spot/threshold/tempo/long_z2/klim/conditie)
  if (getPool_(type)) {
    const variant = selectVariant_(type, weekIndexFromStart_(settings), slot);
    if (variant)
      return renderVariant_(variant, settings, mesoWeek, macroFase, mins);
  }

  // Klim-type-specifieke legacy workouts (nog callable; niet meer geselecteerd)
  if (type === "vo2_hill_repeats")
    return genericVo2HillRepeats(mins, settings, mesoWeek);
  if (type === "anaerobic_capacity")
    return genericAnaerobicCapacity(mins, settings, mesoWeek);
  if (type === "threshold_long")
    return genericThresholdLong(mins, settings, mesoWeek);
  if (type === "sweet_spot_long")
    return genericSweetSpotLong(mins, settings, mesoWeek);

  if (type === "recovery") return genericRecovery(mins, settings);
  if (type === "pendel_z2")
    return genericPendelZ2(mins, settings, mesoWeek, macroFase, leg);
  if (type.indexOf("pendel_") === 0 && type.indexOf("_intervals") > 0) {
    return genericPendelIntervals(
      type,
      mins,
      settings,
      mesoWeek,
      macroFase,
      doel,
    );
  }
  if (type.indexOf("combo_") === 0) {
    return genericCombo(type, mins, settings, mesoWeek, doel);
  }

  // Doel-specifieke library
  let wo;
  if (doel === "FTP")
    wo = workoutForFtp(type, mins, settings, mesoWeek, macroFase);
  else if (doel === "VO2max")
    wo = workoutForVo2max(type, mins, settings, mesoWeek, macroFase);
  else if (doel === "Conditie")
    wo = workoutForConditie(type, mins, settings, mesoWeek, macroFase);
  else if (doel === "Beklimmingen")
    wo = workoutForBeklimmingen(type, mins, settings, mesoWeek, macroFase);

  if (wo) return wo;

  // Fallback
  return genericRecovery(mins, settings);
}

// ─── Generieke workouts ──────────────────────────────────────────

/**
 * Lange Z2. Schaalt naar event-afstand wanneer eventCtx is meegegeven:
 * bouwt geleidelijk op naar 40→80% van de geschatte event-rijtijd in de
 * weken vóór het event (cap 5u). Bij bergachtig profiel (hm/km > 1.0)
 * worden klim-simulatie tempo/threshold blokken toegevoegd.
 */
export function genericLongZ2(
  mins: any,
  settings: any,
  mesoWeek: any,
  eventCtx?: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  // Beschikbaarheid (d.minuten via mins) is leidend; meso-factor mag nog
  // krimpen voor recovery-week. EventCtx geeft alleen het hilly-profiel,
  // NIET een duur-override (eerder werd 120 → 163 gepusht, fout).
  // 3d stap 2 — ENDURANCE-CAP: plannerMin (mins) is de HARDE bovengrens. Opbouwweek (f≥1) →
  // mins (geen ×f-overschrijding meer); deload (f<1) → mins×f. De week-op-week opbouw komt uit
  // de kwaliteits-tijd-in-zone, niet meer uit langere ritten (coach adviseert verlengen = 2b).
  const requested = Math.max(
    60,
    Math.min(mins || 90, Math.round((mins || 90) * mesoFactor(mesoWeek))),
  );

  const hilly = !!(
    eventCtx &&
    eventCtx.hm > 0 &&
    eventCtx.afstandKm > 0 &&
    eventCtx.hm / Math.max(1, eventCtx.afstandKm) > 1.0
  );

  // Duration-aware klim-sim: schaal het aantal 8-min reps zodat warmup +
  // klim + minimum Z2-base binnen de beschikbare tijd past. klimReps van
  // 3 → 2 → 1 als nodig; valt nooit onder 1 rep zolang de tab hilly is.
  const minBase = 30; // onder 30min Z2 base is een long-rit niet zinvol
  const overhead = 15; // 10 warmup + 5 cooldown
  let klimReps = 0;
  function klimMin_(r: number): number {
    return r * 8 + Math.max(0, r - 1) * 5;
  } // work + intra-rest
  if (hilly) {
    klimReps = 3;
    while (klimReps > 1 && overhead + klimMin_(klimReps) + minBase > requested)
      klimReps--;
  }
  const fixed = overhead + (hilly ? klimMin_(klimReps) : 0);
  const fits = requested >= fixed + minBase;
  const baseMin = fits ? requested - fixed : minBase;
  const totaalMin = fixed + baseMin;
  const tooLong = fits
    ? null
    : { available: requested, needed: fixed + minBase };

  let eind = "Volume zonder vermoeidheid — de basis voor alle andere workouts.";
  if (eventCtx && eventCtx.naam) {
    eind =
      "Bouw richting " +
      eventCtx.naam +
      " — " +
      (eventCtx.afstandKm || "?") +
      "km/" +
      (eventCtx.hm || "?") +
      "hm.";
  }
  if (hilly) eind += " Bergachtig profiel → klim-simulatie blokken erin.";

  let structuur;
  if (hilly) {
    structuur = [
      [
        "Warmup",
        "10 min",
        wattsRange(ftp, 50, 65),
        bpmBelow(lthr, 80),
        "Rustig opbouwen",
      ],
      [
        "Z2 base",
        baseMin + " min",
        wattsRange(ftp, 65, 75),
        bpmRange(lthr, 80, 89),
        "Stabiele Z2",
      ],
      [
        "Klim-sim",
        klimReps + "x 8 min",
        wattsRange(ftp, 88, 95),
        bpmRange(lthr, 92, 99),
        "5 min rust @ 60% — simuleert de cols",
      ],
      ["Cooldown", "5 min", wattsRange(ftp, 45, 55), "—", "Easy"],
    ];
  } else {
    structuur = [
      [
        "Warmup",
        "10 min",
        wattsRange(ftp, 50, 65),
        bpmBelow(lthr, 80),
        "Rustig opbouwen",
      ],
      [
        "Hoofd",
        baseMin + " min",
        wattsRange(ftp, 65, 75),
        bpmRange(lthr, 80, 89),
        "Stabiele Z2 — aerobic base",
      ],
      ["Cooldown", "5 min", wattsRange(ftp, 45, 55), "—", "Easy"],
    ];
  }

  // Intent: high (klim-sim work) is vast, low schaalt met base.
  const intent = hilly
    ? {
        low: 10 + baseMin + Math.max(0, klimReps - 1) * 5 + 5,
        high: klimReps * 8,
        anaerobic: 0,
      } // warmup + base + intra-rest + cooldown
    : { low: totaalMin, high: 0, anaerobic: 0 };

  // Geordende blokken voor de dashboard zone-balk (sluit de long_z2-gap +
  // fixt de onterechte gele staart: zonder blokken viel de balk terug op
  // de intent en kleurde klim-sim (high) geel i.p.v. groen/drempel).
  const blokken: any[] = [
    { minuten: 10, zone: "rust" },
    { minuten: baseMin, zone: "z2" },
  ];
  if (hilly) {
    for (let kr = 0; kr < klimReps; kr++) {
      blokken.push({ minuten: 8, zone: pctZoneBucket_(91) }); // 88-95% → drempel (groen)
      if (kr < klimReps - 1) blokken.push({ minuten: 5, zone: "z2" }); // intra-rust @ 60%
    }
  }
  blokken.push({ minuten: 5, zone: "rust" });

  return {
    naam: "Lange Z2 (" + totaalMin + " min)",
    focus: "aerobic base",
    zones: hilly ? ["low", "high"] : ["low"],
    totaalMin: totaalMin,
    structuur: structuur,
    intent: intent,
    blokken: blokken,
    tss: tssFromZoneMinutes_(intent),
    eindopmerking: eind,
    tooLong: tooLong,
  };
}

export function genericRecovery(mins: any, settings: any): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = Math.max(30, Math.min(60, mins || 45));
  return {
    naam: "Recovery (" + mins + " min)",
    focus: "recovery",
    zones: ["low"],
    totaalMin: mins,
    structuur: [
      [
        "Hele rit",
        mins + " min",
        wattsRange(ftp, 40, 55),
        bpmBelow(lthr, 75),
        "Praat-tempo, soepel benen",
      ],
    ],
    tss: Math.round(mins * 0.35),
    eindopmerking:
      "Bloed laten stromen, geen stress. Niet skippen — herstel is training.",
  };
}

// ─── Taper workouts (event-driven laatste week) ──────────────────

export function genericTaperOpeners(settings: any): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  return {
    naam: "Taper Openers (30 min)",
    focus: "sharpness",
    zones: ["anaerobic"],
    totaalMin: 30,
    structuur: [
      [
        "Warmup",
        "12 min",
        wattsRange(ftp, 50, 65),
        bpmBelow(lthr, 80),
        "Rustig opbouwen",
      ],
      [
        "Openers",
        "4x 30 sec",
        wattsRange(ftp, 110, 120),
        bpmRange(lthr, 95, 105),
        "90 sec rust @ 50% tussen reps",
      ],
      ["Cooldown", "8 min", wattsRange(ftp, 45, 55), "—", "Easy uit"],
    ],
    tss: 28,
    eindopmerking:
      "Benen wakker maken, niet vermoeien. Kort en scherp — fitness is al gemaakt.",
  };
}

export function genericTaperZ2Kort(mins: any, settings: any): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = Math.max(30, Math.min(45, Math.round((mins || 40) * 0.5)));
  return {
    naam: "Taper Z2 kort (" + mins + " min)",
    focus: "aerobic onderhoud",
    zones: ["low"],
    totaalMin: mins,
    structuur: [
      [
        "Hele rit",
        mins + " min",
        wattsRange(ftp, 60, 72),
        bpmRange(lthr, 78, 86),
        "Soepel, laag volume — fris blijven voor het event",
      ],
    ],
    tss: Math.round(mins * 0.6),
    eindopmerking:
      "Volume bewust gehalveerd. Niet opbouwen meer — fris worden is het doel.",
  };
}

export function genericTourTaperZ2(
  mins: any,
  settings: any,
  eventCtx?: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  // Tour-taper endurance: NIET halveren — volume vasthouden voor durability,
  // intensiteit blijft Z2. Gebruik beschikbare tijd tot een redelijk plafond.
  const dur = Math.max(45, Math.min(120, Math.round(mins || 75)));
  const warm = 8,
    cool = 5;
  const base = dur - warm - cool;
  let eind =
    "Endurance vasthouden voor durability — back-to-back dagen vragen zadeltijd. Intensiteit eruit, fris blijven.";
  if (eventCtx && eventCtx.naam)
    eind =
      "Richting " +
      eventCtx.naam +
      ": benen wennen aan uren, rustig aan. " +
      eind;
  return {
    naam: "Tour-taper Z2 (" + dur + " min)",
    focus: "aerobic onderhoud",
    zones: ["low"],
    totaalMin: dur,
    structuur: [
      [
        "Warmup",
        warm + " min",
        wattsRange(ftp, 50, 62),
        bpmBelow(lthr, 80),
        "Rustig op gang",
      ],
      [
        "Z2",
        base + " min",
        wattsRange(ftp, 62, 72),
        bpmRange(lthr, 76, 86),
        "Soepel, tijd vol benutten",
      ],
      ["Cooldown", cool + " min", wattsRange(ftp, 45, 55), "—", "Easy uit"],
    ],
    tss: Math.round(dur * 0.65),
    eindopmerking: eind,
  };
}

// ─── Klim-type-specifieke workouts (event-driven) ────────────────

export function genericVo2HillRepeats(
  mins: any,
  settings: any,
  _mesoWeek: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = mins || 70;
  return {
    naam: "VO2 Hill Repeats 9x90s",
    focus: "explosive climbing",
    zones: ["anaerobic"],
    totaalMin: mins,
    structuur: [
      [
        "Warmup",
        "15 min",
        wattsRange(ftp, 55, 80),
        bpmBelow(lthr, 92),
        "Inrijden + 3x 30s openers",
      ],
      [
        "Hill reps",
        "9x 90 sec",
        wattsRange(ftp, 112, 118),
        bpmRange(lthr, 100, 108),
        "2 min rust @ 50% — sta op bij de steile stukken",
      ],
      ["Cooldown", "12 min", wattsRange(ftp, 45, 55), "—", "Easy"],
    ],
    tss: Math.round(mins * 1.05),
    eindopmerking:
      "Korte explosieve klim-efforts voor punchy beklimmingen (Amstel/Ardennen) — herhaalbaar vermogen.",
  };
}

export function genericAnaerobicCapacity(
  mins: any,
  settings: any,
  _mesoWeek: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = mins || 60;
  return {
    naam: "Anaerobic Capacity 10x 30/30s",
    focus: "anaerobic capacity",
    zones: ["anaerobic"],
    totaalMin: mins,
    structuur: [
      [
        "Warmup",
        "15 min",
        wattsRange(ftp, 55, 80),
        bpmBelow(lthr, 92),
        "Inrijden + 2x 1min openers",
      ],
      [
        "30/30s",
        "10x 30 sec",
        wattsRange(ftp, 120, 130),
        bpmRange(lthr, 100, 110),
        "30 sec rust @ 50% — maximaal herhaalbaar",
      ],
      ["Cooldown", "10 min", wattsRange(ftp, 45, 55), "—", "Easy"],
    ],
    tss: Math.round(mins * 1.0),
    eindopmerking:
      "Korte, snelle herhalingen voor steile korte klimmetjes — anaerobe capaciteit + snel herstel.",
  };
}

export function genericThresholdLong(
  mins: any,
  settings: any,
  _mesoWeek: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = mins || 80;
  return {
    naam: "Threshold Long 3x14min",
    focus: "sustained climbing",
    zones: ["high"],
    totaalMin: mins,
    structuur: [
      [
        "Warmup",
        "15 min",
        wattsRange(ftp, 55, 75),
        bpmBelow(lthr, 90),
        "Inrijden + 1x 3min @ 90%",
      ],
      [
        "Threshold",
        "3x 14 min",
        wattsRange(ftp, 95, 102),
        bpmRange(lthr, 96, 100),
        "5 min rust @ 55% — pacing als een lange col",
      ],
      ["Cooldown", "10 min", wattsRange(ftp, 45, 55), "—", "Easy"],
    ],
    tss: Math.round(mins * 1.1),
    eindopmerking:
      "Sustained threshold voor lange alpine cols (Girona/Alpen) — leer uren in de klim-zone te pacen.",
  };
}

export function genericSweetSpotLong(
  mins: any,
  settings: any,
  _mesoWeek: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = mins || 85;
  return {
    naam: "Sweet Spot Long 3x20min",
    focus: "climbing endurance",
    zones: ["high"],
    totaalMin: mins,
    structuur: [
      [
        "Warmup",
        "15 min",
        wattsRange(ftp, 55, 70),
        bpmBelow(lthr, 88),
        "Inrijden",
      ],
      [
        "Sweet Spot",
        "3x 20 min",
        wattsRange(ftp, 88, 93),
        bpmRange(lthr, 92, 98),
        "6 min rust @ 50% — duurzame klim-belasting",
      ],
      ["Cooldown", "10 min", wattsRange(ftp, 45, 55), "—", "Easy"],
    ],
    tss: Math.round(mins * 1.0),
    eindopmerking:
      "Lange sweet spot blokken bouwen het vermogen om uren in de klim-zone te blijven.",
  };
}

export function genericPendelZ2(
  mins: any,
  settings: any,
  mesoWeek: any,
  macroFase: any,
  // T28 fase 3b-copy: welke rit van de pendeldag dit is. 'heen' is de default zodat élke
  // bestaande caller (buildWorkout zonder de nieuwe arg, de selftest) byte-identiek blijft.
  leg: "heen" | "terug" = "heen",
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = mins || 150;
  const isRecoveryWeek = mesoWeek === 4 || macroFase === "Recovery";
  return {
    naam: isRecoveryWeek
      ? "Pendel Z2 (" + mins + " min, recovery week)"
      : "Pendel + Z2 (" + mins + " min)",
    focus: "aerobic base",
    zones: ["low"],
    totaalMin: mins,
    // T28 fase 3b: ÉÉN blok. De oude "Heen"/"Terug"-splitsing beschreef twee richtingen
    // binnen wat sinds fase 3a één RIT is (pendelDuurMin = duur per rit), en gaf twee
    // identieke Z2-regels. Belasting ongewijzigd: totaalMin en tss staan los van de structuur.
    structuur: [
      [
        "Hele rit",
        mins + " min",
        wattsRange(ftp, 60, 72),
        bpmRange(lthr, 78, 86),
        "Rustige Z2",
      ],
    ],
    tss: Math.round(mins * 0.6),
    eindopmerking: isRecoveryWeek
      ? "Recovery-week pendel — geen intensiteit, alleen volume."
      : leg === "terug"
        ? "Rustige pendel — ontspannen naar huis."
        : "Rustige pendel — fris op werk aankomen.",
  };
}

export function genericPendelIntervals(
  type: any,
  mins: any,
  settings: any,
  _mesoWeek: any,
  _macroFase: any,
  doel: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;
  mins = mins || 150;
  const heen = Math.floor(mins / 2);

  let blok = ["—", "—", "—", "—", "—"];
  const isTrip = type === "pendel_trip_intervals";
  if (isTrip) {
    // Tocht/trip-pendel: sweet-spot/tempo (duurspecifiek), niet doel-FTP-intervallen.
    blok = [
      "Sweet spot",
      "2x15min",
      wattsRange(ftp, 86, 92),
      bpmRange(lthr, 90, 96),
      "Sweet spot / tempo — tocht-specifieke duurkracht",
    ];
  } else if (doel === "FTP") {
    blok = [
      "Intervallen",
      "3-4x 8min",
      wattsRange(ftp, 88, 94),
      bpmRange(lthr, 95, 102),
      "Sweet Spot blokken met 4 min rust ertussen",
    ];
  } else if (doel === "VO2max") {
    blok = [
      "Intervallen",
      "4-5x 3min",
      wattsRange(ftp, 108, 115),
      bpmRange(lthr, 100, 108),
      "VO2 reps, 3 min rust — sluit aan op verkeerslichten",
    ];
  } else if (doel === "Conditie") {
    blok = [
      "Tempo",
      "2-3x 12min",
      wattsRange(ftp, 76, 85),
      bpmRange(lthr, 88, 94),
      "Tempo blokken, 5 min rust ertussen",
    ];
  } else if (doel === "Beklimmingen") {
    blok = [
      "Lage cadans",
      "3-4x 8min @ 60-70rpm",
      wattsRange(ftp, 85, 92),
      bpmRange(lthr, 92, 100),
      "Lage cadans op een vals plat — kracht-uithouding",
    ];
  }

  // (B) Zone-gewogen tss: harde werkminuten (≈ vast, los van mins) → IF daalt bij langere pendel.
  const werkMin = isTrip
    ? 30
    : doel === "FTP"
      ? 28
      : doel === "VO2max"
        ? 14
        : doel === "Conditie"
          ? 30
          : doel === "Beklimmingen"
            ? 28
            : 24;
  const werkAnaeroob = !isTrip && doel === "VO2max";
  const pendelBuckets = {
    low: Math.max(0, mins - werkMin),
    high: werkAnaeroob ? 0 : werkMin,
    anaerobic: werkAnaeroob ? werkMin : 0,
  };

  return {
    naam: isTrip
      ? "Pendel + sweet spot (tocht, " + mins + " min)"
      : "Pendel + " + doel + " intervallen (" + mins + " min)",
    focus: "pendel + doel-specifiek",
    zones: workoutZones(type, doel),
    totaalMin: mins,
    structuur: [
      // T28 fase 3b: dit IS functioneel de warming-up vóór het werkblok; het oude label
      // "Heen Z2" suggereerde een heenrit binnen wat één rit is. Duur (floor(mins/2)) en
      // belasting ongewijzigd — puur het label.
      [
        "Warming-up",
        heen + " min",
        wattsRange(ftp, 60, 72),
        bpmRange(lthr, 78, 86),
        // Deze generic bouwt ALTIJD de terugrit; "naar werk" zou hier de verkeerde
        // richting impliceren.
        "Rustig op gang",
      ],
      blok,
      ["Cooldown", "5 min", wattsRange(ftp, 45, 55), "—", "Uitrijden"],
    ],
    tss: tssFromZoneMinutes_(pendelBuckets),
    eindopmerking: "Terugrit — pak je blok op de weg naar huis.",
  };
}

export function genericCombo(
  type: any,
  mins: any,
  settings: any,
  mesoWeek: any,
  doel: any,
): any {
  const ftp = settings.ftp,
    lthr = settings.lthr;

  if (type === "combo_long_with_efforts") {
    // Beschikbaarheid leidend (zelfde patroon als genericLongZ2).
    const requested = Math.max(60, mins || 120);
    const fixed = 75; // 15 warmup + 45 efforts (3×(10+5)) + 15 uitrijden
    const minBase = 30;
    const fits = requested >= fixed + minBase;
    const baseMin = fits ? requested - fixed : minBase;
    const totaalMin = fixed + baseMin;
    const tooLong = fits
      ? null
      : { available: requested, needed: fixed + minBase };

    return {
      naam: "Lange rit + " + doel + " efforts (" + totaalMin + " min)",
      focus: "volume + key zone",
      zones: ["low", "high"],
      totaalMin: totaalMin,
      structuur: [
        [
          "Warmup",
          "15 min",
          wattsRange(ftp, 55, 70),
          bpmBelow(lthr, 85),
          "Inrijden Z2",
        ],
        [
          "Z2 base",
          baseMin + " min",
          wattsRange(ftp, 65, 75),
          bpmRange(lthr, 80, 89),
          "Stabiele Z2",
        ],
        [
          "Efforts",
          "3x 10min",
          wattsRange(ftp, 85, 92),
          bpmRange(lthr, 92, 99),
          "Tempo/SS blokken, 5 min rust",
        ],
        ["Uitrijden", "15 min", wattsRange(ftp, 55, 65), "—", "Z2 uit"],
      ],
      // Intent: efforts work (30) is vast high, low = warmup + base + intra-rest + uitrijden
      intent: { low: 15 + baseMin + 10 + 15, high: 30, anaerobic: 0 },
      tss: Math.round(totaalMin * 0.85),
      eindopmerking:
        "Lange rit met geïntegreerde efforts — dekt low + high in één sessie.",
      tooLong: tooLong,
    };
  }

  if (type === "combo_z2_tempo") {
    mins = mins || 90;
    return {
      naam: "Z2 + Tempo combo (" + mins + " min)",
      focus: "aerobic + tempo",
      zones: ["low", "high"],
      totaalMin: mins,
      structuur: [
        [
          "Warmup",
          "10 min",
          wattsRange(ftp, 55, 70),
          bpmBelow(lthr, 85),
          "Inrijden",
        ],
        [
          "Z2",
          "30 min",
          wattsRange(ftp, 65, 75),
          bpmRange(lthr, 80, 89),
          "Stabiel",
        ],
        [
          "Tempo",
          "3x 10min",
          wattsRange(ftp, 76, 85),
          bpmRange(lthr, 88, 94),
          "3 min rust",
        ],
        ["Uitrijden", "10 min", wattsRange(ftp, 50, 60), "—", "Cooldown"],
      ],
      tss: Math.round(mins * 0.85),
      eindopmerking: "Klassieke Conditie-build: Z2 base met tempo blokken.",
    };
  }

  if (type === "combo_z2_vo2") {
    mins = mins || 75;
    return {
      naam: "Z2 + VO2 combo (" + mins + " min)",
      focus: "aerobic + VO2",
      zones: ["low", "anaerobic"],
      totaalMin: mins,
      structuur: [
        [
          "Warmup",
          "15 min",
          wattsRange(ftp, 55, 70),
          bpmBelow(lthr, 85),
          "Inrijden + 2x 1min openers",
        ],
        [
          "Z2",
          "20 min",
          wattsRange(ftp, 65, 75),
          bpmRange(lthr, 80, 89),
          "Stabiel",
        ],
        [
          "VO2",
          "4x 3min",
          wattsRange(ftp, 108, 115),
          bpmRange(lthr, 100, 108),
          "3 min rust",
        ],
        ["Uitrijden", "10 min", wattsRange(ftp, 50, 60), "—", "Cooldown"],
      ],
      tss: Math.round(mins * 0.9),
      eindopmerking: "Aerobic base + VO2 prikkel in één sessie.",
    };
  }

  if (type === "combo_ss_sprints") {
    mins = mins || 75;
    return {
      naam: "Sweet Spot + Sprints combo (" + mins + " min)",
      focus: "high + anaerobic",
      zones: ["high", "anaerobic"],
      totaalMin: mins,
      structuur: [
        [
          "Warmup",
          "15 min",
          wattsRange(ftp, 55, 70),
          bpmBelow(lthr, 85),
          "Inrijden",
        ],
        [
          "Sweet Spot",
          "2x 15min",
          wattsRange(ftp, 88, 93),
          bpmRange(lthr, 92, 98),
          "5 min rust",
        ],
        [
          "Sprints",
          "6x 15s all-out",
          ">" + watts(ftp, 200) + "W",
          "—",
          "4 min rust — full recovery",
        ],
        ["Uitrijden", "10 min", wattsRange(ftp, 50, 60), "—", "Cooldown"],
      ],
      tss: Math.round(mins * 0.9),
      eindopmerking: "Aerobic capacity + neuromuscular punch.",
    };
  }

  if (type === "combo_all_three") {
    mins = mins || 90;
    return {
      naam: "Alles in één (" + mins + " min)",
      focus: "low + high + anaerobic",
      zones: ["low", "high", "anaerobic"],
      totaalMin: mins,
      structuur: [
        [
          "Warmup",
          "15 min",
          wattsRange(ftp, 55, 70),
          bpmBelow(lthr, 85),
          "Inrijden + openers",
        ],
        [
          "Z2",
          "20 min",
          wattsRange(ftp, 65, 75),
          bpmRange(lthr, 80, 89),
          "Aerobic base",
        ],
        [
          "Sweet Spot",
          "2x 10min",
          wattsRange(ftp, 88, 92),
          bpmRange(lthr, 92, 98),
          "3 min rust",
        ],
        [
          "VO2",
          "4x 2min",
          wattsRange(ftp, 110, 115),
          bpmRange(lthr, 100, 108),
          "2 min rust",
        ],
        ["Uitrijden", "10 min", wattsRange(ftp, 50, 60), "—", "Cooldown"],
      ],
      tss: Math.round(mins * 0.95),
      eindopmerking: "Polariserende stack — niet vaker dan 1x per week.",
    };
  }

  return genericLongZ2(mins, settings, mesoWeek);
}
