import { assignWorkouts } from "@cadans/engine";
import type { SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";

// STAP 1 borging: legt per assignWorkouts-tak de (reden-string, redenCode)-koppeling vast door de
// engine-fn DIRECT te drijven met minimale, deterministische input. Verleden-datums (2026-03) houden
// de ambient-gedateerde week-allocator (allocateQualityWeek_) inert → de per-dag-takken sturen.
// De reden-STRINGS worden hier ook geasserteerd, zodat een byte-drift meteen opvalt.

interface GDay {
  dagIdx: number;
  type: string;
  datum: Date;
  minuten: number;
  train: boolean;
  gedaan: boolean;
  voorgesteldType: string | null;
  reden: string | null;
  redenCode: string | null;
  archetypeId: string | null;
}
interface Dekking {
  low: boolean;
  high: boolean;
  anaerobic: boolean;
}
interface Debt {
  low: number;
  high: number;
  anaerobic: number;
}

function settings(o: Partial<SettingsInput> = {}): SettingsInput {
  return {
    ftp: 280,
    lthr: 170,
    gewicht: 75,
    doel: "FTP",
    doelStart: null,
    hrMax: 190,
    hrRest: 45,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin: 80,
    pendelAantal: 2,
    ...o,
  };
}

function d(iso: string, type: string, dagIdx = 0, minuten = 60): GDay {
  const [y, m, day] = iso.split("-").map(Number);
  return {
    dagIdx,
    type,
    datum: new Date(y as number, (m as number) - 1, day as number),
    minuten,
    train: true,
    gedaan: false,
    voorgesteldType: null,
    reden: null,
    redenCode: null,
    archetypeId: null,
  };
}

const DEK_ALL: Dekking = { low: true, high: true, anaerobic: true };
const NORMAL = { signal: "normal" };

// Drijf assignWorkouts en geef de gemuteerde dagen terug (types-los t.o.v. de engine-`any`-signatuur).
function run(
  days: GDay[],
  opts: {
    mesoWeek?: number;
    macroFase?: string;
    dekking?: Dekking;
    wellness?: { signal: string };
    recentHardDate?: Date | null;
    debt?: Debt | null;
    isTripEvent?: boolean;
    taperCtx?: { datum: Date; venster: number; isTrip: boolean } | null;
    doel?: string;
  } = {},
): GDay[] {
  assignWorkouts(
    days,
    settings(opts.doel ? { doel: opts.doel } : {}),
    opts.mesoWeek ?? 1,
    opts.macroFase ?? "Base",
    opts.dekking ?? { ...DEK_ALL },
    opts.wellness ?? NORMAL,
    null,
    opts.recentHardDate ?? null,
    opts.debt ?? null,
    opts.isTripEvent ?? false,
    opts.taperCtx ?? null,
    days,
  );
  return days;
}

describe("assignWorkouts redenCode ↔ reden-string koppeling (per tak)", () => {
  it("recovery_post_race (event-recovery week)", () => {
    const [x] = run([d("2026-03-11", "vrij")], { macroFase: "Recovery" });
    expect(x.reden).toBe("Herstel — herstelweek na A-race");
    expect(x.redenCode).toBe("recovery_post_race");
  });

  it("taper_openers + taper_race_short (race-taper)", () => {
    const days = run([d("2026-03-11", "vrij", 0), d("2026-03-12", "vrij", 1)], {
      taperCtx: { datum: new Date(2026, 2, 14), venster: 7, isTrip: false },
    });
    expect(days[0].reden).toBe("Openers — kort en scherp voor de wedstrijd");
    expect(days[0].redenCode).toBe("taper_openers");
    expect(days[1].reden).toBe("Korte taper-rit — vers worden");
    expect(days[1].redenCode).toBe("taper_race_short");
  });

  it("taper_trip_short + taper_trip_endurance (trip-taper)", () => {
    const days = run([d("2026-03-13", "vrij", 0), d("2026-03-10", "vrij", 1)], {
      taperCtx: { datum: new Date(2026, 2, 14), venster: 7, isTrip: true },
    });
    // 03-13 = 1 dag voor taper (≤2) → short; 03-10 = 4 dagen (>2) → endurance.
    expect(days[0].reden).toBe("Korte taper-rit — vers worden voor de trip");
    expect(days[0].redenCode).toBe("taper_trip_short");
    expect(days[1].reden).toBe("Taper-duurrit — durability vasthouden");
    expect(days[1].redenCode).toBe("taper_trip_endurance");
  });

  it("recovery_week (meso-recovery)", () => {
    const [x] = run([d("2026-03-11", "vrij")], { mesoWeek: 4 });
    expect(x.reden).toBe("Herstel — herstelweek");
    expect(x.redenCode).toBe("recovery_week");
  });

  it("test (testweek)", () => {
    const [x] = run([d("2026-03-11", "vrij")], { macroFase: "Test" });
    expect(x.reden).toBe("Test — FTP/conditie bepalen");
    expect(x.redenCode).toBe("test");
  });

  it("commute (pendeldag)", () => {
    const [x] = run([d("2026-03-11", "pendel")]);
    expect(x.reden).toBe("Pendelrit — vaste woon-werkrit");
    expect(x.redenCode).toBe("commute");
  });

  it("catchup_high (weekend, high-debt forceert combo)", () => {
    const [x] = run([d("2026-03-14", "weekend")], {
      debt: { low: 0, high: 40, anaerobic: 0 },
    });
    expect(x.reden).toBe("Inhaalsessie — intensiteit tekort");
    expect(x.redenCode).toBe("catchup_high");
  });

  it("catchup_anaerobic (weekend, anaerobic-debt forceert combo)", () => {
    const [x] = run([d("2026-03-14", "weekend")], {
      debt: { low: 0, high: 0, anaerobic: 25 },
    });
    expect(x.reden).toBe("Inhaalsessie — anaeroob tekort");
    expect(x.redenCode).toBe("catchup_anaerobic");
  });

  it("long_weekend (weekend zonder low-dekking)", () => {
    const [x] = run([d("2026-03-14", "weekend")], {
      dekking: { low: false, high: false, anaerobic: false },
    });
    expect(x.reden).toBe("Lange duurrit — weekend");
    expect(x.redenCode).toBe("long_weekend");
  });

  it("long_with_efforts (weekend, high-gat buiten Base)", () => {
    const [x] = run([d("2026-03-14", "weekend")], {
      macroFase: "Build",
      dekking: { low: true, high: false, anaerobic: false },
    });
    expect(x.reden).toBe("Lange rit met blokken — intensiteit aanvullen");
    expect(x.redenCode).toBe("long_with_efforts");
  });

  it("catchup_low|high|anaerobic (vrij, debt-voorkeur per bucket)", () => {
    const low = run([d("2026-03-11", "vrij")], {
      debt: { low: 10, high: 0, anaerobic: 0 },
    })[0];
    expect(low.reden).toBe("Inhaalsessie — duur tekort");
    expect(low.redenCode).toBe("catchup_low");

    const high = run([d("2026-03-11", "vrij")], {
      debt: { low: 0, high: 10, anaerobic: 0 },
    })[0];
    expect(high.reden).toBe("Inhaalsessie — intensiteit tekort");
    expect(high.redenCode).toBe("catchup_high");

    const anaer = run([d("2026-03-11", "vrij")], {
      debt: { low: 0, high: 0, anaerobic: 10 },
    })[0];
    expect(anaer.reden).toBe("Inhaalsessie — anaeroob tekort");
    expect(anaer.redenCode).toBe("catchup_anaerobic");
  });

  it("key_session (vrij, sleutelsessie)", () => {
    const [x] = run([d("2026-03-11", "vrij")]);
    expect(x.reden).toBe("Sleutelsessie · FTP — fase Base");
    expect(x.redenCode).toBe("key_session");
  });

  it("recovery_scheduled (ingeroosterde rustdag)", () => {
    const [x] = run([d("2026-03-11", "recovery")]);
    expect(x.reden).toBe("Herstel — ingeroosterd");
    expect(x.redenCode).toBe("recovery_scheduled");
  });

  it("easy_no_key (onbekend dagtype → rustige dag)", () => {
    const [x] = run([d("2026-03-11", "anders")]);
    expect(x.reden).toBe("Rustige dag — geen sleutelprikkel nodig");
    expect(x.redenCode).toBe("easy_no_key");
  });

  it("demote_recent_hard (dag na een harde dag → downgrade)", () => {
    const [x] = run([d("2026-03-11", "vrij")], {
      debt: { low: 0, high: 20, anaerobic: 0 }, // vrij → sweet_spot (HARD)
      recentHardDate: new Date(2026, 2, 10), // dag ervoor was hard
    });
    expect(x.reden).toBe("Rustige duurrit — dag na een zware dag");
    expect(x.redenCode).toBe("demote_recent_hard");
  });

  it("demote_wellness_rest (wellness recovery-pass)", () => {
    const [x] = run([d("2026-03-11", "vrij")], {
      wellness: { signal: "recovery" },
    });
    expect(x.reden).toBe("Herstel — wellness laag");
    expect(x.redenCode).toBe("demote_wellness_rest");
  });

  it("demote_wellness_light (wellness demote-pass)", () => {
    const [x] = run([d("2026-03-11", "vrij")], {
      debt: { low: 0, high: 20, anaerobic: 0 }, // sweet_spot → demoteType_ → tempo
      wellness: { signal: "demote" },
    });
    expect(x.reden).toBe("Lichter gehouden — wellness laag");
    expect(x.redenCode).toBe("demote_wellness_light");
  });
});

// 2a.1: de vier WEEK-ALLOCATOR-takken (quality/longride/longride_efforts/endurance) vereisen de
// allocator ACTIEF — anders dan de inerte-datum-units hierboven. Trigger: macroFase ∈ Base/Build/Peak
// + eligible dagen (allocateQualityWeek_'s eligible_ eist datum ≥ ambient `new Date()`). Daarom
// VER-toekomstige datums (2035) → altijd eligible, ongeacht wanneer CI draait → deterministisch.
// Dag 0 is strikt de langste → krijgt de lange-rit-rol en wordt als eerste verwerkt (lastHardDate
// nog null → geen avoid-consecutive-hard-downgrade op die dag).
describe("assignWorkouts redenCode ↔ reden (week-allocator ACTIEF)", () => {
  // 6 vrij-dagen; dag 0 = 240 min (langste → lange rit), rest 60 min.
  function allocWeek(): GDay[] {
    return [
      d("2035-03-05", "vrij", 0, 240),
      d("2035-03-06", "vrij", 1, 60),
      d("2035-03-07", "vrij", 2, 60),
      d("2035-03-08", "vrij", 3, 60),
      d("2035-03-09", "vrij", 4, 60),
      d("2035-03-10", "vrij", 5, 60),
    ];
  }

  it("FTP/Base plaatst long_ride + endurance + key_session (quality via debt-preclaim)", () => {
    // debt high forceert een quality-pre-claim (sweet_spot) → deterministische key_session-plaatsing;
    // FTP heeft effortsInLangeRit:false → de lange rit = rol 'longride' (long_ride).
    const days = allocWeek();
    run(days, { macroFase: "Base", debt: { low: 0, high: 40, anaerobic: 0 } });

    expect(
      days.some(
        (x) =>
          x.reden === "Lange duurrit — week-plaatsing" &&
          x.redenCode === "long_ride",
      ),
    ).toBe(true);
    expect(
      days.some(
        (x) =>
          x.reden === "Duurrit — week-plaatsing" && x.redenCode === "endurance",
      ),
    ).toBe(true);
    expect(
      days.some(
        (x) =>
          x.reden === "Sleutelsessie · FTP — fase Base (week-plaatsing)" &&
          x.redenCode === "key_session",
      ),
    ).toBe(true);
  });

  it("Beklimmingen/Build plaatst long_with_efforts (lange rit met efforts)", () => {
    // Beklimmingen-profiel heeft effortsInLangeRit:true → in Build wordt de lange rit rol
    // 'longride_efforts' (combo_long_with_efforts) → reden "Lange rit met efforts — week-plaatsing".
    const days = allocWeek();
    run(days, { doel: "Beklimmingen", macroFase: "Build" });

    expect(
      days.some(
        (x) =>
          x.reden === "Lange rit met efforts — week-plaatsing" &&
          x.redenCode === "long_with_efforts",
      ),
    ).toBe(true);
  });
});
