import { isHardType_ } from "@cadans/engine";
import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildWeekProposal, type ProposalWeek } from "./proposal";

// DOELEN-SPEC 3.2 — het Onderhoud-profiel als winterfix: quotum 3 in elke fase, tussenruimte 1, geen
// mesocyclus. Klok gepind; de plannerweek ligt volledig vooruit (today = maandag).

const MAANDAG = new Date(2026, 2, 9, 8, 0, 0);
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MAANDAG);
});
afterAll(() => {
  vi.useRealTimers();
});

const iso = (n: number) => {
  const d = new Date(2026, 2, 9 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const TODAY = iso(0);

function settings(doel: string, doelStart: string): SettingsInput {
  return {
    ftp: 280,
    lthr: 170,
    gewicht: 75,
    doel,
    doelStart,
    hrMax: 190,
    hrRest: 45,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin: 80,
    pendelAantal: 2,
  };
}

function plannerDays(min: Record<number, number>): PlannerDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: iso(n),
    train: min[n] != null,
    dag: null,
    minuten: min[n] ?? 0,
    dagtype: min[n] == null ? null : n === 5 || n === 6 ? "weekend" : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
}

function plan(
  doel: string,
  doelStart: string,
  min: Record<number, number>,
  mesoWeekOverride?: number,
) {
  return buildWeekProposal({
    settings: settings(doel, doelStart),
    plannerDays: plannerDays(min),
    events: [],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: TODAY,
    mesoWeekOverride,
  });
}
// Vooruit-plan-vingerafdruk (sessie-dragende velden) — voor het VERSCHIL, niet de inhoud.
const vooruit = (r: ProposalWeek) =>
  JSON.stringify(
    r.days.map((d) => {
      const s = d.sessions[0];
      return {
        vt: d.voorgesteldType,
        naam: s?.naam ?? null,
        min: s?.totaalMin ?? null,
      };
    }),
  );
const hardDagen = (r: ProposalWeek, doel: string) =>
  r.days.filter((d) => isHardType_(d.voorgesteldType, doel)).length;
const isHard = (r: ProposalWeek, dagIdx: number, doel: string) =>
  isHardType_(r.days[dagIdx]?.voorgesteldType, doel);

const DS_BASE = isoOf(new Date(2026, 2, 9 - 0)); // doelStart vandaag → Onderhoud fase Base
const DS_DELOAD = "2026-02-16"; // off21 → niet-Onderhoud kalender-deload (mesoWeek 4)

describe("Onderhoud-profiel winterfix", () => {
  it("winterweek di45/do45/za90/zo60 → 3 kwaliteitsdagen (was 2)", () => {
    const r = plan("Onderhoud", DS_BASE, { 1: 45, 3: 45, 5: 90, 6: 60 });
    expect(hardDagen(r, "Onderhoud")).toBe(3);
  });

  // DOELEN-SPEC stap 2: met de 12 nieuwe sjablonen heeft de band 45 min genoeg diepte dat drie
  // sleutelsessies drie VERSCHILLENDE archetypes krijgen (was: 2 sjablonen over 3 dagen).
  it("3 dagen van 45 min → 3 kwaliteitsdagen met 3 VERSCHILLENDE archetypeIds", () => {
    const r = plan("Onderhoud", DS_BASE, { 1: 45, 3: 45, 5: 45 });
    const ids = r.days
      .filter((d) => isHardType_(d.voorgesteldType, "Onderhoud"))
      .map((d) => d.archetypeId);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it("3 dagen van 60 gespreid (di/do/za) → 3 kwaliteitsdagen", () => {
    const r = plan("Onderhoud", DS_BASE, { 1: 60, 3: 60, 5: 60 });
    expect(hardDagen(r, "Onderhoud")).toBe(3);
  });

  it("3 OPEENVOLGENDE dagen van 60 (di/wo/do) → de tussenruimte beschermt herstel (midden niet hard)", () => {
    const r = plan("Onderhoud", DS_BASE, { 1: 60, 2: 60, 3: 60 });
    // gap 1 → geen 3 harde dagen op rij; de woensdag (midden) valt terug op herstel/Z2.
    expect(isHard(r, 2, "Onderhoud")).toBe(false);
    expect(hardDagen(r, "Onderhoud")).toBeLessThan(3);
  });

  it("mesocyclus uit: een blokweek die bij FTP een kalender-deload is, is dat bij Onderhoud NIET", () => {
    const week = { 1: 60, 3: 60, 5: 120, 6: 60 };
    const rFtp = plan("FTP", DS_DELOAD, week);
    const rOnd = plan("Onderhoud", DS_DELOAD, week);
    expect(rFtp.mesoWeek).toBe(4); // FTP: kalender-deload
    expect(rOnd.mesoWeek).toBe(1); // Onderhoud: effectiveMesoWeek_ dwingt 1 af (geen deload)
    // FTP-deload stript de kwaliteit tot één lichte prikkel; Onderhoud houdt de volle quota.
    expect(hardDagen(rOnd, "Onderhoud")).toBeGreaterThan(
      hardDagen(rFtp, "FTP"),
    );
  });

  // HERSTELROUTE-VOORRANG (DOELEN-SPEC 3.2, stap 1b nog open). We leggen de VOORRANG vast, niet de
  // deload-INHOUD — die inhoud gaat nog veranderen, dus een inhoud-assert zou onterecht afgaan.
  it("Onderhoud zonder override op een would-be-deload-blokweek = normale week (geen deload-inhoud)", () => {
    const r = plan("Onderhoud", DS_DELOAD, { 1: 45, 3: 45, 5: 90, 6: 60 });
    expect(r.mesoWeek).toBe(1); // effectiveMesoWeek_ → geen kalender-deload
    expect(hardDagen(r, "Onderhoud")).toBe(3); // volle quota, niet de één-prikkel-deload
  });

  it("Onderhoud MET mesoWeekOverride 4 wijkt af van diezelfde week zonder override (override bereikt de engine)", () => {
    const week = { 1: 45, 3: 45, 5: 90, 6: 60 };
    const zonder = plan("Onderhoud", DS_BASE, week);
    const met = plan("Onderhoud", DS_BASE, week, 4);
    // De fatigue-override HOUDT VOORRANG (proposal.ts checkt hem vóór effectiveMesoWeek_): de mesoweek-4
    // wat-als bereikt de engine en verandert de week. We asserteren HET VERSCHIL, niet welke week.
    expect(vooruit(met)).not.toBe(vooruit(zonder));
  });
});
