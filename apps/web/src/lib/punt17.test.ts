import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ActValuesRow } from "./activities";
import { blokUitvoering, buildBlokReferent } from "./blok";
import { buildWeekProposal } from "./proposal";
import { buildWeekplanEntries } from "./weekplanBlob";
import { planZone5_, ZONE5_GRENZEN_DEFAULT } from "./zonemunt";

// ROADMAP punt 17 — DE UITVOERINGS-REFERENT IS PLAN-RELATIEF.
// Spec: docs/PUNT17-BOUWDOC.md §7 (de drie termen) en §9 (acceptatie).
//
// De oude regel legde de geleverde minuten langs een DOEL-BREED getal (`blokDosisNorm`). Gemeten
// over 405 blok-cellen liet die een blok waarin 25 procent van drempel plus anaeroob naar tempo
// was verschoven in 286 cellen als GELEVERD lezen, en bij 50 procent nog in 88 — de speling zat
// in de SCHAAL van de zone-norm: `normTempo` is dosis × 0,2821, een bibliotheek-gemiddelde,
// terwijl het plan van V1 in Build bij Korte beklimmingen 4,0 tempo voorschrijft tegen een
// normTempo van 22.
//
// GEEN handgezette ProposalWeek en geen handgezette norm: `buildWeekProposal` bouwt de week,
// `planZone5_` vouwt hem, de activiteit voert hem uit en `buildBlokReferent` oordeelt. Alleen zo
// bewijst groen dat de PRODUCENT de waarde ook levert.

const DOEL = "Korte beklimmingen";
const DOELSTART = "2026-06-29";
const BLOKSTART = "2026-07-27";

/** V1 uit weekvormAs.test.ts: ma60 di60 do60 za120. Geen pendeldagen. */
const V1: Record<number, number> = { 0: 60, 1: 60, 3: 60, 5: 120 };

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: DOEL,
  doelStart: DOELSTART,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};

const schuif_ = (monday: string, n: number) => {
  const [y, m, d] = monday.split("-").map(Number);
  const dt = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

function plannerDays_(monday: string): PlannerDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: schuif_(monday, n),
    train: V1[n] != null,
    dag: null,
    minuten: V1[n] ?? 0,
    dagtype: V1[n] == null ? null : n === 5 || n === 6 ? "weekend" : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
}

/** Eén activiteit die exact deze zoneminuten draagt. idx0 Date, idx1 type, idx3 duur, idx15 sec.
 *
 * `Math.round`, identiek aan `ritMet_` in punt15.test.ts, en dat is hier een BEWUSTE keuze. Het
 * plan draagt fracties van een seconde (de eerste blokweek vraagt 4,043478… tempo-minuten =
 * 242,6 s) terwijl de meetkant HELE SECONDEN levert, dus een perfect uitgevoerd plan landt
 * onvermijdelijk een fractie naast het plan — hier 0,39 seconde ONDER. Met `Math.ceil` zou de
 * fixture altijd nét boven het plan uitkomen en zou deze toets de tolerantie nooit raken: dat is
 * de nulmeting op de uitkomst kiezen. `round` is wat een echte rit doet. */
function ritMet_(datumISO: string, z: Record<string, number>): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row = new Array(17).fill(null) as ActValuesRow;
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, 9, 0, 0);
  row[1] = "Ride";
  row[3] = Object.values(z).reduce((a, b) => a + b, 0);
  row[15] = JSON.stringify([
    { id: "Z1", secs: Math.round((z.rust ?? 0) * 60) },
    { id: "Z2", secs: Math.round((z.z2 ?? 0) * 60) },
    { id: "Z3", secs: Math.round((z.tempo ?? 0) * 60) },
    { id: "Z4", secs: Math.round((z.drempel ?? 0) * 60) },
    { id: "Z5", secs: Math.round((z.anaeroob ?? 0) * 60) },
  ]);
  return row;
}

type Zones = Record<string, number>;

/** Het hele blok van vier weken: per week het ECHTE plan, gevouwen naar zoneminuten. De klok staat
 * per week op de eigen maandag — de allocator leest hem, dus een vaste klok zou de latere weken
 * een ander plan geven dan ze in productie krijgen. */
function blokPlan_(): { weekplans: unknown[]; planPerWeek: Zones[] } {
  const weekplans: unknown[] = [];
  const planPerWeek: Zones[] = [];
  for (let i = 0; i < 4; i++) {
    const monday = schuif_(BLOKSTART, i * 7);
    const [y, m, d] = monday.split("-").map(Number);
    vi.setSystemTime(new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, 8, 0, 0));
    const w = buildWeekProposal({
      settings: SETTINGS,
      plannerDays: plannerDays_(monday),
      events: [
        {
          id: 1,
          datum: "2027-04-17",
          naam: "A-race",
          type: "race",
          prioriteit: "A",
        },
      ],
      activities: [],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: monday,
      dosisTrede: 0,
    } as never);
    const entries = buildWeekplanEntries(w as never, DOEL) as unknown[];
    weekplans.push(...entries);
    const rauw = entries.flatMap((e) => {
      const b = (e as { blokken?: unknown }).blokken;
      return Array.isArray(b) ? b : [];
    });
    planPerWeek.push(planZone5_(rauw, ZONE5_GRENZEN_DEFAULT) as never);
  }
  return { weekplans, planPerWeek };
}

const referent_ = (
  weekplans: unknown[],
  activities: ActValuesRow[],
  todayOffset = 28,
) =>
  buildBlokReferent({
    doelStart: DOELSTART,
    activities,
    doel: DOEL,
    weekUren: 5,
    startMonday: BLOKSTART,
    todayISO: schuif_(BLOKSTART, todayOffset),
    grenzen: ZONE5_GRENZEN_DEFAULT,
    weekplans,
  });

beforeAll(() => {
  vi.useFakeTimers();
});
afterAll(() => {
  vi.useRealTimers();
});

describe("punt 17 — de referent meet tegen het PLAN van die week", () => {
  it("T1 — exact volgens plan gereden: alle drie de opbouwweken op norm, blok geleverd", () => {
    const { weekplans, planPerWeek } = blokPlan_();
    const activities = planPerWeek.map((zm, i) =>
      ritMet_(schuif_(BLOKSTART, i * 7 + 1), zm),
    );
    const r = referent_(weekplans, activities);
    if (!r) throw new Error("referent onverwacht null");

    const opbouw = r.weeks.filter((w) => w.blokWeek <= 3);
    // DE AS DIE ERTOE DOET: de norm was VLAK, het plan draagt de meso-ramp. Alle drie de weken
    // langslopen zet die as vast; één week zou hem juist verbergen.
    expect(opbouw.map((w) => w.telt)).toEqual([true, true, true]);
    expect(
      opbouw.map((w) => Number(w.planWerk.toFixed(1))),
      "de meso-ramp staat in het plan, niet in een vlakke norm",
    ).toEqual([68.5, 76.3, 79.5]);
    expect(opbouw.map((w) => Number(w.planDrempel.toFixed(1)))).toEqual([
      39.8, 41.5, 46.7,
    ]);
    for (const w of opbouw) {
      expect(w.poortHerkomst, w.weekMonday).toBe("week");
      expect(w.totaalOpNorm, w.weekMonday).toBe(true);
      expect(w.geleverdOk, w.weekMonday).toBe(true);
    }
    expect(blokUitvoering(r).geleverd).toBe(true);
    expect(blokUitvoering(r).beoordeeldeWeken).toBe(3);
  });

  it("T2 — de helft van drempel plus anaeroob verschoven naar tempo: blok NIET geleverd", () => {
    const { weekplans, planPerWeek } = blokPlan_();
    // Zelfde TOTAAL aan werkminuten, ander KARAKTER. Precies de grijs-rijden-signatuur die de
    // doel-brede norm in 88 van de 405 cellen als geleverd boekte.
    const grijs = planPerWeek.map((zm) => {
      const weg = (zm.drempel ?? 0) * 0.5 + (zm.anaeroob ?? 0) * 0.5;
      return {
        ...zm,
        tempo: (zm.tempo ?? 0) + weg,
        drempel: (zm.drempel ?? 0) * 0.5,
        anaeroob: (zm.anaeroob ?? 0) * 0.5,
      };
    });
    const activities = grijs.map((zm, i) =>
      ritMet_(schuif_(BLOKSTART, i * 7 + 1), zm),
    );
    const r = referent_(weekplans, activities);
    if (!r) throw new Error("referent onverwacht null");
    for (const w of r.weeks.filter((w) => w.blokWeek <= 3)) {
      expect(w.geleverdOk, w.weekMonday).toBe(false);
    }
    expect(blokUitvoering(r).geleverd).toBe(false);
  });

  it("T3 — 0,7 maal elke werkzone gereden: blok NIET geleverd", () => {
    const { weekplans, planPerWeek } = blokPlan_();
    const mager = planPerWeek.map((zm) => ({
      ...zm,
      tempo: (zm.tempo ?? 0) * 0.7,
      drempel: (zm.drempel ?? 0) * 0.7,
      anaeroob: (zm.anaeroob ?? 0) * 0.7,
    }));
    const activities = mager.map((zm, i) =>
      ritMet_(schuif_(BLOKSTART, i * 7 + 1), zm),
    );
    const r = referent_(weekplans, activities);
    if (!r) throw new Error("referent onverwacht null");
    for (const w of r.weeks.filter((w) => w.blokWeek <= 3)) {
      expect(w.geleverdOk, w.weekMonday).toBe(false);
    }
    expect(blokUitvoering(r).geleverd).toBe(false);
  });

  it("T4 — derde opbouwweek zonder eigen bewaard plan telt NIET mee; het blok spreekt op twee", () => {
    const { weekplans, planPerWeek } = blokPlan_();
    const activities = planPerWeek.map((zm, i) =>
      ritMet_(schuif_(BLOKSTART, i * 7 + 1), zm),
    );
    // De entries van de DERDE opbouwweek verdwijnen; de rit blijft staan. Zonder de nieuwe
    // `telt`-poort zou die week een plan-werktotaal van 0 zien en TRIVIAAL geleverd lezen.
    const derde = schuif_(BLOKSTART, 14);
    const zondag = schuif_(derde, 6);
    const zonderDerde = weekplans.filter((e) => {
      const d = (e as { datum?: unknown }).datum;
      return typeof d !== "string" || d < derde || d > zondag;
    });
    expect(zonderDerde.length).toBeLessThan(weekplans.length);

    const r = referent_(zonderDerde, activities);
    if (!r) throw new Error("referent onverwacht null");
    const w3 = r.weeks.find((w) => w.blokWeek === 3);
    expect(w3?.poortHerkomst).toBe("blok");
    expect(w3?.telt, "week zonder eigen plan telt niet mee").toBe(false);
    expect(w3?.geleverdOk).toBeNull();
    expect(w3?.planWerk).toBe(0);

    const u = blokUitvoering(r);
    expect(u.beoordeeldeWeken, "het blok spreekt op de twee overgebleven").toBe(
      2,
    );
    expect(u.geleverd).toBe(true);
  });

  it("T5 — banden zonder WERKZONE-label tellen niet mee: de poort leest de herkomst, niet het plan", () => {
    // ISOLEERT TERM C. `plan.werk > 0` en `poortHerkomst === "week"` vallen in elk normaal geval
    // samen, dus zonder dit geval is de herkomst-clausule niet rood te krijgen — GEMETEN: met
    // alleen die clausule vervangen door de oude punt-14-eis bleef de hele suite van 956 groen.
    //
    // Het discriminerende geval: een BEWAARDE entry waarvan de blokken wél een drempel-BAND
    // dragen maar een label dat geen werkzone is. `planZone5_` leest de band en levert dus
    // werkminuten, terwijl `werkzoneLabelsVan_` niets herkent en de poortset leeg blijft. Zonder
    // de herkomst-eis zou zo'n week MEETELLEN met een lege poortset, en dan is de per-zone-eis
    // triviaal waar (0 van 0 zones op norm) en valt het oordeel alleen nog op het totaal — een
    // half oordeel dat als heel leest.
    const { weekplans, planPerWeek } = blokPlan_();
    const activities = planPerWeek.map((zm, i) =>
      ritMet_(schuif_(BLOKSTART, i * 7 + 1), zm),
    );
    const derde = schuif_(BLOKSTART, 14);
    const zondag = schuif_(derde, 6);
    const vervangen = weekplans.filter((e) => {
      const d = (e as { datum?: unknown }).datum;
      return typeof d !== "string" || d < derde || d > zondag;
    });
    vervangen.push({
      datum: schuif_(derde, 1),
      blokken: [{ minuten: 45, zone: "duur", pctLo: 92, pctHi: 100 }],
    });

    const r = referent_(vervangen, activities);
    if (!r) throw new Error("referent onverwacht null");
    const w3 = r.weeks.find((w) => w.blokWeek === 3);
    // Het plan draagt wél werkminuten — de band ligt in de drempel-zone.
    expect(w3?.planWerk).toBeGreaterThan(0);
    // Maar de LABELS herkennen geen werkzone, dus deze week draagt geen eigen poortset.
    expect(w3?.poortHerkomst).not.toBe("week");
    expect(w3?.telt).toBe(false);
    expect(w3?.geleverdOk).toBeNull();
  });

  it("T6 — CONGRUENTIE: een zone telt op norm dan en slechts dan als de GETOONDE cijfers dat zeggen", () => {
    // DE REGEL DIE HIER VASTLIGT: over elke meegetelde week en elke voorgeschreven zone geldt
    // `zone op norm` <-> `Math.round(geleverd) >= norm`, met `norm` exact het getal dat de kaart
    // rendert. Zonder die gelijkheid kan de terugblik `VO2max 8/8` tonen naast een teller `0/2`,
    // en dat stond er ook echt (docs/PUNT17-BOUWDOC.md, shot doel-passend/01-week).
    //
    // DE FIXTURE MAG NIET EXACT VOLGENS PLAN RIJDEN. Bij geleverd gelijk aan plan geven de oude
    // en de nieuwe regel hetzelfde antwoord in 2160 van de 2160 zone-cellen, dus zo'n fixture is
    // per constructie groen onder beide regels en bewijst niets. De afwijking varieert daarom per
    // week en per zone, en er zit een geval bij dat de twee regels UIT ELKAAR trekt: geleverd
    // ONDER de onafgeronde plan-waarde terwijl beide op hetzelfde gehele getal afronden. Die
    // waarde wordt AFGELEID uit het plan van de fixture, nooit als literal geschreven.
    const { weekplans, planPerWeek } = blokPlan_();

    const p0 = planPerWeek[0];
    const p1 = planPerWeek[1];
    const p2 = planPerWeek[2];
    if (!p0 || !p1 || !p2) throw new Error("plan onverwacht leeg");

    // Week 1 — DE ZONE-GRENS. Net onder de onafgeronde plan-drempel, zelfde afronding.
    const grensDrempel = Math.round(p0.drempel ?? 0) - 0.5;
    expect(
      grensDrempel,
      "de grenswaarde moet ONDER het plan liggen",
    ).toBeLessThan(p0.drempel ?? 0);
    expect(Math.round(grensDrempel)).toBe(Math.round(p0.drempel ?? 0));

    // Week 2 — DE TOTAAL-GRENS. Het totaal moet RUIM onder de onafgeronde plan-werktotaal zakken
    // en tóch op hetzelfde gehele getal afronden; een gat van één seconde volstaat niet, want dat
    // valt binnen elke tolerantie die de oude regel zou dragen en dan scheidt de toets niets meer.
    // Mikpunt is daarom vier tienden ONDER het afgeronde plan: dat rondt terug naar hetzelfde
    // gehele getal en ligt tientallen seconden van het plan af.
    const planWerk1 = (p1.tempo ?? 0) + (p1.drempel ?? 0) + (p1.anaeroob ?? 0);
    const totaalDoel = Math.round(planWerk1) - 0.4;
    expect(
      totaalDoel,
      "de totaal-grens moet ONDER het plan liggen",
    ).toBeLessThan(planWerk1);
    expect(Math.round(totaalDoel)).toBe(Math.round(planWerk1));
    const totaalGat = planWerk1 - totaalDoel;

    const gereden = [
      {
        ...p0,
        tempo: (p0.tempo ?? 0) + 20,
        drempel: grensDrempel,
        anaeroob: (p0.anaeroob ?? 0) * 1.5,
      },
      { ...p1, anaeroob: (p1.anaeroob ?? 0) - totaalGat },
      {
        ...p2,
        tempo: (p2.tempo ?? 0) * 0.9,
        drempel: (p2.drempel ?? 0) * 1.2,
        anaeroob: (p2.anaeroob ?? 0) * 0.5,
      },
      { ...(planPerWeek[3] ?? {}) },
    ];
    const activities = gereden.map((zm, i) =>
      ritMet_(schuif_(BLOKSTART, i * 7 + 1), zm as Zones),
    );

    const r = referent_(weekplans, activities);
    if (!r) throw new Error("referent onverwacht null");
    const geteld = r.weeks.filter((w) => w.telt);
    expect(geteld.length).toBeGreaterThan(0);

    // (1) DE CONGRUENTIE, per zone. `zoneRegels` draagt exact wat de kaart rendert.
    for (const w of geteld) {
      let opNorm = 0;
      for (const rij of w.zoneRegels) {
        if (!w.zonesVoorgeschreven.includes(rij.zone)) continue;
        if (rij.norm == null)
          throw new Error("voorgeschreven zone zonder norm");
        if (Math.round(rij.geleverd) >= rij.norm) opNorm++;
      }
      expect(w.zonesOpNorm, `${w.weekMonday} zones op norm`).toBe(opNorm);
    }

    // (2) DE CONGRUENTIE, op het totaal.
    for (const w of geteld) {
      const som = w.geleverdTempo + w.geleverdDrempel + w.geleverdAnaeroob;
      expect(w.totaalOpNorm, `${w.weekMonday} totaal`).toBe(
        Math.round(som) >= w.gevraagd,
      );
    }

    // (3) DE FIXTURE IS DISCRIMINEREND, en dat is hier een assertie en geen aanname: zonder deze
    // twee zou (1) en (2) ook groen zijn onder de oude tolerantie-regel.
    const planVan = (w: (typeof geteld)[number], z: string) =>
      z === "tempo"
        ? w.planTempo
        : z === "drempel"
          ? w.planDrempel
          : w.planAnaeroob;
    const grensZones = geteld.flatMap((w) =>
      w.zoneRegels.filter(
        (rij) =>
          w.zonesVoorgeschreven.includes(rij.zone) &&
          rij.geleverd < planVan(w, rij.zone) &&
          Math.round(rij.geleverd) === rij.norm,
      ),
    );
    expect(
      grensZones.length,
      "geen enkele zone op de grens: deze toets scheidt de twee regels dan niet",
    ).toBeGreaterThan(0);

    const grensTotalen = geteld.filter((w) => {
      const som = w.geleverdTempo + w.geleverdDrempel + w.geleverdAnaeroob;
      return som < w.planWerk && Math.round(som) === w.gevraagd;
    });
    expect(
      grensTotalen.length,
      "geen enkel totaal op de grens: deze toets scheidt de twee regels dan niet",
    ).toBeGreaterThan(0);
  });
});
