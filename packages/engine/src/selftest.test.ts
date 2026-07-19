/**
 * selftest.test.ts — vitest port of the FTP-Coach Apps Script SelfTest.gs
 * pure-engine test-gate. Fidelity-critical transcription: every expected
 * value, input, and assertion is copied VERBATIM from SelfTest.gs. Do not
 * "fix", round, or relax anything here — this file is the correctness oracle.
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  ACT_HEADERS,
  ACT_ID_IDX,
  ACT_ZONE_TIMES_IDX,
  ARCHETYPE_EFFECT_TAGS,
  ARCHETYPE_STRUCTUURTYPES,
  ARCHETYPES,
  actAnchorDate_,
  activeGoalProfile_,
  activityToRow_,
  actualZoneMinutes_,
  allocateQualityWeek_,
  archetypeFixtures_,
  assignWorkouts,
  buildFreeRideWorkout_,
  buildOverrideWorkout_,
  buildWorkout,
  CHECKIN_LEVELS,
  COACH_INTENT_ENGINE_TYPE_,
  COACH_TYPE_INTENT_,
  cfNormIf_,
  checkinDelta_,
  coachAdaptatie_,
  coachAlignment_,
  coachFeedback_,
  coachIntentFromZones_,
  combineSignals_,
  computeMacroPhase,
  computeNiveau_,
  ctlApproachWeeks_,
  ctlAtWeek_,
  ctlPlateauFromVolume_,
  ctlReeksMaandelijks_,
  DEMOTE_MAP,
  DOEL_OPTIONS,
  dashActualsByDate_,
  dashBeginAnker_,
  dashNiveauReeks_,
  dashStatsFromActivities_,
  doelTestWeken_,
  dslBlockFromRow_,
  dslPowerRange_,
  effectiveMacroFase_,
  eftpFromActivities_,
  eventFase_,
  expandArchetype_,
  expectedRpe_,
  formatDate,
  formStateFromWellness_,
  ftpBandFromProjection_,
  GOAL_KWALITEIT_INTENTS_,
  GOAL_PROFILES_,
  gatherWeekplanEntries_,
  getReadinessScore_,
  getTrainingLibrary_,
  goalEffWeights_,
  goalGap_,
  goalPickIntent_,
  goalWorkout_,
  hhmmFromMin_,
  INTENT_PRIMARY_BUCKET_,
  intentFromIF_,
  intentFromType_,
  intentHaalbaar_,
  keyIntensity,
  maxRecentRideH_,
  mergeById_,
  niveauProgressie_,
  niveauTier_,
  PROFILES,
  pcMarkerAt_,
  pcNormalize_,
  pctZoneBucket_,
  planModeLabel_,
  profileForDoel_,
  READINESS_PRESETS,
  rdDurHms_,
  rdDurMs_,
  rdPctFtp_,
  rdWkg_,
  rdyClamp_,
  readinessAdjust_,
  recencyFromWeekplan_,
  recentHardDate_,
  riderTypeFromCurve_,
  rollingZoneCoverage_,
  rpeSignal_,
  snapshotDayAction_,
  sortActivityRowsNewestFirst_,
  stripTime_,
  tssFromZoneMinutes_,
  tssPerHourRecent_,
  volumeModulatie,
  watts,
  weeklyHoursRecent_,
  weekPlanSummary_,
  wellnessSignal_,
  workoutZones,
  zoneActsByDateFromTab_,
  zoneDebt_,
  zoneTimesFromCell_,
} from "./index";

// ── assert helpers with a module-level counter (replaces the ctx-based ones) ──
let assertCount = 0;
function assert_(name: string, expected: any, actual: any) {
  assertCount++;
  expect(actual, name).toBe(expected);
}
function assertClose_(name: string, expected: any, actual: any, eps = 0.01) {
  assertCount++;
  expect(Math.abs(actual - expected), name).toBeLessThanOrEqual(eps);
}

// ── top-level test helpers ported from SelfTest.gs ──────────────────
function _dcRow_(date: any, o?: any): any {
  o = o || {};
  const r: any = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  r[0] = date;
  if (o.naam !== undefined) r[2] = o.naam;
  if (o.min !== undefined) r[3] = o.min;
  if (o.ifv !== undefined) r[7] = o.ifv;
  if (o.tss !== undefined) r[8] = o.tss;
  if (o.ftp !== undefined) r[12] = o.ftp;
  if (o.gew !== undefined) r[13] = o.gew;
  return r;
}
function _dcDayOffset_(n: number): any {
  return new Date(stripTime_(new Date()).getTime() - n * 86400000);
}
function _dcFindMaand_(arr: any, mk: any): any {
  for (let i = 0; i < arr.length; i++) if (arr[i].maand === mk) return arr[i];
  return null;
}

function _mkAct_(id: any, iso: any, extra?: any): any {
  const a: any = {
    type: "Ride",
    name: "Rit",
    start_date_local: iso,
    moving_time: 3600,
    icu_training_load: 50,
  };
  if (id != null) a.id = id;
  if (extra)
    Object.keys(extra).forEach((k) => {
      a[k] = extra[k];
    });
  return a;
}

// 12-koloms WELL_HEADERS-rij (idx0 Datum · idx2 HRV · idx3 Slaap · idx8 CTL ·
// idx9 ATL · idx11 Ramp) — de input voor wellnessSignal_/formStateFromWellness_.
function _wrow_(o: any): any {
  const r: any = new Array(12).fill("");
  if (o.date !== undefined) r[0] = o.date;
  if (o.hrv !== undefined) r[2] = o.hrv;
  if (o.slaap !== undefined) r[3] = o.slaap;
  if (o.ctl !== undefined) r[8] = o.ctl;
  if (o.atl !== undefined) r[9] = o.atl;
  if (o.ramp !== undefined) r[11] = o.ramp;
  return r;
}

// 17-koloms actValues-rij voor de weekprep-fns: idx0 Datum(Date) · idx1 Type ·
// idx7 IF · idx15 Zone-tijden (JSON-string).
function _wpRow_(date: Date, o: any): any {
  const r: any = new Array(17).fill("");
  r[0] = date;
  r[1] = o.type !== undefined ? o.type : "Ride";
  if (o.iff !== undefined) r[7] = o.iff;
  if (o.zoneJson !== undefined) r[15] = o.zoneJson;
  return r;
}

describe("engine selftest", () => {
  beforeAll(() => {
    assertCount = 0;
  });

  // ── tssFromZoneMinutes_ (puur) ──────────────────────────────────────
  it("testTss", () => {
    assert_(
      "tss low-only",
      42,
      tssFromZoneMinutes_({ low: 60, high: 0, anaerobic: 0 }),
    );
    assert_(
      "tss high-only",
      57,
      tssFromZoneMinutes_({ low: 0, high: 60, anaerobic: 0 }),
    );
    assert_(
      "tss anaerobic-only",
      63,
      tssFromZoneMinutes_({ low: 0, high: 0, anaerobic: 60 }),
    );
    assert_(
      "tss mixed",
      47,
      tssFromZoneMinutes_({ low: 40, high: 20, anaerobic: 0 }),
    );
    assert_("tss empty", 0, tssFromZoneMinutes_({}));
    assert_(
      "tss monotone-low",
      true,
      tssFromZoneMinutes_({ low: 120 }) > tssFromZoneMinutes_({ low: 60 }),
    );
  });

  // ── checkinDelta_ (puur, leest CHECKIN_LEVELS) ──────────────────────
  it("testCheckinDelta", () => {
    assert_(
      "checkin all-worst",
      -6,
      checkinDelta_({ slaap: "slecht", benen: "zwaar", stress: "hoog" }),
    );
    assert_(
      "checkin all-best",
      6,
      checkinDelta_({ slaap: "goed", benen: "fris", stress: "laag" }),
    );
    assert_(
      "checkin neutral",
      0,
      checkinDelta_({ slaap: "matig", benen: "normaal", stress: "normaal" }),
    );
    assert_("checkin null", 0, checkinDelta_(null));
    assert_(
      "checkin unknown-level",
      0,
      checkinDelta_({ slaap: "xyz", benen: "normaal", stress: "normaal" }),
    );
  });

  // ── rdyClamp_ (puur) — dekt "clamp base+delta binnen 0–100" ─────────
  it("testClamp", () => {
    assert_("clamp over", 100, rdyClamp_(105));
    assert_("clamp under", 0, rdyClamp_(-5));
    assert_("clamp mid", 50, rdyClamp_(50));
  });

  // ── computeNiveau_ (puur) ───────────────────────────────────────────
  it("testNiveau", () => {
    assertClose_("niveau wkg1 → 0", 0, computeNiveau_(70, 70).niveau);
    assertClose_("niveau wkg6.9 → 50", 50, computeNiveau_(690, 100).niveau);
    assertClose_("niveau mid → 25", 25, computeNiveau_(395, 100).niveau);
    assertClose_(
      "niveau clamp-high → 50",
      50,
      computeNiveau_(1000, 100).niveau,
    );
    assertClose_("niveau clamp-low → 0", 0, computeNiveau_(35, 70).niveau);
    assert_("niveau null-ftp", null, computeNiveau_(null, 70).niveau);
    assert_("niveau null-gewicht", null, computeNiveau_(295, null).niveau);
    // Niveau-tab progressie (Fase 7) — ctlReeksMaandelijks_ (daily PMC) + niveauProgressie_.
    function actRow_(d: any, tss: any) {
      const r: any = [];
      r[0] = d;
      r[8] = tss;
      return r;
    }
    assert_("ctl leeg → {}", 0, Object.keys(ctlReeksMaandelijks_([])).length);
    const c1 = ctlReeksMaandelijks_([actRow_(new Date(2026, 0, 15), 100)]);
    assertClose_("ctl 1-rit", 2.4, c1["2026-01"], 0.05);
    const c2 = ctlReeksMaandelijks_([
      actRow_(new Date(2026, 0, 31), 42),
      actRow_(new Date(2026, 1, 1), 42),
    ]);
    assertClose_("ctl maand jan", 1.0, c2["2026-01"], 0.05);
    assertClose_(
      "ctl maand feb (build + maand-eind wint)",
      2.0,
      c2["2026-02"],
      0.05,
    );
    const np = niveauProgressie_(
      [{ maand: "2026-01", niveau: 25, ftp: 275, gewicht: 72 }],
      { "2026-01": 40 },
    );
    assert_("prog lengte", 1, np.length);
    assertClose_("prog wkg", 3.82, np[0].wkg, 0.001);
    assert_("prog ctl", 40, np[0].ctl);
    assert_("prog lege reeks → []", 0, niveauProgressie_([], {}).length);
    assert_(
      "prog wkg null bij geen gewicht",
      null,
      niveauProgressie_(
        [{ maand: "x", niveau: 10, ftp: 275, gewicht: null }],
        {},
      )[0].wkg,
    );
  });

  // ── computeMacroPhase (puur) — week-offsets + isTestWeek ────────────
  it("testMacroPhase", () => {
    const t0 = new Date(2026, 0, 5); // ma 5 jan 2026 (alle test-dagen < DST-grens 29 mrt)
    const m1 = computeMacroPhase(t0, new Date(2026, 0, 5)); // week 1
    assert_("macro w1 fase", "Base", m1.fase);
    assert_("macro w1 week", 1, m1.week);
    assert_("macro w1 isTest", false, m1.isTestWeek);
    assert_(
      "macro w5 build",
      "Build",
      computeMacroPhase(t0, new Date(2026, 1, 2)).fase,
    ); // +28d
    assert_(
      "macro w9 peak",
      "Peak",
      computeMacroPhase(t0, new Date(2026, 2, 2)).fase,
    ); // +56d
    const m12 = computeMacroPhase(t0, new Date(2026, 2, 23)); // +77d
    assert_("macro w12 test", "Test", m12.fase);
    assert_("macro w12 isTest", true, m12.isTestWeek);
    assert_("macro w12 week-clamp", 12, m12.week);
  });

  // ── eventFase_ (puur) — referentie-datum vanaf vandaag + A-taper ≤7d ──
  it("testEventFase", () => {
    function ev(jaar: any, maand0: any, dag: any, prio: any, type: any) {
      return {
        datum: new Date(jaar, maand0, dag),
        prioriteit: prio,
        type: type,
        naam: "X",
      };
    }
    const woe = new Date(2026, 5, 10); // wo 10 jun 2026 (week-maandag = ma 8 jun)

    // A-event op exact A_TAPER_DAGEN (7) dagen → Taper (venster 7); vanaf vandaag.
    const t7 = eventFase_([ev(2026, 5, 17, "A", "race")], woe);
    assert_("eventFase A@7d fase", "Taper", t7.fase);
    assert_("eventFase A@7d dagen", 7, t7.dagenTot);
    assert_("eventFase A@7d venster", 7, t7.taperVenster);

    // A-event op 8 dagen → net buiten taper → Peak (wekenTot = 2), geen taper.
    const t8 = eventFase_([ev(2026, 5, 18, "A", "race")], woe);
    assert_("eventFase A@8d fase", "Peak", t8.fase);
    assert_("eventFase A@8d venster", 0, t8.taperVenster);

    // Ver A-event (≥ 9 wkn) → Base.
    assert_(
      "eventFase verA fase",
      "Base",
      eventFase_([ev(2026, 7, 15, "A", "race")], woe).fase,
    );

    // A-race eerder deze week (ma 8 jun, ref = do 11 jun) → Recovery.
    const rec = eventFase_(
      [ev(2026, 5, 8, "A", "race")],
      new Date(2026, 5, 11),
    );
    assert_("eventFase recovery fase", "Recovery", rec.fase);

    // Geen hoofd-event → null (val terug op vaste meso in bepaalFaseVoorDatum_).
    assert_("eventFase geen event", null, eventFase_([], woe));

    // ── Deel 2: B-mini-taper. A staat ruim weg (macro = Base); B/C dichtbij. ──
    const Aver = ev(2026, 7, 15, "A", "race"); // ~9+ wkn → macro Base

    // B op 3 dagen → Taper (venster 3); B drijft de taper, macro blijft Base.
    const b3 = eventFase_([Aver, ev(2026, 5, 13, "B", "race")], woe);
    assert_("eventFase B@3d fase", "Taper", b3.fase);
    assert_("eventFase B@3d venster", 3, b3.taperVenster);
    assert_("eventFase B@3d macro", "Base", b3.macroFase);

    // B op 4 dagen → buiten B-venster → geen taper → macro Base.
    assert_(
      "eventFase B@4d fase",
      "Base",
      eventFase_([Aver, ev(2026, 5, 14, "B", "race")], woe).fase,
    );

    // C op 1 dag → C telt nooit → geen taper → macro Base.
    assert_(
      "eventFase C@1d fase",
      "Base",
      eventFase_([Aver, ev(2026, 5, 11, "C", "race")], woe).fase,
    );
  });

  // ── getReadinessScore_ (factor-subs/dots puur; band via consistentie) ──
  it("testReadiness", () => {
    function findF(res: any, key: any): any {
      let hit: any = null;
      (res.factors || []).forEach((f: any) => {
        if (f.key === key) hit = f;
      });
      return hit;
    }
    function bandRule(score: any) {
      return score >= 62 ? "ready" : score >= 48 ? "caution" : "rest";
    }
    const well = {
      hrvDeficit: 0,
      hrvRecent: 50,
      sleepAvg3: 7,
      sleepLastNight: 7,
    };

    // Factor-dot op de LIVE constante (≥67 good / 34–66 warn / <34 muted).
    // reeks=[] → geen richting-nudge, dus vtSub = rdyLerp_(form,-30,10) exact.
    const good = getReadinessScore_(
      { form: 2, ctl: 50, atl: 45, ramp: 3 },
      well,
      [],
    ); // vtSub 80
    const warn = getReadinessScore_(
      { form: -10, ctl: 50, atl: 45, ramp: 3 },
      well,
      [],
    ); // vtSub 50
    const muted = getReadinessScore_(
      { form: -25, ctl: 50, atl: 45, ramp: 3 },
      well,
      [],
    ); // vtSub 12.5
    assert_("rdy dot good", "good", (findF(good, "vormTrend") || {}).dot);
    assert_("rdy dot warn", "warn", (findF(warn, "vormTrend") || {}).dot);
    assert_("rdy dot muted", "muted", (findF(muted, "vormTrend") || {}).dot);

    // Missing-factor → rescale over de rest, geen harde nul.
    const miss = getReadinessScore_(
      { form: 2, ctl: 50, atl: 45, ramp: 3 },
      { hrvDeficit: null, hrvRecent: null, sleepAvg3: 7 },
      [],
    );
    const hrvF = findF(miss, "hrv");
    assert_("rdy missing hrv sub", null, hrvF ? hrvF.sub : "NO-FACTOR");
    assert_("rdy missing hrv dot", "muted", hrvF ? hrvF.dot : "NO-FACTOR");
    assert_("rdy missing score not-null", true, typeof miss.score === "number");

    // Band ↔ score-consistentie (check-in-robuust; valideert de 62/48-drempels).
    [good, warn, muted, miss].forEach((r: any, i: any) => {
      assert_("rdy band-consistent #" + i, bandRule(r.score), r.band);
    });
  });

  // ── Constanten ──────────────────────────────────────────────────────
  it("testConstants", () => {
    const p = READINESS_PRESETS.objectief;
    assertClose_("preset vormTrend", 0.3, p.vormTrend, 0.0001);
    assertClose_("preset belasting", 0.3, p.belasting, 0.0001);
    assertClose_("preset hrv", 0.25, p.hrv, 0.0001);
    assertClose_("preset slaap", 0.15, p.slaap, 0.0001);
    assertClose_(
      "preset sum = 1.00",
      1.0,
      p.vormTrend + p.belasting + p.hrv + p.slaap,
      0.0001,
    );
    assert_("checkin slaap slecht", -2, CHECKIN_LEVELS.slaap.slecht);
    assert_("checkin slaap goed", 2, CHECKIN_LEVELS.slaap.goed);
    assert_("checkin stress laag", 2, CHECKIN_LEVELS.stress.laag);
  });

  // ── niveauTier_ (puur) — Fase 3 deel 4 band-grenzen ─────────────────
  it("testTier", () => {
    assert_("tier 14 Beginner", "Beginner", niveauTier_(14));
    assert_("tier 15 Gemiddeld", "Gemiddeld", niveauTier_(15));
    assert_("tier 24 Gemiddeld", "Gemiddeld", niveauTier_(24));
    assert_("tier 25 Gevorderd", "Gevorderd", niveauTier_(25));
    assert_("tier 34 Gevorderd", "Gevorderd", niveauTier_(34));
    assert_("tier 35 Vergevorderd", "Vergevorderd", niveauTier_(35));
    assert_("tier 44 Vergevorderd", "Vergevorderd", niveauTier_(44));
    assert_("tier 45 Elite", "Elite", niveauTier_(45));
  });

  // ── WeekLoad sliver (puur): hhmmFromMin_ + weekPlanSummary_ ──────────
  it("testWeekLoad", () => {
    assert_("hhmm 190", "3:10", hhmmFromMin_(190));
    assert_("hhmm 0", "0:00", hhmmFromMin_(0));
    assert_("hhmm 300", "5:00", hhmmFromMin_(300));
    assert_("hhmm 65", "1:05", hhmmFromMin_(65));
    const s = weekPlanSummary_([
      { tss: 80, minuten: 90 },
      { tss: 140, minuten: 100 },
      { tss: 0, minuten: 0 },
    ]);
    assert_("plan tss", 220, s.tss);
    assert_("plan min", 190, s.min);
    assert_("plan dagen excl-0", 2, s.dagen);
    assert_(
      "plan multi-session=1dag",
      1,
      weekPlanSummary_([{ tss: 120, minuten: 160 }]).dagen,
    );
    assert_("plan empty tss", 0, weekPlanSummary_([]).tss);
    assert_("plan empty dagen", 0, weekPlanSummary_([]).dagen);
  });

  // ── getTrainingLibrary_ (puur) — integriteit van de Trainingen-bibliotheek ──
  it("testTrainingLibrary", () => {
    const settings = {
      ftp: 250,
      lthr: 160,
      doel: "FTP",
      doelStart: new Date(2026, 0, 5),
    };
    const lib = getTrainingLibrary_(settings);
    assert_("lib 6 categorieën", 6, lib.length);
    let pctOk = true; // elke library-segment draagt numerieke pctLo/pctHi (pctLo<=pctHi) — voedt de client-wattlijst
    lib.forEach((cat: any) => {
      assert_("lib cat niet-leeg: " + cat.key, true, cat.variants.length > 0);
      cat.variants.forEach((v: any) => {
        assert_(
          "lib type match: " + cat.key + "/" + v.variantId,
          cat.type,
          v.type,
        );
        assert_("lib tss>0: " + cat.key + "/" + v.variantId, true, v.tss > 0);
        assert_(
          "lib segs>0: " + cat.key + "/" + v.variantId,
          true,
          (v.segmenten || []).length > 0,
        );
        (v.segmenten || []).forEach((s: any) => {
          if (
            !(
              typeof s.pctLo === "number" &&
              typeof s.pctHi === "number" &&
              s.pctLo <= s.pctHi
            )
          )
            pctOk = false;
        });
      });
    });
    assert_("lib segs pctLo/pctHi numeriek", true, pctOk);
  });

  // ── buildOverrideWorkout_ / buildFreeRideWorkout_ (puur) — day-override ──
  it("testDayOverride", () => {
    const settings = {
      ftp: 250,
      lthr: 160,
      doel: "FTP",
      doelStart: new Date(2026, 0, 5),
    };
    // Vrije rit (stevig) → geldige werk-zone + TSS>0 + duur behouden.
    const fr = buildOverrideWorkout_(
      { type: "free", ritType: "vrij", intensiteit: "stevig", durMin: 90 },
      settings,
      1,
      "Build",
      null,
      0,
    );
    assert_("override free tss>0", true, fr.tss > 0);
    assert_("override free duur", 90, fr.totaalMin);
    assert_("override free zones", true, (fr.zones || []).length > 0);
    // Rustige vrije rit → low-bucket → TSS < duur (IF<1).
    const frR = buildFreeRideWorkout_(
      { type: "free", ritType: "groep", intensiteit: "rustig", durMin: 60 },
      settings,
    );
    assert_(
      "override free rustig laag",
      true,
      frR.tss > 0 && frR.tss < frR.totaalMin,
    );
    // Bibliotheek-override op een specifieke variant → resolvet + TSS>0.
    const lib = getTrainingLibrary_(settings);
    const vo2 = lib.filter((c: any) => c.type === "vo2max")[0];
    const wo = buildOverrideWorkout_(
      {
        type: "library",
        workoutType: "vo2max",
        variantId: vo2.variants[0].variantId,
        durMin: 75,
      },
      settings,
      1,
      "Peak",
      null,
      0,
    );
    assert_("override lib tss>0", true, wo.tss > 0);
    assert_("override lib resolved", true, !!wo.naam);
  });

  // ── STAP 2 — readinessAdjust_ (puur) — band×fase×isHard → keep/demote ──
  it("testReadinessAdjust", () => {
    function adj(type: any, isHard: any, band: any, macroFase: any) {
      return readinessAdjust_({ type: type, isHard: isHard }, band, macroFase);
    }
    assert_(
      "rdyAdj ready+hard keep",
      "keep",
      adj("vo2max", true, "ready", "Build").action,
    );
    const a1 = adj("threshold", true, "caution", "Build");
    assert_("rdyAdj caution threshold action", "demote", a1.action);
    assert_("rdyAdj caution threshold toType", "tempo", a1.toType);
    assert_("rdyAdj caution threshold intensiteit", "tempo", a1.intensiteit);
    const a2 = adj("vo2_3015", true, "caution", "Build");
    assert_("rdyAdj caution vo2_3015 toType", "long_z2", a2.toType);
    assert_("rdyAdj caution vo2_3015 intensiteit", "rustig", a2.intensiteit);
    assert_(
      "rdyAdj caution vo2max toType",
      "tempo",
      adj("vo2max", true, "caution", "Build").toType,
    );
    assert_(
      "rdyAdj caution !hard keep",
      "keep",
      adj("long_z2", false, "caution", "Build").action,
    );
    const a3 = adj("vo2max", true, "rest", "Build");
    assert_("rdyAdj rest action", "demote", a3.action);
    assert_("rdyAdj rest toType", "recovery", a3.toType);
    assert_("rdyAdj rest intensiteit", "rustig", a3.intensiteit);
    assert_("rdyAdj rest reden", "rest_key", a3.reden);
    assert_(
      "rdyAdj rest !hard keep",
      "keep",
      adj("long_z2", false, "rest", "Build").action,
    );
    assert_(
      "rdyAdj caution Taper keep",
      "keep",
      adj("vo2max", true, "caution", "Taper").action,
    );
    assert_(
      "rdyAdj rest Recovery keep",
      "keep",
      adj("vo2max", true, "rest", "Recovery").action,
    );
    assert_(
      "rdyAdj caution not-in-map keep",
      "keep",
      adj("taper_openers", true, "caution", "Build").action,
    );
  });

  // ── Niveau Fase-2 §c — power-curve normalisatie (puur) ──
  it("testPowerCurve", () => {
    const S = [5, 60, 300, 1200, 3600],
      V = [980, 560, 372, 312, 276],
      WK = [16, 9, 5.5, 4.6, 4.1],
      A = ["a", "a", "a3", "a", "a"];
    assert_("pcMarkerAt exact 60", 60, pcMarkerAt_(S, V, WK, A, 60).secs);
    assert_(
      "pcMarkerAt nearest 100→300",
      300,
      pcMarkerAt_(S, V, WK, A, 100).secs,
    );
    assert_("pcMarkerAt none→null", null, pcMarkerAt_(S, V, WK, A, 7200));
    // Daan-fixture (intervals.icu-cijfers 5s/60s/5m/eFTP-W/kg): pint de fix op echte data → All-rounder.
    const rtD = riderTypeFromCurve_(15.56, 5.59, 4.27, 3.67);
    assert_("riderType Daan label", "All-rounder", rtD.label);
    assert_("riderType Daan pos>=lo", true, rtD.pos >= 0.42);
    assert_("riderType Daan pos<=hi", true, rtD.pos <= 0.58);
    assert_(
      "riderType sprint label",
      "Sprinter",
      riderTypeFromCurve_(20, 10, 3.5, 2.9).label,
    ); // hoog kort, laag lang
    assert_(
      "riderType diesel label",
      "Diesel · klimmer",
      riderTypeFromCurve_(10, 5.6, 7, 6).label,
    ); // laag kort, hoog lang
    // Live 1-jaars-cijfers (5s/60s/5m/eFTP-W/kg): pint de classificatie van het ECHTE live-pad, niet alleen 42d.
    const rtL = riderTypeFromCurve_(15.6, 6.5, 4.6, 3.71);
    assert_(
      "riderType live All-rounder+band",
      true,
      rtL.label === "All-rounder" && rtL.pos >= 0.42 && rtL.pos <= 0.58,
    );
    const c = {
      label: "1y",
      days: 365,
      weight: 72,
      secs: [5, 60, 120, 300, 1200, 3600, 7200],
      values: [980, 560, 0, 372, 312, 276, 250],
      watts_per_kg: [16, 9, 0, 5.5, 4.6, 4.1, 3.7],
      activity_id: ["a", "a", "a", "a3", "a", "a", "a"],
    };
    const n = pcNormalize_(c, { a3: { start_date_local: "2026-03-10" } });
    assert_("pcNorm curve cap+skip", 5, n.curve.length); // 7200 capped, 120/0-watt skipped
    assert_("pcNorm markers", 5, n.markers.length);
    let m5m: any = null;
    n.markers.forEach((m: any) => {
      if (m.label === "5m") m5m = m;
    });
    assert_("pcNorm 5m date", "2026-03-10", m5m.date);
    assert_("pcNorm empty", true, pcNormalize_({ secs: [], values: [] }).empty);
  });

  // ── Niveau Fase-2 §d — doel-gereedheid + projectie (puur) ──
  it("testGoalProjection", () => {
    // goalGap_ — op-koers (>=target) · nog-te-gaan + gap-waarde · grens (==target).
    assert_("goalGap op-koers", true, goalGap_(4.1, 4.0, "up").onTrack);
    assert_("goalGap te-gaan onTrack", false, goalGap_(58, 65, "up").onTrack);
    assert_("goalGap te-gaan gap", 7, goalGap_(58, 65, "up").gap);
    assert_("goalGap grens onTrack", true, goalGap_(65, 65, "up").onTrack);
    // ctlPlateauFromVolume_ = uren*tss/7 + 0-guard.
    assert_("ctlPlateau 8x56", 64, ctlPlateauFromVolume_(8, 56));
    assert_("ctlPlateau 0-guard", 0, ctlPlateauFromVolume_(0, 56));
    // ctlApproachWeeks_ — bereikbaar (>0) · onbereikbaar (plateau<=doel→null) · al-bereikt (cur>=doel→0).
    assert_("ctlWeeks bereikbaar>0", true, ctlApproachWeeks_(45, 80, 65) > 0);
    assert_("ctlWeeks onbereikbaar", null, ctlApproachWeeks_(45, 60, 65));
    assert_("ctlWeeks al-bereikt", 0, ctlApproachWeeks_(70, 80, 65));
    // ftpBandFromProjection_ — low<high · aannames aanwezig · band breder bij grotere ΔCTL.
    const b1 = ftpBandFromProjection_(275, 50, 60),
      b2 = ftpBandFromProjection_(275, 50, 90);
    assert_("ftpBand low<high", true, b1.lowW < b1.highW);
    assert_("ftpBand aannames", true, b1.aannames.length > 0);
    assert_(
      "ftpBand breder ΔCTL",
      true,
      b2.highW - b2.lowW > b1.highW - b1.lowW,
    );
    // recent-window helpers (newest-first; idx0 datum, idx3 duur-min, idx8 TSS). Anker = 2026-06-08.
    const AV = [
      ["2026-06-08", "Ride", "", 120, 0, 0, 0, 0, 110], // 2u · 110 TSS (binnen 42d)
      ["2026-06-05", "Ride", "", 60, 0, 0, 0, 0, 55], // 1u · 55 TSS  (binnen 42d)
      ["2026-04-01", "Ride", "", 240, 0, 0, 0, 0, 200], // 4u · 200 TSS (buiten 42d, binnen 90d)
    ];
    assert_("maxRecentRideH 90d", 4, maxRecentRideH_(AV, 90));
    assert_("maxRecentRideH 42d", 2, maxRecentRideH_(AV, 42));
    assert_("tssPerHourRecent 42d", 55, tssPerHourRecent_(AV, 42));
    assert_("weeklyHoursRecent 42d", 0.5, weeklyHoursRecent_(AV, 42));
  });

  // ── FTP goal-profile — doel-gedreven activeGoalProfile_ + ftp-profiel-vorm ──
  it("testActiveGoalProfile", () => {
    // doel → profiel-mapping (object-identiteit; geen side-effects).
    assert_(
      "activeProfile FTP->ftp",
      GOAL_PROFILES_.ftp,
      activeGoalProfile_({ doel: "FTP" }),
    );
    assert_(
      "activeProfile Beklimmingen->girona",
      GOAL_PROFILES_.girona,
      activeGoalProfile_({ doel: "Beklimmingen" }),
    );
    assert_(
      "activeProfile VO2max->girona",
      GOAL_PROFILES_.girona,
      activeGoalProfile_({ doel: "VO2max" }),
    );
    assert_(
      "activeProfile Conditie->girona",
      GOAL_PROFILES_.girona,
      activeGoalProfile_({ doel: "Conditie" }),
    );
    assert_(
      "activeProfile onbekend->girona",
      GOAL_PROFILES_.girona,
      activeGoalProfile_({ doel: "xyz" }),
    );
    assert_(
      "activeProfile missing->girona",
      GOAL_PROFILES_.girona,
      activeGoalProfile_({}),
    );
    assert_(
      "activeProfile null-settings->girona",
      GOAL_PROFILES_.girona,
      activeGoalProfile_(null),
    );
    // ftp-profiel: key 'ftp' + PRECIES 1 dim (ctl / 65 / up).
    const ftp = GOAL_PROFILES_.ftp;
    assert_("ftp profiel key", "ftp", ftp.key);
    assert_("ftp profiel 1 dim", 1, ftp.dims.length);
    assert_("ftp dim metric", "ctl", ftp.dims[0].metric);
    assert_("ftp dim target", 65, ftp.dims[0].target);
    assert_("ftp dim dir", "up", ftp.dims[0].dir);
    // ctlApproachWeeks_ met de ftp duur-target = eindig getal (bereikbaar pad).
    assert_(
      "ftp target ctlWeeks finite",
      true,
      isFinite(ctlApproachWeeks_(45, 80, ftp.dims[0].target)),
    );
    // projectiemodus per profiel.
    assert_(
      "girona projectieMode gap",
      "gap",
      GOAL_PROFILES_.girona.projectieMode,
    );
    assert_("ftp projectieMode test", "test", GOAL_PROFILES_.ftp.projectieMode);
  });

  // ── FTP-test-projectie — ctlAtWeek_ (PMC-approach) + doelTestWeken_ (weken tot testdag) ──
  it("testCtlAtWeek", () => {
    assert_("ctlAtWeek wk0=current", 50, ctlAtWeek_(50, 80, 0));
    assert_("ctlAtWeek groot->plateau", 80, ctlAtWeek_(50, 80, 200));
    const a = ctlAtWeek_(50, 80, 6),
      b = ctlAtWeek_(50, 80, 12);
    assert_("ctlAtWeek monotoon stijgend", true, a > 50 && b > a && b < 80);
    const dn = ctlAtWeek_(70, 50, 6);
    assert_("ctlAtWeek dalend (cur>plateau)", true, dn < 70 && dn > 50);
    assert_("ctlAtWeek null-guard", null, ctlAtWeek_(null, 80, 6));
    assert_("ctlAtWeek neg-weken null", null, ctlAtWeek_(50, 80, -1));
  });

  it("testDoelTestWeken", () => {
    // 2026-06-02 + 12*7 = 2026-08-25; vanaf 2026-06-11 = 75 dgn → ceil(75/7) = 11.
    assert_(
      "doelTestWeken normaal",
      11,
      doelTestWeken_("2026-06-02", 12, "2026-06-11"),
    );
    // testdag al voorbij → clamp 0.
    assert_(
      "doelTestWeken voorbij->0",
      0,
      doelTestWeken_("2026-06-02", 1, "2026-08-01"),
    );
    // exact veelvoud (7 dgn) → 1 week.
    assert_(
      "doelTestWeken ceil exact",
      1,
      doelTestWeken_("2026-06-02", 1, "2026-06-02"),
    );
    assert_(
      "doelTestWeken missing->null",
      null,
      doelTestWeken_(null, 12, "2026-06-11"),
    );
    assert_(
      "doelTestWeken bad-dur->null",
      null,
      doelTestWeken_("2026-06-02", 0, "2026-06-11"),
    );
  });

  // ── Fase 1 deel 1 — archetype-expander (puur) ──
  it("testArchetype", () => {
    const fx = archetypeFixtures_();
    const REQ = [
      "naam",
      "focus",
      "zones",
      "totaalMin",
      "structuur",
      "intent",
      "tss",
      "eindopmerking",
      "blokken",
    ];
    const doelMap: any = {
      fx_steady_duur: 90,
      fx_drempel_int: 80,
      fx_microburst_vo2: 40,
    };
    fx.forEach((rec: any) => {
      const dm = doelMap[rec.id];
      const wo = expandArchetype_(rec, {
        ftp: 275,
        doelMin: dm,
        mesoFactor: 1.0,
        faseOffset: 0,
      });
      // (1) verplichte output-velden aanwezig
      let veldenOk = true;
      REQ.forEach((k) => {
        if (wo[k] == null) veldenOk = false;
      });
      assert_("arch " + rec.id + " velden", true, veldenOk);
      // (2) per blok: 0<pctLo≤pctHi≤150, minuten>0, zone consistent met pctZoneBucket_
      let sum = 0,
        blokOk = true,
        zoneOk = true;
      wo.blokken.forEach((b: any) => {
        sum += b.minuten;
        if (
          !(
            b.pctLo > 0 &&
            b.pctLo <= b.pctHi &&
            b.pctHi <= 150 &&
            b.minuten > 0
          )
        )
          blokOk = false;
        if (b.zone !== pctZoneBucket_(Math.round((b.pctLo + b.pctHi) / 2)))
          zoneOk = false;
      });
      assert_("arch " + rec.id + " blok-bounds", true, blokOk);
      assert_("arch " + rec.id + " blok-zone", true, zoneOk);
      // (3) Σblok==totaalMin én ≈doelMin (binnen fill-stap)
      assertClose_("arch " + rec.id + " som==totaal", wo.totaalMin, sum, 0.01);
      assertClose_("arch " + rec.id + " ~doelMin", dm, wo.totaalMin, 1.5);
      // (4)+(5) elke structuur-rij push-parsebaar + row[2] reproduceert watts(pctLo)-watts(pctHi)
      let pushOk = true,
        wattOk = true;
      wo.structuur.forEach((row: any) => {
        if (dslBlockFromRow_(row, 275) == null) pushOk = false;
        const r = dslPowerRange_(row[2], 275);
        if (!r || row[2] !== watts(275, r.lo) + "-" + watts(275, r.hi) + "W")
          wattOk = false;
      });
      assert_("arch " + rec.id + " push-parse", true, pushOk);
      assert_("arch " + rec.id + " watt-roundtrip", true, wattOk);
      // (6) tss == tssFromZoneMinutes_(intent)
      assert_(
        "arch " + rec.id + " tss",
        tssFromZoneMinutes_(wo.intent),
        wo.tss,
      );
    });
    // (7) richting: mesoFactor 1.1 > 1.0 → hogere werk-pct (drempel-fixture)
    function workPct(wo: any) {
      let m = 0;
      wo.blokken.forEach((b: any) => {
        if (b.pctLo > m) m = b.pctLo;
      });
      return m;
    }
    const b10 = expandArchetype_(fx[1], {
      ftp: 275,
      doelMin: 80,
      mesoFactor: 1.0,
      faseOffset: 0,
    });
    const b11 = expandArchetype_(fx[1], {
      ftp: 275,
      doelMin: 80,
      mesoFactor: 1.1,
      faseOffset: 0,
    });
    assert_("arch meso-richting", true, workPct(b11) > workPct(b10));
    // onPct-fallback (geen werk-range op de fixture): leidt nog pctLo/pctHi af (collapsed onLo==onHi).
    const foBlk = b10.blokken.filter(
      (b: any) => b.pctLo === 98 && b.pctHi === 98,
    );
    assert_("arch onPct-fallback", true, foBlk.length > 0);
  });

  // ── Fase 1 deel 2a — productie-archetype-register (data + push-pariteit) ──
  it("testArchetypeLib", () => {
    const REQ = [
      "naam",
      "focus",
      "zones",
      "totaalMin",
      "structuur",
      "intent",
      "tss",
      "eindopmerking",
      "blokken",
    ];
    ARCHETYPES.forEach((rec: any) => {
      const dm = rec.duurRange[0] + 10; // binnen [min, max]
      const wo = expandArchetype_(rec, {
        ftp: 275,
        lthr: 178,
        doelMin: dm,
        mesoFactor: 1.0,
        faseOffset: 0,
      });
      let veldenOk = true;
      REQ.forEach((k) => {
        if (wo[k] == null) veldenOk = false;
      });
      assert_("lib " + rec.id + " velden", true, veldenOk);
      let sum = 0,
        blokOk = true,
        zoneOk = true;
      wo.blokken.forEach((b: any) => {
        sum += b.minuten;
        if (
          !(
            b.pctLo > 0 &&
            b.pctLo <= b.pctHi &&
            b.pctHi <= 150 &&
            b.minuten > 0
          )
        )
          blokOk = false;
        if (b.zone !== pctZoneBucket_(Math.round((b.pctLo + b.pctHi) / 2)))
          zoneOk = false;
      });
      assert_("lib " + rec.id + " blok-bounds", true, blokOk);
      assert_("lib " + rec.id + " blok-zone", true, zoneOk);
      assertClose_("lib " + rec.id + " som==totaal", wo.totaalMin, sum, 0.01);
      assertClose_("lib " + rec.id + " ~doelMin", dm, wo.totaalMin, 1.5);
      let pushOk = true,
        wattOk = true;
      wo.structuur.forEach((row: any) => {
        if (dslBlockFromRow_(row, 275) == null) pushOk = false;
        const r = dslPowerRange_(row[2], 275);
        if (!r || row[2] !== watts(275, r.lo) + "-" + watts(275, r.hi) + "W")
          wattOk = false;
      });
      assert_("lib " + rec.id + " push-parse", true, pushOk);
      assert_("lib " + rec.id + " watt-roundtrip", true, wattOk);
      assert_("lib " + rec.id + " tss", tssFromZoneMinutes_(wo.intent), wo.tss);
      let tagsOk = rec.effectTags.length > 0;
      rec.effectTags.forEach((t: any) => {
        if (ARCHETYPE_EFFECT_TAGS.indexOf(t) < 0) tagsOk = false;
      });
      assert_("lib " + rec.id + " effectTags", true, tagsOk);
      assert_(
        "lib " + rec.id + " structuurtype",
        true,
        ARCHETYPE_STRUCTUURTYPES.indexOf(rec.structuurtype) >= 0,
      );
      const coreMin = expandArchetype_(rec, {
        ftp: 275,
        lthr: 178,
        doelMin: 0,
        mesoFactor: 1.0,
        faseOffset: 0,
      }).totaalMin;
      assertClose_(
        "lib " + rec.id + " min~core",
        rec.duurRange[0],
        coreMin,
        1.5,
      );
      // NIEUW — int-werk-blok met werk-range: een ECHTE range (pctHi-pctLo == onPctHi-onPctLo > 0, niet ±2).
      rec.core.forEach((c: any) => {
        if (c.kind === "int" && c.onPctLo != null && c.onPctHi != null) {
          const hit = wo.blokken.filter(
            (b: any) => b.pctLo === c.onPctLo && b.pctHi === c.onPctHi,
          );
          assert_(
            "lib " + rec.id + " werk-range",
            true,
            hit.length > 0 && c.onPctHi - c.onPctLo > 0,
          );
        }
      });
    });
  });

  // ── Fase 1 deel 2b.1 — profiel-laag + goalWorkout_-selector (deterministisch) ──
  it("testGoalWorkout", () => {
    const klim = profileForDoel_("Beklimmingen"),
      ftp = profileForDoel_("FTP");
    // determinisme: zelfde input → zelfde keuze
    const g1 = goalWorkout_(klim, "Build", 75, []);
    const g2 = goalWorkout_(klim, "Build", 75, []);
    assert_("goalWO det type", g1.type, g2.type);
    assert_("goalWO det id", g1.archetypeId, g2.archetypeId);
    // intent-keuze respecteert gewichten over de fasen
    assert_(
      "goalWO klim Build->drempel",
      "drempel",
      goalPickIntent_(klim, "Build", null),
    );
    assert_(
      "goalWO klim Peak->vo2",
      "vo2",
      goalPickIntent_(klim, "Peak", null),
    );
    assert_(
      "goalWO ftp Build->drempel",
      "drempel",
      goalPickIntent_(ftp, "Build", null),
    );
    // filter: bij 75 min drempel past ALLEEN threshold_overunder (threshold_long min 82)
    assert_("goalWO filter id", "threshold_overunder", g1.archetypeId);
    assert_("goalWO filter type", "threshold", g1.type);
    let rec: any = null;
    ARCHETYPES.forEach((a: any) => {
      if (a.id === g1.archetypeId) rec = a;
    });
    assert_(
      "goalWO match intent+range",
      true,
      rec.effectTags.indexOf("drempel") >= 0 &&
        75 >= rec.duurRange[0] &&
        75 <= rec.duurRange[1],
    );
    // recency: vorige intent drempel → kiest een andere intent (ander type)
    const gr = goalWorkout_(klim, "Build", 75, [
      { intent: "drempel", archetypeId: "threshold_overunder" },
    ]);
    assert_("goalWO recency intent-avoid", true, gr.type !== "threshold");
    // per-intent id-avoid: bij 51 min is ALLEEN vo2 haalbaar → intent blijft vo2 ondanks de vermijd;
    // 't recency-VENSTER mijdt 't laatst-gebruikte vo2-id → rotatie naar vo2_pyramid.
    const ga = goalWorkout_(klim, "Build", 51, [
      { intent: "vo2", archetypeId: "vo2_microburst" },
    ]);
    assert_(
      "goalWO recency id-avoid same-intent",
      true,
      ga.type === "vo2max" && ga.archetypeId !== "vo2_microburst",
    );
    // profiel-kiezer
    assert_("goalWO doel FTP", PROFILES.ftp, profileForDoel_("FTP"));
    assert_(
      "goalWO doel Beklimmingen",
      PROFILES.klim,
      profileForDoel_("Beklimmingen"),
    );
    assert_("goalWO doel VO2max", PROFILES.vo2max, profileForDoel_("VO2max"));
    assert_(
      "goalWO doel Conditie",
      PROFILES.conditie,
      profileForDoel_("Conditie"),
    );
    assert_(
      "goalWO doel onbekend->klim",
      PROFILES.klim,
      profileForDoel_("xyz"),
    );
    // effectTag->engine-type zit in ALLE bekende koppel-maps (cruciaal voor de 2b.2-inplug)
    GOAL_KWALITEIT_INTENTS_.forEach((it: any) => {
      const t = COACH_INTENT_ENGINE_TYPE_[it];
      assert_(
        "goalWO type-in-maps " + it,
        true,
        COACH_TYPE_INTENT_[t] != null &&
          DEMOTE_MAP[t] != null &&
          workoutZones(t, "FTP").length > 0,
      );
    });
    // klim kiest UITSLUITEND klim-relevante intents (drempel/sweetspot/vo2)
    let klimOnly = true;
    ["Base", "Build", "Peak"].forEach((f) => {
      if (GOAL_KWALITEIT_INTENTS_.indexOf(goalPickIntent_(klim, f, null)) < 0)
        klimOnly = false;
      if (
        GOAL_KWALITEIT_INTENTS_.indexOf(goalPickIntent_(klim, f, "drempel")) < 0
      )
        klimOnly = false;
    });
    assert_("goalWO klim klim-only-intents", true, klimOnly);
    // C1 (a) duur-haalbaar-eerst: bij 40 min heeft de top-intent (drempel, min 54) GEEN archetype, maar
    // vo2 (vo2_microburst[35,70]) wel → kiest vo2, NIET null (oud intent-vóór-duur-gedrag was null).
    const gShort = goalWorkout_(klim, "Build", 40, []);
    assert_("goalWO duur-haalbaar niet-null", true, gShort != null);
    assert_("goalWO duur-haalbaar vo2", "vo2max", gShort && gShort.type);
    // C1b coverage-bias = MODULATIE, niet override (COVERAGE_BOOST_ 0.10):
    // klim NAUWE keuze (vo2 0.35+0.10=0.45 > drempel 0.40) → anaerobic-gat tipt naar vo2.
    assert_(
      "goalWO bias klim anaerobic-gat->vo2",
      "vo2",
      goalPickIntent_(klim, "Build", null, 75, {
        low: true,
        high: true,
        anaerobic: false,
      }),
    );
    // ftp BESLISSENDE voorkeur HOUDT (drempel 0.45 > vo2 0.20+0.10=0.30) → high-bucket, NIET vo2.
    assert_(
      "goalWO bias ftp anaerobic-gat houdt-high",
      "high",
      INTENT_PRIMARY_BUCKET_[
        goalPickIntent_(ftp, "Build", null, 75, {
          low: true,
          high: true,
          anaerobic: false,
        })
      ],
    );
    // high-gat → high-bucket-intent (drempel/sweetspot), NIET vo2.
    assert_(
      "goalWO bias high-gat",
      "high",
      INTENT_PRIMARY_BUCKET_[
        goalPickIntent_(klim, "Build", null, 75, {
          low: true,
          high: false,
          anaerobic: true,
        })
      ],
    );
    // backward-compat: zonder beschikbareTijd én dekking = ongewijzigd (hoogste gewicht).
    assert_(
      "goalWO backward-compat",
      "drempel",
      goalPickIntent_(klim, "Build", null),
    );
  });

  // ── Fase 1b — per-intent recency-VENSTER rotatie (goalWorkout_) ──
  it("testGoalWorkoutRotatie", () => {
    // Duur-isolatie: bij 51 min is ALLEEN vo2 haalbaar (drempel min 54 / sweetspot min 52 buiten
    // bereik) → goalPickIntent_ houdt vo2 vast ongeacht de recency-vermijd. M = vo2-archetypes ⊇ 51.
    const TIJD = 51,
      INTENT = "vo2";
    const fitting = ARCHETYPES.filter(
      (a: any) =>
        a.effectTags.indexOf(INTENT) >= 0 &&
        TIJD >= a.duurRange[0] &&
        TIJD <= a.duurRange[1],
    ).map((a: any) => a.id);
    const M = fitting.length;
    assert_("rot M>=2 (rotatie zinnig)", true, M >= 2);

    // Rotatie: M calls → M verschillende id's; call M+1 == call 1 (stalest-eerst na reset).
    const prof: any = {
      id: "rot",
      soort: "capaciteit",
      intentGewichten: { drempel: 0, sweetspot: 0, vo2: 1 },
      archetypeVoorkeuren: {},
    };
    const rec: any = [],
      seen: any = {};
    let first: any = null,
      distinct = true;
    for (let i = 0; i < M; i++) {
      const g = goalWorkout_(prof, "Build", TIJD, rec);
      if (i === 0) first = g.archetypeId;
      if (seen[g.archetypeId]) distinct = false;
      seen[g.archetypeId] = true;
      rec.push({ intent: INTENT, archetypeId: g.archetypeId });
    }
    assert_(
      "rot M-distinct (volledige rotatie)",
      true,
      distinct && Object.keys(seen).length === M,
    );
    assert_(
      "rot call M+1 == call 1",
      first,
      goalWorkout_(prof, "Build", TIJD, rec).archetypeId,
    );

    // Bias: één vorm voorkeur 0.5 → komt >= zo vaak als elke andere; élke fitting vorm >= 1x.
    const boostId = fitting[M - 1];
    const voork: any = {};
    voork[boostId] = 0.5;
    const profB: any = {
      id: "rotB",
      soort: "capaciteit",
      intentGewichten: { drempel: 0, sweetspot: 0, vo2: 1 },
      archetypeVoorkeuren: voork,
    };
    const recB: any = [],
      count: any = {};
    fitting.forEach((id: any) => {
      count[id] = 0;
    });
    for (let j = 0; j < 3 * M; j++) {
      const gb = goalWorkout_(profB, "Build", TIJD, recB);
      count[gb.archetypeId] = (count[gb.archetypeId] || 0) + 1;
      recB.push({ intent: INTENT, archetypeId: gb.archetypeId });
    }
    let boostOk = true,
      eachOk = true;
    fitting.forEach((id: any) => {
      if (count[id] < 1) eachOk = false;
      if (id !== boostId && count[boostId] < count[id]) boostOk = false;
    });
    assert_("rot bias boosted >= elke andere", true, boostOk);
    assert_("rot bias élke vorm >=1", true, eachOk);
  });

  // ── Fase 1b — cross-week recency-seed (gatherWeekplanEntries_) ──
  it("testGatherWeekplanEntries", () => {
    const base = new Date(2000, 0, 3);
    function key(d: Date) {
      return "weekplan_" + formatDate(d, "yyyy-MM-dd");
    }
    const d1 = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() - 7,
    );
    const store: any = {};
    store[key(base)] = [
      { datum: "2000-01-03", workoutType: "vo2max", archetypeId: "vo2_long" },
    ];
    store[key(d1)] = [
      {
        datum: "1999-12-27",
        workoutType: "threshold",
        archetypeId: "threshold_long",
      },
      {
        datum: "1999-12-28",
        workoutType: "sweet_spot",
        archetypeId: "sweetspot_long",
      },
    ];
    const res = gatherWeekplanEntries_(
      8,
      base,
      (k: string) => store[k] || null,
    );
    const ids = res.map((e: any) => e.archetypeId);
    assert_("gather len 1+2+gat==3", 3, res.length);
    assert_("gather week0-id aanwezig", true, ids.indexOf("vo2_long") >= 0);
    assert_(
      "gather week1-id aanwezig",
      true,
      ids.indexOf("threshold_long") >= 0,
    );
  });

  // ── Fase 1b — recencyEntries: de 13e, OPTIONELE assignWorkouts-param ──
  // Contract: weggelaten/null → byte-identiek aan vóór 1b (lege seed via de null-reader);
  // gevuld → de seed mijdt het laatste kwaliteits-intent (goalPickIntent_ vermijdIntent).
  // LET OP: de week moet in de TOEKOMST liggen — assignWorkouts gebruikt
  // allocToday = stripTime_(new Date()); een week in het verleden laat de allocator niets
  // plaatsen en meet dan de keyIntensity-fallback (docs/RECENCY-1B-RECON.md §3).
  it("testRecencyEntriesParam", () => {
    const settings: any = {
      ftp: 280,
      lthr: 170,
      gewicht: 75,
      doel: "FTP",
      doelStart: null,
      hrMax: 190,
      hrRest: 45,
      pendelDuurMin: 80,
      pendelAantal: 2,
    };
    // Week die MORGEN begint.
    const start = new Date();
    start.setDate(start.getDate() + 1);
    function week(): any[] {
      return [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const dt = new Date(start);
        dt.setDate(start.getDate() + i);
        return {
          dagIdx: i,
          datum: dt,
          train: true,
          gedaan: false,
          minuten: i === 5 ? 120 : 75,
          type: i === 5 ? "weekend" : "vrij",
          voorgesteldType: null,
          reden: null,
          redenCode: null,
          archetypeId: null,
        };
      });
    }
    function run(recencyEntries?: any): string {
      const days = week();
      assignWorkouts(
        days,
        settings,
        1,
        "Build",
        { low: true, high: true, anaerobic: true },
        { signal: "normal" },
        null,
        null,
        null,
        false,
        null,
        days,
        recencyEntries,
      );
      return days.map((d: any) => d.voorgesteldType).join(",");
    }
    // Datum vóór de week → telt als historie.
    const histISO = formatDate(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7),
      "yyyy-MM-dd",
    );
    const baseline = run();
    // (1) weggelaten === null → byte-identiek (de bestaande, ongeseede uitkomst).
    assert_("recency arg weggelaten == null", baseline, run(null));
    // (2) lege lijst gedraagt zich als geen seed.
    assert_("recency lege lijst == baseline", baseline, run([]));
    // (3) B-geval: seed het intent dat de baseline zelf koos → de keuze moet doorschuiven.
    const eersteType = baseline.split(",")[0];
    const flip = run([
      { datum: histISO, workoutType: eersteType, archetypeId: null },
    ]);
    assert_("recency B-geval flipt de keuze", true, flip !== baseline);
    // (4) C-geval: een intent dat de baseline NIET koos → uitkomst ongewijzigd.
    //     (long_z2 draagt geen kwaliteits-intent → recencyFromWeekplan_ filtert 'm weg.)
    const geenKwaliteit = run([
      { datum: histISO, workoutType: "long_z2", archetypeId: null },
    ]);
    assert_("recency niet-kwaliteitstype == baseline", baseline, geenKwaliteit);
  });

  // ── Pass 1 — volume-adaptieve Base-intent-weging (volumeModulatie, rauwe sort-scores) ──
  it("testVolumeModulatie", () => {
    const klim = PROFILES.klim,
      ftp = PROFILES.ftp;
    // klim Base @V<V0: drempel 0.45 > sweetspot 0.35 > vo2 0.25 (geen vo2-boost → vo2 3rd → afwezig in 2-quality).
    const k6 = goalEffWeights_(klim, "Base", 6);
    assert_(
      "vol klim Base V6 vo2 3rd",
      true,
      k6.vo2 < k6.sweetspot && k6.sweetspot < k6.drempel,
    );
    // klim @13u: vo2 ramt boven sweetspot (#2), blijft onder drempel (#1) → vo2 wordt #2, nooit #1.
    const k13 = goalEffWeights_(klim, "Base", 13);
    assert_(
      "vol klim Base V13 vo2 enters",
      true,
      k13.sweetspot < k13.vo2 && k13.vo2 < k13.drempel,
    );
    // ftp Base @V<V0: drempel 0.50 > sweetspot 0.45 > vo2 0.10 (vo2 3rd).
    const f6 = goalEffWeights_(ftp, "Base", 6);
    assert_(
      "vol ftp Base V6 vo2 3rd",
      true,
      f6.vo2 < f6.sweetspot && f6.sweetspot < f6.drempel,
    );
    // ftp @20u: vo2 boven sweetspot (0.45), onder drempel (0.50).
    const f20 = goalEffWeights_(ftp, "Base", 20);
    assert_(
      "vol ftp Base V20 vo2 enters",
      true,
      f20.sweetspot < f20.vo2 && f20.vo2 < f20.drempel,
    );
    // Build/Peak: volume-NEUTRAAL (delta 0) — goalEffWeights_ identiek over V=6/V=20/no-V.
    function neutral(profiel: any, fase: any) {
      const lo = goalEffWeights_(profiel, fase, 6),
        hi = goalEffWeights_(profiel, fase, 20),
        nov = goalEffWeights_(profiel, fase);
      return GOAL_KWALITEIT_INTENTS_.every(
        (k: any) => lo[k] === hi[k] && hi[k] === nov[k],
      );
    }
    assert_("vol klim Build neutraal", true, neutral(klim, "Build"));
    assert_("vol klim Peak neutraal", true, neutral(klim, "Peak"));
    assert_("vol ftp Build neutraal", true, neutral(ftp, "Build"));
    // volumeModulatie zelf: niet-Base / niet-eindige V / geen volumeResponse → 0.
    assert_("vol mod Build=0", 0, volumeModulatie(20, "Build", klim).vo2);
    assert_("vol mod NaN=0", 0, volumeModulatie(undefined, "Base", klim).vo2);
    assert_(
      "vol mod geen-response=0",
      0,
      volumeModulatie(20, "Base", { id: "x" }).vo2,
    );
  });

  // ── Pass 1b — coverage-boost volume-gate in Base (vo2 niet geïnjecteerd ≤ U0) ──
  it("testCovGateBase", () => {
    const klim = PROFILES.klim,
      ftp = PROFILES.ftp;
    const gap = { low: true, high: true, anaerobic: false }; // alleen 'n anaerobic-gat
    function pick(p: any, fase: any, V: any) {
      return goalPickIntent_(p, fase, null, 75, gap, V);
    }
    // Base ≤ U0: vo2 krijgt GEEN coverage-boost → niet gekozen (#1 leidt).
    assert_("covgate klim Base V6 !vo2", true, pick(klim, "Base", 6) !== "vo2");
    assert_("covgate ftp Base V6 !vo2", true, pick(ftp, "Base", 6) !== "vo2");
    // Base hoog volume: ramp(cap)+boost verslaat #1 → vo2 gekozen (boost actief boven U0).
    assert_("covgate klim Base V15 vo2", "vo2", pick(klim, "Base", 15));
    assert_("covgate ftp Base V20 vo2", "vo2", pick(ftp, "Base", 20));
    // Build: gate geldt NIET → coverage injecteert vo2 (anaerobic-gat) ongeacht V (volume-onafhankelijk).
    assert_("covgate Build niet-gated vo2", "vo2", pick(klim, "Build", 6));
    assert_(
      "covgate Build V-onafhankelijk",
      pick(klim, "Build", 6),
      pick(klim, "Build", 20),
    );
  });

  // ── Pass 2-track — eigen PROFILES vo2max + conditie (ordering + neutraal + archetype-resolutie) ──
  it("testProfielenVo2maxConditie", () => {
    const vo2 = PROFILES.vo2max,
      cond = PROFILES.conditie;
    // vo2max Base: drempel 0.40 > sweetspot 0.35 > vo2 0.30 (vo2 3e); @hoog V vo2 #2 (< #1 drempel).
    const v6 = goalEffWeights_(vo2, "Base", 6);
    assert_(
      "prof vo2max Base V6 vo2 3rd",
      true,
      v6.vo2 < v6.sweetspot && v6.sweetspot < v6.drempel,
    );
    const v13 = goalEffWeights_(vo2, "Base", 13);
    assert_(
      "prof vo2max Base V13 vo2 enters",
      true,
      v13.sweetspot < v13.vo2 && v13.vo2 < v13.drempel,
    );
    // conditie Base: sweetspot 0.55 > drempel 0.40 > vo2 0.10 (sweetspot-led); @hoog V vo2 #2 (< #1 sweetspot).
    const c6 = goalEffWeights_(cond, "Base", 6);
    assert_(
      "prof conditie Base V6 vo2 3rd",
      true,
      c6.vo2 < c6.drempel && c6.drempel < c6.sweetspot,
    );
    const c20 = goalEffWeights_(cond, "Base", 20);
    assert_(
      "prof conditie Base V20 vo2 enters",
      true,
      c20.drempel < c20.vo2 && c20.vo2 < c20.sweetspot,
    );
    // Build volume-neutraal (delta 0) voor beide.
    function neutral(p: any, fase: any) {
      const lo = goalEffWeights_(p, fase, 6),
        hi = goalEffWeights_(p, fase, 20);
      return GOAL_KWALITEIT_INTENTS_.every((k: any) => lo[k] === hi[k]);
    }
    assert_("prof vo2max Build neutraal", true, neutral(vo2, "Build"));
    assert_("prof conditie Build neutraal", true, neutral(cond, "Build"));
    // Archetype-resolutie smoke: goalWorkout_ levert een geldig archetype per profiel op haalbare duur.
    function archOk(p: any) {
      const g = goalWorkout_(p, "Build", 75, []);
      return !!(
        g &&
        g.archetypeId &&
        ARCHETYPES.filter((a: any) => a.id === g.archetypeId).length > 0
      );
    }
    assert_("prof vo2max archetype-resolutie", true, archOk(vo2));
    assert_("prof conditie archetype-resolutie", true, archOk(cond));
  });

  // ── Knip-a — snapshotDayAction_ (puur): freeze-first voor VOORBIJE dagen ──
  it("testSnapshotDayAction", () => {
    const today = "2026-06-11";
    // VOORBIJ + vorige entry → freeze, ongeacht train/type (gemist + avail-uit + de bug-case verbatim).
    assert_(
      "snap past+prev freeze",
      "freeze",
      snapshotDayAction_("2026-06-10", today, true, true, "taper_z2_kort"),
    );
    assert_(
      "snap past+prev bug-case (type leeg) freeze",
      "freeze",
      snapshotDayAction_("2026-06-10", today, true, true, ""),
    );
    assert_(
      "snap past+prev avail-uit freeze",
      "freeze",
      snapshotDayAction_("2026-06-10", today, true, false, ""),
    );
    // VOORBIJ + geen prev → rebuild als er 'n type is, anders skip.
    assert_(
      "snap past+noprev+type rebuild",
      "rebuild",
      snapshotDayAction_("2026-06-10", today, false, true, "long_z2"),
    );
    assert_(
      "snap past+noprev+geen-type skip",
      "skip",
      snapshotDayAction_("2026-06-10", today, false, true, ""),
    );
    // VANDAAG/TOEKOMST: train+type → rebuild; anders skip; NOOIT freeze (ook niet met prev).
    assert_(
      "snap today train+type rebuild",
      "rebuild",
      snapshotDayAction_("2026-06-11", today, false, true, "sweet_spot"),
    );
    assert_(
      "snap future train+type rebuild",
      "rebuild",
      snapshotDayAction_("2026-06-14", today, true, true, "long_z2"),
    );
    assert_(
      "snap future restdag+prev skip (volgt nieuw plan)",
      "skip",
      snapshotDayAction_("2026-06-14", today, true, false, ""),
    );
    assert_(
      "snap future geen-type skip",
      "skip",
      snapshotDayAction_("2026-06-13", today, false, false, ""),
    );
  });

  // ── Fase 1 deel 2b.2 commit 1 — plumbing: buildWorkout-routing + recency-extractor ──
  it("testInplug", () => {
    const S = { ftp: 275, lthr: 178, doel: "FTP" };
    // (a) buildWorkout MET archetypeId → archetype-contract + getagd id.
    const wa = buildWorkout(
      "threshold",
      90,
      S,
      1,
      "Build",
      null,
      0,
      "threshold_long",
    );
    assert_("inplug buildWO arch id", "threshold_long", wa.archetypeId);
    assert_(
      "inplug buildWO arch blokken-pct",
      true,
      !!(
        wa.blokken &&
        wa.blokken.length &&
        wa.blokken[0].pctLo != null &&
        wa.blokken[0].pctHi != null
      ),
    );
    assert_(
      "inplug buildWO arch contract",
      true,
      wa.structuur != null &&
        wa.intent != null &&
        typeof wa.tss === "number" &&
        wa.zones != null,
    );
    // (b) buildWorkout ZONDER archetypeId → bestaande dispatch byte-identiek (regressie).
    const wr = buildWorkout("recovery", 45, S, 1, "Base", null, 0);
    assert_("inplug buildWO recovery focus", "recovery", wr.focus);
    assert_("inplug buildWO recovery geen-arch", true, wr.archetypeId == null);
    assert_(
      "inplug buildWO pendel_z2 focus",
      "aerobic base",
      buildWorkout("pendel_z2", 120, S, 1, "Base", null, 0).focus,
    );
    assert_(
      "inplug buildWO taper focus",
      "sharpness",
      buildWorkout("taper_openers", 30, S, 1, "Base", null, 0).focus,
    );
    // onbekend archetypeId → val door naar dispatch (geen crash).
    assert_(
      "inplug buildWO onbekend-arch fallback",
      "recovery",
      buildWorkout("recovery", 45, S, 1, "Base", null, 0, "bestaat_niet").focus,
    );
    // (c) recencyFromWeekplan_ uit mock-snapshot → kwaliteit-only, gesorteerd, refISO-filter.
    const wp = [
      { datum: "2026-06-01", workoutType: "long_z2", archetypeId: null },
      {
        datum: "2026-06-03",
        workoutType: "threshold",
        archetypeId: "threshold_long",
      },
      { datum: "2026-06-05", workoutType: "vo2max", archetypeId: "vo2_long" },
    ];
    const rec = recencyFromWeekplan_(wp, "2026-06-10");
    assert_("inplug recency len", 2, rec.length);
    assert_("inplug recency laatste intent", "vo2", rec[rec.length - 1].intent);
    assert_(
      "inplug recency laatste id",
      "vo2_long",
      rec[rec.length - 1].archetypeId,
    );
    assert_(
      "inplug recency refISO-filter",
      1,
      recencyFromWeekplan_(wp, "2026-06-04").length,
    );
  });

  // ── Fase 1 deel 2b.2 commit 2 — activatie: goalWorkout_ in keyIntensity (order-invariant) ──
  it("testKeyIntensityInplug", () => {
    const dek = { low: true, high: false, anaerobic: false };
    // Build met ctx → goalWorkout_ kiest een kwaliteit-type + zet out.archetypeId.
    const out: any = {};
    const t = keyIntensity("Beklimmingen", "Build", dek, null, false, {
      beschikbareTijd: 75,
      recency: [],
      settings: { doel: "Beklimmingen" },
      out: out,
    });
    assert_(
      "kiPlug Build quality-type",
      true,
      t === "threshold" || t === "sweet_spot" || t === "vo2max",
    );
    assert_("kiPlug Build archetypeId-set", true, out.archetypeId != null);
    // order-invariant: Taper/Recovery nemen hun eigen tak (vóór de goalWorkout_-stap), GEEN archetype.
    const o2: any = {};
    assert_(
      "kiPlug Taper eigen-tak",
      "taper_openers",
      keyIntensity("Beklimmingen", "Taper", dek, null, false, {
        beschikbareTijd: 75,
        recency: [],
        settings: { doel: "Beklimmingen" },
        out: o2,
      }),
    );
    assert_("kiPlug Taper geen-arch", true, o2.archetypeId == null);
    assert_(
      "kiPlug Recovery eigen-tak",
      "recovery",
      keyIntensity("Beklimmingen", "Recovery", dek, null, false, {
        beschikbareTijd: 75,
        recency: [],
        settings: { doel: "Beklimmingen" },
        out: {},
      }),
    );
    // Base: goalWorkout_ vuurt niet (geen Build/Peak) → doel-tak ongewijzigd (FTP Base → sweet_spot).
    assert_(
      "kiPlug Base doel-tak",
      "sweet_spot",
      keyIntensity("FTP", "Base", dek, null, false, {
        beschikbareTijd: 75,
        recency: [],
        settings: { doel: "FTP" },
        out: {},
      }),
    );
    // Zonder ctx → climbTypeWorkout_-fallback (revert-pad): klimType 'lang' + !high → sweet_spot.
    assert_(
      "kiPlug geen-ctx climb-fallback",
      "sweet_spot",
      keyIntensity("FTP", "Build", dek, "lang", false),
    );
    // goalWorkout_ null (geen archetype past in 300 min) → fallback-keten → trip-tak long_z2.
    assert_(
      "kiPlug goalWO-null trip-fallback",
      "long_z2",
      keyIntensity("FTP", "Build", dek, null, true, {
        beschikbareTijd: 300,
        recency: [],
        settings: { doel: "FTP" },
        out: {},
      }),
    );
  });

  // ── Fase 1 deel 2b.2-VERIFY — Build/Peak-weeksimulatie (keyIntensity is PUUR: goalWorkout_/
  // climbTypeWorkout_/doel-tak doen geen Sheet/DocProp → end-to-end keuze puur simuleerbaar) ──
  it("testGoalInplugWeekSim", () => {
    const QUALITY: any = { threshold: 1, sweet_spot: 1, vo2max: 1 };
    const dekNorm = { low: true, high: true, anaerobic: false }; // wellness normaal, dekking aanwezig
    const klimS = { doel: "Beklimmingen" };
    const tijden = [50, 60, 75, 90, 120, 150];
    function archIn_(id: any) {
      return ARCHETYPES.filter((a: any) => a.id === id).length > 0;
    }

    ["Build", "Peak"].forEach((fase) => {
      const recency: any = [],
        ids: any = [];
      let consistent = true,
        klimIntentsOk = true,
        fallbackClean = true;
      tijden.forEach((tijd) => {
        const out: any = {};
        const type = keyIntensity("Beklimmingen", fase, dekNorm, null, false, {
          beschikbareTijd: tijd,
          recency: recency,
          settings: klimS,
          out: out,
        });
        if (QUALITY[type]) {
          if (!(out.archetypeId != null && archIn_(out.archetypeId)))
            consistent = false;
          if (GOAL_KWALITEIT_INTENTS_.indexOf(COACH_TYPE_INTENT_[type]) < 0)
            klimIntentsOk = false;
          recency.push({
            intent: COACH_TYPE_INTENT_[type],
            archetypeId: out.archetypeId,
          });
          ids.push(out.archetypeId);
        } else if (out.archetypeId != null) {
          fallbackClean = false; // fallback-type mag NOOIT een archetypeId dragen
        }
      });
      assert_("sim " + fase + " type<->arch consistent", true, consistent);
      assert_("sim " + fase + " klim-intents only", true, klimIntentsOk);
      assert_("sim " + fase + " fallback geen-arch", true, fallbackClean);
      assert_("sim " + fase + " archetype-dagen >=3", true, ids.length >= 3);
      const uniq: any = {};
      ids.forEach((id: any) => {
        uniq[id] = 1;
      });
      assert_(
        "sim " + fase + " variatie >=2",
        true,
        Object.keys(uniq).length >= 2,
      );
      let herh = false;
      for (let i = 1; i < ids.length; i++) {
        if (ids[i] === ids[i - 1]) herh = true;
      }
      assert_("sim " + fase + " geen-directe-herhaling", false, herh);
    });

    // Duur-extremen.
    assert_(
      "sim >135min trip-fallback",
      "long_z2",
      keyIntensity("Beklimmingen", "Build", dekNorm, null, true, {
        beschikbareTijd: 150,
        recency: [],
        settings: klimS,
        out: {},
      }),
    );
    const kort = keyIntensity(
      "FTP",
      "Build",
      { low: true, high: false, anaerobic: false },
      null,
      false,
      { beschikbareTijd: 30, recency: [], settings: { doel: "FTP" }, out: {} },
    );
    assert_(
      "sim <minRange doel-tak",
      true,
      kort === "sweet_spot" || kort === "threshold",
    );

    // Gedrag-shift: dekking-tekort in Build → type komt van goalWorkout_ (archetypeId gezet), niet de doel-tak.
    const outDek: any = {};
    const tDek = keyIntensity(
      "FTP",
      "Build",
      { low: false, high: false, anaerobic: false },
      null,
      false,
      {
        beschikbareTijd: 75,
        recency: [],
        settings: { doel: "FTP" },
        out: outDek,
      },
    );
    assert_(
      "sim dekking-shift via goalWO",
      true,
      !!QUALITY[tDek] && outDek.archetypeId != null,
    );

    // Elk gekozen archetype → buildWorkout → geldige, push-parsebare workout.
    const S = { ftp: 275, lthr: 178, doel: "Beklimmingen" };
    const bw = buildWorkout(
      "threshold",
      90,
      S,
      1,
      "Build",
      null,
      0,
      "threshold_overunder",
    );
    assert_(
      "sim buildWO contract",
      true,
      bw.archetypeId === "threshold_overunder" &&
        bw.structuur != null &&
        typeof bw.tss === "number" &&
        !!(bw.blokken && bw.blokken.length && bw.blokken[0].pctLo != null),
    );
    let pushOk = true;
    bw.structuur.forEach((row: any) => {
      if (dslBlockFromRow_(row, 275) == null) pushOk = false;
    });
    assert_("sim buildWO push-parse", true, pushOk);

    // FTP-profiel-variant: ftp-profiel gekozen + drempel/sweetspot domineren vo2 over de reeks.
    assert_("sim ftp-profiel gekozen", PROFILES.ftp, profileForDoel_("FTP"));
    const ftpIntents: any = {};
    ["Build", "Peak"].forEach((fase) => {
      const rec: any = [];
      [60, 75, 90].forEach((tijd) => {
        const o: any = {};
        const ty = keyIntensity("FTP", fase, dekNorm, null, false, {
          beschikbareTijd: tijd,
          recency: rec,
          settings: { doel: "FTP" },
          out: o,
        });
        if (QUALITY[ty]) {
          const it = COACH_TYPE_INTENT_[ty];
          ftpIntents[it] = (ftpIntents[it] || 0) + 1;
          if (o.archetypeId)
            rec.push({ intent: it, archetypeId: o.archetypeId });
        }
      });
    });
    assert_(
      "sim ftp drempel/sweetspot-zwaar",
      true,
      (ftpIntents.drempel || 0) + (ftpIntents.sweetspot || 0) >
        (ftpIntents.vo2 || 0),
    );
  });

  // ── Fase 1b C3 — pure week-allocator (allocateQualityWeek_) ──
  it("testAllocateQualityWeek", () => {
    function dW(idx: any, type: any, minuten: any, o?: any) {
      o = o || {};
      return {
        dagIdx: idx,
        dag: "d" + idx,
        train: o.train !== false,
        datum: new Date(2026, 5, 8 + idx),
        minuten: minuten,
        type: type,
        gedaan: !!o.gedaan,
        voorgesteldType: o.vt || "",
      };
    }
    function week() {
      return [
        dW(0, "vrij", 60),
        dW(1, "pendel", 0),
        dW(2, "vrij", 75),
        dW(3, "recovery", 45),
        dW(4, "vrij", 90),
        dW(5, "weekend", 180),
        dW(6, "weekend", 120),
      ];
    }
    const klim = PROFILES.klim,
      ftp = PROFILES.ftp;
    const dekFresh = { low: false, high: false, anaerobic: false };
    const today = new Date(2026, 5, 8);
    const SK = { doel: "Beklimmingen", pendelDuurMin: 80 },
      SF = { doel: "FTP", pendelDuurMin: 80 };
    function qCount(p: any) {
      let n = 0;
      Object.keys(p).forEach((k) => {
        if (p[k].role === "quality") n++;
      });
      return n;
    }
    function hardIdxs(p: any) {
      const a: any = [];
      Object.keys(p).forEach((k) => {
        if (p[k].role === "quality" || p[k].role === "longride_efforts")
          a.push(Number(k));
      });
      return a.sort((x: any, y: any) => x - y);
    }
    function noAdjacent(idxs: any) {
      for (let i = 1; i < idxs.length; i++)
        if (idxs[i] - idxs[i - 1] < 2) return false;
      return true;
    }

    // A — klim Build: longride_efforts + 2 quality, recovery excluded, pendel→endurance, gespreid.
    const pa = allocateQualityWeek_(
      week(),
      klim,
      "Build",
      dekFresh,
      [],
      null,
      null,
      SK,
      today,
      false,
      null,
    );
    assert_(
      "alloc klim Build longride_efforts",
      "longride_efforts",
      pa[5] && pa[5].role,
    );
    assert_(
      "alloc klim Build combo-type",
      "combo_long_with_efforts",
      pa[5] && pa[5].type,
    );
    assert_("alloc klim Build 2 quality", 2, qCount(pa));
    assert_("alloc klim Build recovery-excl", true, pa[3] === undefined);
    assert_(
      "alloc klim Build pendel endurance",
      "pendel_z2",
      pa[1] && pa[1].type,
    );
    assert_(
      "alloc klim Build no-adjacent-hard",
      true,
      noAdjacent(hardIdxs(pa)),
    );
    assert_(
      "alloc klim Build weekend-pair vermeden",
      "endurance",
      pa[6] && pa[6].role,
    );
    let qOk = true;
    Object.keys(pa).forEach((k) => {
      if (pa[k].role === "quality") {
        const t = pa[k].type;
        if (
          !(t === "threshold" || t === "sweet_spot" || t === "vo2max") ||
          !pa[k].archetypeId
        )
          qOk = false;
      }
    });
    assert_("alloc klim Build quality types+arch", true, qOk);

    // B — klim Base: longride/long_z2 + 2 sweet_spot quality (geen archetype); pendel KAN quality.
    const pb = allocateQualityWeek_(
      week(),
      klim,
      "Base",
      dekFresh,
      [],
      null,
      null,
      SK,
      today,
      false,
      null,
    );
    assert_("alloc Base longride role", "longride", pb[5] && pb[5].role);
    assert_("alloc Base longride long_z2", "long_z2", pb[5] && pb[5].type);
    assert_("alloc Base 2 quality", 2, qCount(pb));
    // Pass 1: Base loopt nu via goalWorkout_ (was hardcoded sweet_spot) → quality = echte archetypes,
    // drempel-led (#1 Base-intent), geen herhaalde vorm. Bij dit fixture-volume (~9,5u) komt vo2 via de
    // coverage-bias (anaerobic-gat), niet via de volume-ramp — de ramp wordt puur getest in testVolumeModulatie_.
    const baseQ = Object.keys(pb)
      .filter((k) => pb[k].role === "quality")
      .map((k) => pb[k]);
    const baseTypesOk = baseQ.every(
      (q: any) =>
        (q.type === "threshold" ||
          q.type === "sweet_spot" ||
          q.type === "vo2max") &&
        !!q.archetypeId,
    );
    assert_("alloc Base quality types+arch", true, baseTypesOk);
    assert_(
      "alloc Base drempel-led (#1)",
      true,
      baseQ.some((q: any) => q.type === "threshold"),
    );
    const baseIds = baseQ.map((q: any) => q.archetypeId),
      baseUniq: any = {};
    baseIds.forEach((id: any) => {
      baseUniq[id] = 1;
    });
    assert_(
      "alloc Base geen-herhaalde-vorm",
      baseIds.length,
      Object.keys(baseUniq).length,
    );
    assert_("alloc Base pendel kan quality", "quality", pb[1] && pb[1].role);

    // C — Recovery (geen quota-entry) → leeg plan.
    const pc = allocateQualityWeek_(
      week(),
      klim,
      "Recovery",
      dekFresh,
      [],
      null,
      null,
      SK,
      today,
      false,
      null,
    );
    assert_("alloc Recovery leeg", 0, Object.keys(pc).length);

    // D — ftp (weekendBlok=false): nooit aaneengesloten harde dagen; quota 3.
    const pd = allocateQualityWeek_(
      week(),
      ftp,
      "Build",
      dekFresh,
      [],
      null,
      null,
      SF,
      today,
      false,
      null,
    );
    assert_("alloc ftp no-adjacent-hard", true, noAdjacent(hardIdxs(pd)));
    assert_("alloc ftp 3 quality", 3, qCount(pd));
    // E — done-quality threading (#3): pendel-only week (geen longride_efforts → volle 3 quality-slots);
    // weekDays met 1 done-hard dag (threshold) reduceert de quota 3 → 2.
    const daysP = [
      dW(0, "pendel", 80),
      dW(1, "pendel", 80),
      dW(2, "pendel", 80),
      dW(3, "pendel", 80),
      dW(4, "pendel", 80),
    ];
    const baseN = qCount(
      allocateQualityWeek_(
        daysP,
        klim,
        "Build",
        dekFresh,
        [],
        null,
        null,
        SK,
        today,
        false,
        null,
      ),
    );
    const redN = qCount(
      allocateQualityWeek_(
        daysP,
        klim,
        "Build",
        dekFresh,
        [],
        null,
        null,
        SK,
        today,
        false,
        null,
        daysP.concat([dW(0, "vrij", 75, { gedaan: true, vt: "threshold" })]),
      ),
    );
    assert_(
      "alloc done-quality reductie 3->2",
      true,
      baseN === 3 && redN === 2,
    );
  });

  it("testCoach", () => {
    // FIX 1 — IF-normalisatie: percentage → 0–1; reeds-ratio ongemoeid; 0,77 ≠ vo2.
    assertClose_("normIf 77.09", 0.7709, cfNormIf_(77.09), 0.0001);
    assertClose_("normIf 88", 0.88, cfNormIf_(88), 0.0001);
    assertClose_("normIf 0.77", 0.77, cfNormIf_(0.77), 0.0001);
    assert_("normIf 77 niet vo2", "tempo", intentFromIF_(cfNormIf_(77)));
    assert_("coach IF duur", "duur", intentFromIF_(0.62));
    assert_("coach type sweetspot", "sweetspot", intentFromType_("sweet_spot"));
    // FIX 2 — intent uit reële zone-verdeling (Z2-zwaar→niet-vo2; Z5-blok→vo2).
    assert_(
      "zones Z2-zwaar",
      "drempel",
      coachIntentFromZones_({
        rust: 5,
        z2: 70,
        tempo: 5,
        drempel: 20,
        anaeroob: 0,
      }),
    );
    assert_(
      "zones Z5-blok",
      "vo2",
      coachIntentFromZones_({
        rust: 5,
        z2: 40,
        tempo: 0,
        drempel: 5,
        anaeroob: 18,
      }),
    );
    assert_(
      "zones puur Z2",
      "duur",
      coachIntentFromZones_({
        rust: 8,
        z2: 90,
        tempo: 0,
        drempel: 0,
        anaeroob: 0,
      }),
    );
    // Alignment relatief op IF/TSS.
    assert_(
      "align on-plan",
      "on-plan",
      coachAlignment_(78, 0.88, 81, 0.89).state,
    );
    assert_(
      "align different",
      "different",
      coachAlignment_(95, 0.94, 74, 0.81).state,
    );
    assert_(
      "align deviated",
      "deviated",
      coachAlignment_(90, 0.9, 70, 0.84).state,
    );
    // End-to-end FIX 1: actual-IF als PERCENTAGE → genormaliseerd → on-plan + done.ifv 0–1.
    const fb = coachFeedback_(
      {
        type: "sweet_spot",
        titel: "Sweet Spot 3x12",
        duurMin: 60,
        tss: 78,
        segmenten: [],
      },
      { duurMin: 62, tss: 81, ifReal: 89 },
      { fase: "Build" },
      false,
    );
    assert_("coach pct-IF on-plan", "on-plan", fb.state);
    assertClose_("coach done IF 0–1", 0.89, fb.done.ifv, 0.001);
    // FIX 3 — doel-bewust: endurance-event, duur gepland, intensiever gereden → different + adapt + event-naam.
    const evCtx = {
      fase: "Build",
      event: { naam: "Girona", type: "trip", isEndurance: true },
      patternCount: 1,
    };
    const fd = coachFeedback_(
      {
        type: "long_z2",
        titel: "Lange Z2",
        duurMin: 120,
        tss: 80,
        segmenten: [],
      },
      { duurMin: 90, tss: 95, ifReal: 88 },
      evCtx,
      false,
    );
    assert_("coach endurance-sub different", "different", fd.state);
    assert_("coach endurance-sub adapt", true, !!fd.adapt);
    assert_("coach narratief event", true, fd.narrative.indexOf("Girona") >= 0);
    // Polish — drempel-substitutie op endurance-event = klim-specifiek credit (geen "tilt niet op").
    assert_(
      "coach drempel-credit klim-framing",
      true,
      fd.narrative.indexOf("klim") >= 0,
    );
    assert_(
      'coach drempel-credit geen "tilt"',
      true,
      fd.narrative.indexOf("tilt") < 0,
    );
    // vo2-substitutie blijft niet-specifiek ("tilt ... niet op").
    const fv2 = coachFeedback_(
      {
        type: "long_z2",
        titel: "Lange Z2",
        duurMin: 120,
        tss: 80,
        segmenten: [],
      },
      { duurMin: 70, tss: 92, ifReal: 96 },
      evCtx,
      false,
    );
    assert_(
      "coach vo2-sub niet-specifiek",
      true,
      fv2.narrative.indexOf("tilt") >= 0,
    );
    // Patroon (≥2 subs) → escalerende tekst.
    const evPat = {
      fase: "Build",
      event: { naam: "Girona", type: "trip", isEndurance: true },
      patternCount: 3,
    };
    const fp = coachFeedback_(
      {
        type: "long_z2",
        titel: "Lange Z2",
        duurMin: 120,
        tss: 80,
        segmenten: [],
      },
      { duurMin: 90, tss: 95, ifReal: 88 },
      evPat,
      false,
    );
    assert_(
      "coach patroon-escalatie",
      true,
      fp.narrative.indexOf("ondermijnt") >= 0,
    );
    // Gemiste sleutelprikkel → missed + aanpassing-voorstel.
    const fm = coachFeedback_(
      {
        type: "vo2max",
        titel: "VO2max 5x4",
        duurMin: 70,
        tss: 92,
        segmenten: [],
      },
      null,
      evCtx,
      true,
    );
    assert_("coach missed adapt", true, !!fm.adapt);
    // FIX 4 — planned-prikkel uit de GEPLANDE zone-minuten: 'duur'-type met een
    // significant Z4-blok + Z2-basis → 'drempel' (niet 'duur'); lege segmenten →
    // type-fallback ongemoeid.
    const fa = coachFeedback_(
      {
        type: "long_z2",
        titel: "Lange Z2 + blok",
        duurMin: 120,
        tss: 90,
        segmenten: [
          { minuten: 90, bucket: "z2" },
          { minuten: 24, bucket: "drempel" },
        ],
      },
      null,
      evCtx,
      true,
    );
    assert_("coach planned uit zones", "drempel", fa.planned.intent);
    const fb2 = coachFeedback_(
      {
        type: "long_z2",
        titel: "Lange Z2",
        duurMin: 120,
        tss: 80,
        segmenten: [],
      },
      null,
      evCtx,
      true,
    );
    assert_("coach planned type-fallback", "duur", fb2.planned.intent);
    // FIX 4 — zelfde-intent 'different' (plIntent==acIntent='drempel', |ΔIF|≥0,10,
    // TSS net boven plan): nieuwe onder-volume-branch — géén swap-frasering ('i.p.v.'),
    // wél event-bewust, geen adapt/patroon-escalatie.
    const fc = coachFeedback_(
      {
        type: "threshold",
        titel: "Drempel 3x10",
        duurMin: 90,
        tss: 85,
        segmenten: [],
      },
      {
        duurMin: 75,
        tss: 88,
        ifReal: 88,
        zoneMin: { rust: 3, z2: 50, tempo: 3, drempel: 20, anaeroob: 0 },
      },
      evCtx,
      false,
    );
    assert_("coach same-intent different", "different", fc.state);
    assert_(
      "coach same-intent geen swap",
      true,
      fc.narrative.indexOf("i.p.v.") < 0,
    );
    assert_(
      "coach same-intent event-bewust",
      true,
      fc.narrative.indexOf("Girona") >= 0,
    );
    assert_("coach same-intent geen adapt", null, fc.adapt);
  });

  // ── coachAdaptatie_ (puur) — make-up-payload deterministisch + GELDIGE variant ──
  it("testCoachAdaptatie", () => {
    const settings = {
      ftp: 250,
      lthr: 160,
      doel: "FTP",
      doelStart: new Date(2026, 0, 5),
    };
    const lib = getTrainingLibrary_(settings);
    function inLib(wt: any, vid: any) {
      for (let i = 0; i < lib.length; i++)
        if (lib[i].type === wt) {
          for (let j = 0; j < lib[i].variants.length; j++)
            if (lib[i].variants[j].variantId === vid) return true;
        }
      return false;
    }
    // (i) afgeweken intensiteit-substitutie (gepland duur) → ingekorte long_z2-make-up.
    const aDuur = coachAdaptatie_(
      { intent: "duur", duurMin: 120 },
      lib,
      "2026-06-12",
      "vr 12 jun",
      "2026-06-07",
    );
    assert_("adapt duur type", "library", aDuur.type);
    assert_("adapt duur workoutType", "long_z2", aDuur.workoutType);
    assert_(
      "adapt duur variant geldig",
      true,
      !!aDuur.variantId && inLib(aDuur.workoutType, aDuur.variantId),
    );
    assert_(
      "adapt duur ingekort",
      true,
      aDuur.durMin > 0 && aDuur.durMin <= 120,
    );
    assert_("adapt duur dISO", "2026-06-12", aDuur.dISO);
    assert_("adapt duur from", "2026-06-07", aDuur.from);
    // (ii) gemiste sleutelprikkel (vo2) → ingekorte vo2max-make-up, geldige variant.
    const aVo2 = coachAdaptatie_(
      { intent: "vo2", duurMin: 70 },
      lib,
      "2026-06-10",
      "di 10 jun",
      "2026-06-06",
    );
    assert_("adapt vo2 workoutType", "vo2max", aVo2.workoutType);
    assert_(
      "adapt vo2 variant geldig",
      true,
      inLib(aVo2.workoutType, aVo2.variantId),
    );
    assert_("adapt vo2 durMin>0", true, aVo2.durMin > 0);
    // (iii) null: geen target / intent zonder deterministische make-up.
    assert_(
      "adapt geen target",
      null,
      coachAdaptatie_(
        { intent: "duur", duurMin: 120 },
        lib,
        null,
        "",
        "2026-06-07",
      ),
    );
    assert_(
      "adapt vrij null",
      null,
      coachAdaptatie_(
        { intent: "vrij", duurMin: 90 },
        lib,
        "2026-06-12",
        "vr",
        "2026-06-07",
      ),
    );
  });

  // ── Rit-detail (puur) — %FTP + zone-bucket + duur-format ──
  it("testRideDetail", () => {
    // %FTP uit watt (fallback-bron): round(watt/ftp*100).
    assert_("rd pctFtp 103", 103, rdPctFtp_(283, 275));
    assert_("rd pctFtp 61", 61, rdPctFtp_(168, 275));
    assert_("rd pctFtp geen ftp", null, rdPctFtp_(200, 0));
    // zone-bucket-grenzen (pctZoneBucket_: <56 rust / ≤75 z2 / ≤90 tempo / ≤105 drempel / >105 anaeroob).
    assert_("rd zone 55", "rust", pctZoneBucket_(55));
    assert_("rd zone 75", "z2", pctZoneBucket_(75));
    assert_("rd zone 90", "tempo", pctZoneBucket_(90));
    assert_("rd zone 105", "drempel", pctZoneBucket_(105));
    assert_("rd zone 110", "anaeroob", pctZoneBucket_(110));
    // duur-format: m:ss; ride-totaal h:mm:ss.
    assert_("rd dur 483", "8:03", rdDurMs_(483));
    assert_("rd dur 180", "3:00", rdDurMs_(180));
    assert_("rd dur ms 1u", "1:08:03", rdDurMs_(4083));
    assert_("rd dur hms", "0:58:32", rdDurHms_(3512));
    // W/kg = gem. vermogen ÷ gewicht (1 decimaal; null bij ontbrekend/0-gewicht).
    assert_("rd wkg 3.0", 3, rdWkg_(210, 70));
    assertClose_("rd wkg 3.5", 3.5, rdWkg_(245, 70), 0.001);
    assert_("rd wkg geen gewicht", null, rdWkg_(200, 0));
    assert_("rd wkg geen watt", null, rdWkg_(null, 70));
  });

  // ── 0-API zone-debt: cel-parser + tab-sourcing (puur) ───────────────
  it("testZoneTimesFromCell", () => {
    const valid = JSON.stringify([
      { id: "Z1", secs: 600 },
      { id: "Z3", secs: 300 },
    ]);
    const p = zoneTimesFromCell_(valid);
    assert_("zt valid is-array", true, Array.isArray(p));
    assert_("zt valid len", 2, p ? p.length : -1);
    assert_("zt valid id0", "Z1", p ? p[0].id : null);
    assert_("zt empty-string → null", null, zoneTimesFromCell_(""));
    assert_("zt whitespace → null", null, zoneTimesFromCell_("   "));
    assert_("zt null → null", null, zoneTimesFromCell_(null));
    assert_("zt empty-array → null", null, zoneTimesFromCell_("[]"));
    assert_("zt non-array json → null", null, zoneTimesFromCell_('{"a":1}'));
    assert_("zt scalar json → null", null, zoneTimesFromCell_("5"));
    assert_("zt malformed → null", null, zoneTimesFromCell_("[{id:"));
  });

  it("testZoneDebtSheet", () => {
    // Equivalentie: een tab-rij met icu_zone_times-JSON levert via
    // zoneActsByDateFromTab_ → actualZoneMinutes_ DEZELFDE bucket-minuten als een
    // live activity met dezelfde icu_zone_times (per-dag-loop is gedeelde code).
    const zt = [
      { id: "Z1", secs: 600 },
      { id: "Z2", secs: 600 },
      { id: "Z3", secs: 300 },
      { id: "Z5", secs: 120 },
      { id: "SS", secs: 90 },
    ];
    const liveAct = {
      type: "Ride",
      start_date_local: new Date(2026, 0, 5),
      icu_zone_times: zt,
    };
    const live = actualZoneMinutes_(liveAct, null);
    assertClose_("live low (Z1+Z2=20m)", 20, live.low, 0.001);
    assertClose_("live high (Z3=5m)", 5, live.high, 0.001);
    assertClose_("live anaerobic (Z5=2m)", 2, live.anaerobic, 0.001);
    assert_("live source power", "power", live.source);

    // Tab-rij (idx0 Datum, idx1 Type, idx15 Zone-tijden-JSON) → pseudo-activity.
    const row: any = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    row[0] = new Date(2026, 0, 5);
    row[1] = "Ride";
    row[ACT_ZONE_TIMES_IDX] = JSON.stringify(zt);
    const key = formatDate(stripTime_(new Date(2026, 0, 5)), "yyyy-MM-dd");
    const arr = zoneActsByDateFromTab_([row])[key];
    assert_("tab byDate has key", 1, arr ? arr.length : 0);
    const tab = arr ? actualZoneMinutes_(arr[0], null) : null;
    assertClose_("tab low == live", live.low, tab ? tab.low : -1, 0.001);
    assertClose_("tab high == live", live.high, tab ? tab.high : -1, 0.001);
    assertClose_(
      "tab anaerobic == live",
      live.anaerobic,
      tab ? tab.anaerobic : -1,
      0.001,
    );
    assert_("tab source power", "power", tab ? tab.source : null);

    // Lege zone-cel → pseudo zonder data → actualZoneMinutes_ null (drijft coverageGap).
    const emptyRow: any = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    emptyRow[0] = new Date(2026, 0, 6);
    emptyRow[1] = "Ride";
    emptyRow[ACT_ZONE_TIMES_IDX] = "";
    const key2 = formatDate(stripTime_(new Date(2026, 0, 6)), "yyyy-MM-dd");
    const arr2 = zoneActsByDateFromTab_([emptyRow])[key2];
    assert_("tab empty-cell row present", 1, arr2 ? arr2.length : 0);
    assert_(
      "tab empty-cell → null zonemin",
      null,
      arr2 ? actualZoneMinutes_(arr2[0], null) : "NOPE",
    );

    // Niet-fiets (Run) wordt gefilterd (geen entry in de map).
    const runRow: any = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    runRow[0] = new Date(2026, 0, 7);
    runRow[1] = "Run";
    runRow[ACT_ZONE_TIMES_IDX] = JSON.stringify(zt);
    assert_(
      "tab non-cycling filtered",
      0,
      Object.keys(zoneActsByDateFromTab_([runRow])).length,
    );
  });

  it("testDashActuals", () => {
    // Twee ritten zelfde datum, verschillende idx0-tijd, in "verkeerde" volgorde (oudste
    // eerst) → hoogste-timestamp wint ongeacht array-positie (pint volgorde-onafhankelijkheid).
    const rows = [
      _dcRow_(new Date(2025, 5, 10, 7, 0), {
        naam: "Ochtendrit",
        min: 75,
        ifv: 0.82,
        tss: 85,
      }), // 07:00 (ouder, staat eerst)
      _dcRow_(new Date(2025, 5, 10, 18, 0), {
        naam: "Avondrit",
        min: 40,
        ifv: 0.7,
        tss: 45,
      }), // 18:00 (nieuwer → wint)
      _dcRow_(new Date(2025, 5, 8), { naam: "", min: 0 }), // naam-fallback + lege tss/IF
      _dcRow_("geen-datum", { naam: "x", min: 99 }), // niet-Date → skip
    ];
    const m = dashActualsByDate_(rows);
    assert_("actuals key-count", 2, Object.keys(m).length);
    assert_("actuals hoogste-ts wint naam", "Avondrit", m["2025-06-10"].naam); // 18:00 wint, niet de eerste rij
    assert_("actuals hoogste-ts wint dur", 40, m["2025-06-10"].duurMin);
    assert_("actuals hoogste-ts wint tss", 45, m["2025-06-10"].tss);
    assertClose_(
      "actuals hoogste-ts wint IF",
      0.7,
      m["2025-06-10"].ifReal,
      0.0001,
    );
    assert_("actuals naam-fallback", "Rit", m["2025-06-08"].naam);
    assert_("actuals lege dur → 0", 0, m["2025-06-08"].duurMin);
    assert_("actuals lege tss → null", null, m["2025-06-08"].tss);
    assert_("actuals lege IF → null", null, m["2025-06-08"].ifReal);
  });

  it("testDashStats", () => {
    const rows = [
      _dcRow_(_dcDayOffset_(3), { min: 60, tss: 50 }), // d7 + d28 + jaar
      _dcRow_(_dcDayOffset_(5), { min: 30, tss: 20 }), // d7 + d28 + jaar
      _dcRow_(_dcDayOffset_(100), { min: 90, tss: 70 }), // jaar
      _dcRow_(_dcDayOffset_(400), { min: 120, tss: 100 }), // geen bucket (oudste)
      _dcRow_("x", { min: 99, tss: 99 }), // niet-Date → skip
    ];
    const s = dashStatsFromActivities_(rows);
    assert_("stats d7 ritten", 2, s.stats.d7.ritten);
    assert_("stats d7 min", 90, s.stats.d7.tijdMin);
    assert_("stats d7 tss", 70, s.stats.d7.tss);
    assert_("stats d28 ritten", 2, s.stats.d28.ritten); // 100d/400d uitgesloten
    assert_("stats d28 tss", 70, s.stats.d28.tss);
    assert_("stats jaar ritten", 3, s.stats.jaar.ritten); // 400d uitgesloten
    assert_("stats jaar min", 180, s.stats.jaar.tijdMin);
    assert_("stats jaar tss", 140, s.stats.jaar.tss);
    assert_("stats spanDagen", 400, s.spanDagen);
    assert_(
      "stats eersteDatum",
      formatDate(_dcDayOffset_(400), "yyyy-MM-dd"),
      s.eersteDatum,
    );
    // maandtotalen: som-invariant t.o.v. maand-split (geen flake bij maandgrens)
    let mr = 0,
      mt = 0;
    s.maandTotalen.forEach((x: any) => {
      mr += x.ritten;
      mt += x.tss;
    });
    assert_("stats maand som-ritten", 4, mr);
    assert_("stats maand som-tss", 240, mt);
    let sorted = true;
    for (let i = 1; i < s.maandTotalen.length; i++)
      if (s.maandTotalen[i - 1].maand < s.maandTotalen[i].maand) sorted = false;
    assert_("stats maand sorted-desc", true, sorted);
  });

  it("testDashBeginAnker", () => {
    const rows = [
      _dcRow_(new Date(2025, 5, 10), { ftp: 275, gew: 70 }),
      _dcRow_(new Date(2025, 2, 1), { ftp: 260, gew: 71 }),
      _dcRow_(new Date(2025, 0, 5), { ftp: 240, gew: 72 }), // oudste → anker
      _dcRow_("x", { ftp: 999, gew: 99 }), // niet-Date → skip
    ];
    const a = dashBeginAnker_(null, rows);
    assert_("anker ftp", 240, a.ftp);
    assert_("anker gewicht", 72, a.gewicht);
    assert_("anker datum", "2025-01-05", formatDate(a.datum, "yyyy-MM-dd"));
    assert_("anker leeg → null", null, dashBeginAnker_(null, []));
    const a2 = dashBeginAnker_(null, [_dcRow_(new Date(2025, 0, 5), {})]);
    assert_("anker lege ftp → null", null, a2.ftp);
    assert_("anker lege gew → null", null, a2.gewicht);
  });

  it("testDashNiveauReeks", () => {
    const rows = [
      _dcRow_(new Date(2025, 4, 15), { ftp: 270, gew: 68 }), // mei: telt
      _dcRow_(new Date(2025, 4, 2), { ftp: 999 }), // mei: gew leeg → skip
      _dcRow_(new Date(2025, 2, 20), { ftp: 260, gew: 70 }), // mrt: later → wint
      _dcRow_(new Date(2025, 2, 10), { ftp: 250, gew: 70 }), // mrt: vroeger → verliest
      _dcRow_(new Date(2025, 0, 25), { ftp: 245, gew: 71 }), // jan: later, MAAR anker overschrijft
      _dcRow_(new Date(2025, 0, 5), { ftp: 240, gew: 72 }), // jan: oudste = anker
      _dcRow_("x", { ftp: 1, gew: 1 }), // niet-Date → skip
    ];
    const out = dashNiveauReeks_(null, rows);
    assert_("niveau out[0] maand", "2025-01", out[0].maand);
    assert_("niveau anker-overschrijft ftp", 240, out[0].ftp); // 245 (later) verliest van anker 240
    assert_("niveau anker-overschrijft gew", 72, out[0].gewicht);
    const exp01 = Math.round(computeNiveau_(240, 72).niveau * 10) / 10;
    assertClose_("niveau anker-niveau", exp01, out[0].niveau, 0.0001);
    const mrt = _dcFindMaand_(out, "2025-03");
    assert_("niveau mrt last-on-date ftp", 260, mrt.ftp); // 03-20 wint van 03-10
    assert_("niveau mrt gew", 70, mrt.gewicht);
    const mei = _dcFindMaand_(out, "2025-05");
    assert_("niveau mei null-gew-skip ftp", 270, mei.ftp); // 999/leeg-gew genegeerd
    assert_("niveau mei gew", 68, mei.gewicht);
    const feb = _dcFindMaand_(out, "2025-02");
    assert_("niveau feb gap ftp", null, feb.ftp);
    assert_("niveau feb gap niveau", null, feb.niveau);
    assert_("niveau lengte >= 6", true, out.length >= 6); // jan..nu minstens
  });

  // ── activityToRow_ (pure mapper, 17-koloms) ─────────────────────────
  it("testActivityToRow", () => {
    const zt = [
      { id: "Z1", secs: 600 },
      { id: "Z3", secs: 300 },
    ];
    const fx = {
      id: "i12345",
      start_date_local: "2026-06-10T07:30:00",
      type: "Ride",
      name: "Ochtendrit",
      moving_time: 3600,
      distance: 30000,
      icu_average_watts: 210,
      icu_weighted_avg_watts: 225,
      icu_intensity: 77,
      icu_training_load: 85,
      polarization_index: 1.83,
      average_heartrate: 142,
      max_heartrate: 176,
      icu_ftp: 270,
      icu_weight: 70,
      icu_rolling_ftp: 268,
      icu_zone_times: zt,
    };
    const row = activityToRow_(fx);
    assert_("a2r length=17", ACT_HEADERS.length, row.length);
    assert_("a2r idx0 datum", "2026-06-10", formatDate(row[0], "yyyy-MM-dd"));
    assert_("a2r idx1 type", "Ride", row[1]);
    assert_("a2r idx2 naam", "Ochtendrit", row[2]);
    assert_("a2r idx3 duur-min", 60, row[3]);
    assert_("a2r idx4 afstand-km", 30, row[4]);
    assert_("a2r idx5 gem-W", 210, row[5]);
    assert_("a2r idx6 norm-W", 225, row[6]);
    assert_("a2r idx7 IF=percentage", 77, row[7]);
    assert_("a2r idx8 TSS", 85, row[8]);
    assert_("a2r idx9 gem-HR", 142, row[9]);
    assert_("a2r idx10 max-HR", 176, row[10]);
    assertClose_("a2r idx11 PI", 1.83, row[11], 0.0001);
    assert_("a2r idx12 FTP", 270, row[12]);
    assert_("a2r idx13 gewicht", 70, row[13]);
    assert_("a2r idx14 rolling-FTP", 268, row[14]);
    assert_("a2r idx15 zone-tijden JSON", JSON.stringify(zt), row[15]);
    assert_("a2r idx16 id", "i12345", row[16]);
    assert_(
      "a2r geen id → leeg",
      "",
      activityToRow_({ start_date_local: "2026-06-10T07:30:00" })[16],
    );
    assert_(
      "a2r numeriek id → String",
      "999",
      activityToRow_({ id: 999, start_date_local: "2026-06-10T07:30:00" })[16],
    );
  });

  // ── mergeById_ (pure upsert) ────────────────────────────────────────
  it("testMergeById", () => {
    // (a) verse id nog niet in tab → append
    const rA = mergeById_(
      [activityToRow_(_mkAct_("A", "2026-06-01T08:00:00"))],
      [_mkAct_("B", "2026-06-02T08:00:00")],
    );
    assert_("merge(a) added", 1, rA.added);
    assert_("merge(a) updated", 0, rA.updated);
    assert_("merge(a) len", 2, rA.rows.length);
    assert_("merge(a) nieuwe id", "B", rA.rows[1][ACT_ID_IDX]);

    // (b) verse id al in tab → update-in-plaats
    const rB = mergeById_(
      [activityToRow_(_mkAct_("A", "2026-06-01T08:00:00", { name: "Oud" }))],
      [_mkAct_("A", "2026-06-01T08:00:00", { name: "Nieuw" })],
    );
    assert_("merge(b) added", 0, rB.added);
    assert_("merge(b) updated", 1, rB.updated);
    assert_("merge(b) len", 1, rB.rows.length);
    assert_("merge(b) vervangen naam", "Nieuw", rB.rows[0][2]);
    assert_("merge(b) id behouden", "A", rB.rows[0][ACT_ID_IDX]);

    // (c) pre-migratie rij (lege id) matcht op minuut → fallback-update + id ingezet
    const exC: any = [activityToRow_(_mkAct_(null, "2026-06-01T08:00:00"))];
    assert_("merge(c) pre-id leeg", "", exC[0][ACT_ID_IDX]);
    const rC = mergeById_(exC, [_mkAct_("A", "2026-06-01T08:00:30")]); // zelfde minuut
    assert_("merge(c) added", 0, rC.added);
    assert_("merge(c) updated", 1, rC.updated);
    assert_("merge(c) id gemigreerd", "A", rC.rows[0][ACT_ID_IDX]);

    // (d) twee ritten zelfde dag, andere id → beide, geen collision
    const rD = mergeById_(
      [],
      [
        _mkAct_("A", "2026-06-01T08:00:00"),
        _mkAct_("B", "2026-06-01T17:00:00"),
      ],
    );
    assert_("merge(d) added", 2, rD.added);
    assert_("merge(d) updated", 0, rD.updated);
    assert_("merge(d) id0", "A", rD.rows[0][ACT_ID_IDX]);
    assert_("merge(d) id1", "B", rD.rows[1][ACT_ID_IDX]);

    // (e) lege verse set → no-op
    const rE = mergeById_(
      [activityToRow_(_mkAct_("A", "2026-06-01T08:00:00"))],
      [],
    );
    assert_("merge(e) added", 0, rE.added);
    assert_("merge(e) updated", 0, rE.updated);
    assert_("merge(e) len", 1, rE.rows.length);
    assert_("merge(e) id", "A", rE.rows[0][ACT_ID_IDX]);

    // (f) existing buiten verse set → blijft staan
    const rF = mergeById_(
      [
        activityToRow_(_mkAct_("A", "2026-06-01T08:00:00")),
        activityToRow_(_mkAct_("B", "2026-06-02T08:00:00")),
      ],
      [_mkAct_("A", "2026-06-01T08:00:00", { name: "A2" })],
    );
    assert_("merge(f) added", 0, rF.added);
    assert_("merge(f) updated", 1, rF.updated);
    assert_("merge(f) len", 2, rF.rows.length);
    assert_(
      "merge(f) B blijft",
      true,
      rF.rows[0][ACT_ID_IDX] === "B" || rF.rows[1][ACT_ID_IDX] === "B",
    );
  });

  // ── eftpFromActivities_ + actAnchorDate_ (volgorde-onafhankelijk) ────
  it("testEftpFromActivities", () => {
    function eRow_(date: any, ftp14: any) {
      const r: any = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
      r[0] = date;
      r[14] = ftp14;
      return r;
    }
    // ≥2 geldige idx14, verschillende timestamps, geshuffeld → hoogste-ts-FTP wint (niet positie)
    const rows = [
      eRow_(new Date(2025, 0, 10), 250), // ouder, staat eerst
      eRow_(new Date(2025, 3, 20), 275), // nieuwste → wint (idx 1)
      eRow_(new Date(2025, 2, 5), 260),
    ];
    assert_("eftp hoogste-ts wint", 275, eftpFromActivities_(rows));
    // nieuwste rij ongeldige idx14 (0) → val terug op de nieuwste GELDIGE
    assert_(
      "eftp ongeldig genegeerd",
      260,
      eftpFromActivities_([
        eRow_(new Date(2025, 3, 20), 0),
        eRow_(new Date(2025, 2, 5), 260),
      ]),
    );
    // geen geldige idx14 → null; lege input → null
    assert_(
      "eftp geen geldige → null",
      null,
      eftpFromActivities_([
        eRow_(new Date(2025, 3, 20), ""),
        eRow_(new Date(2025, 2, 5), 0),
      ]),
    );
    assert_("eftp lege input → null", null, eftpFromActivities_([]));
  });

  it("testActAnchorDate", () => {
    function dRow_(date: any) {
      const r: any = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
      r[0] = date;
      return r;
    }
    // geshuffeld → meest recente datum wint, niet de eerste rij
    const a = actAnchorDate_([
      dRow_(new Date(2025, 0, 10)),
      dRow_(new Date(2025, 3, 20)),
      dRow_(new Date(2025, 2, 5)),
    ]);
    assert_("anchor hoogste datum", "2025-04-20", formatDate(a, "yyyy-MM-dd"));
    assert_(
      "anchor geen datum → null",
      null,
      actAnchorDate_([dRow_("x"), dRow_("")]),
    );
  });

  // ── sortActivityRowsNewestFirst_ (cosmetisch, gedeeld) ──────────────
  it("testSortActivityRowsNewestFirst", () => {
    function sRow_(date: any, tag: any) {
      const r: any = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
      r[0] = date;
      r[2] = tag;
      return r;
    }
    const out = sortActivityRowsNewestFirst_([
      sRow_(new Date(2025, 0, 10), "oud"),
      sRow_(new Date(2025, 3, 20), "nieuw"),
      sRow_(new Date(2025, 2, 5), "mid"),
    ]);
    assert_("sort newest [0]", "nieuw", out[0][2]);
    assert_("sort newest [1]", "mid", out[1][2]);
    assert_("sort newest [2]", "oud", out[2][2]);
    const inp = [
      sRow_(new Date(2025, 0, 1), "a"),
      sRow_(new Date(2025, 5, 1), "b"),
    ];
    sortActivityRowsNewestFirst_(inp);
    assert_("sort pure (input ongemoeid)", "a", inp[0][2]);
  });

  // ── Onderhoud (5e doel) — scaffolding (Fase 1) ──────────────────────
  it("testOnderhoudProfiel", () => {
    assert_(
      "onderhoud in DOEL_OPTIONS",
      true,
      DOEL_OPTIONS.indexOf("Onderhoud") >= 0,
    );
    assert_(
      "profileForDoel Onderhoud → id onderhoud",
      "onderhoud",
      profileForDoel_("Onderhoud").id,
    );
    const p = PROFILES.onderhoud;
    assertClose_(
      "onderhoud drempel 0.40",
      0.4,
      p.intentGewichten.drempel,
      0.0001,
    );
    assertClose_(
      "onderhoud sweetspot 0.40",
      0.4,
      p.intentGewichten.sweetspot,
      0.0001,
    );
    assertClose_("onderhoud vo2 0.20", 0.2, p.intentGewichten.vo2, 0.0001);
    assert_(
      "onderhoud vo2 laagste",
      true,
      p.intentGewichten.vo2 < p.intentGewichten.drempel &&
        p.intentGewichten.vo2 < p.intentGewichten.sweetspot,
    );
    assert_("onderhoud kwaliteitPerWeek.Base 2", 2, p.kwaliteitPerWeek.Base);
    assert_("onderhoud langeRitPerWeek 0", 0, p.langeRitPerWeek);
    assert_("onderhoud vo2Slope 0", 0, p.volumeResponse.vo2Slope);
    assert_("onderhoud vo2Cap 0", 0, p.volumeResponse.vo2Cap);
    // REGRESSIE-guard: de 4 bestaande doel→profiel-mappings ongewijzigd.
    assert_("regr FTP → ftp", "ftp", profileForDoel_("FTP").id);
    assert_(
      "regr Conditie → conditie",
      "conditie",
      profileForDoel_("Conditie").id,
    );
    assert_(
      "regr Beklimmingen → klim",
      "klim",
      profileForDoel_("Beklimmingen").id,
    );
    assert_("regr VO2max → vo2max", "vo2max", profileForDoel_("VO2max").id);
  });

  // ── Korte quality-archetypes (Fase 2a, ~32-40 min voor Onderhoud) ───
  it("testKorteArchetypes", () => {
    function byId_(id: any) {
      return ARCHETYPES.filter((a: any) => a.id === id)[0];
    }
    const t28 = byId_("threshold_2x8"),
      s210 = byId_("sweetspot_2x10");
    assert_("threshold_2x8 bestaat", true, !!t28);
    assert_(
      "threshold_2x8 effectTag drempel",
      true,
      !!t28 && t28.effectTags.indexOf("drempel") >= 0,
    );
    assert_("threshold_2x8 max 45", 45, t28.duurRange[1]);
    assert_(
      "threshold_2x8 min in [30,34]",
      true,
      t28.duurRange[0] >= 30 && t28.duurRange[0] <= 34,
    );
    assert_("sweetspot_2x10 bestaat", true, !!s210);
    assert_(
      "sweetspot_2x10 effectTag sweetspot",
      true,
      !!s210 && s210.effectTags.indexOf("sweetspot") >= 0,
    );
    assert_("sweetspot_2x10 max 45", 45, s210.duurRange[1]);
    assert_(
      "sweetspot_2x10 min in [32,37]",
      true,
      s210.duurRange[0] >= 32 && s210.duurRange[0] <= 37,
    );
    // expandeerbaar bij bt=40 → geldig workout ≤45 met het drempel/sweetspot-werkblok (numerieke pct).
    const cE = {
      ftp: 275,
      lthr: 178,
      doelMin: 40,
      mesoFactor: 1.0,
      faseOffset: 0,
    };
    const woT = expandArchetype_(t28, cE),
      woS = expandArchetype_(s210, cE);
    assert_(
      "t28 exp ≤45 + numeriek",
      true,
      woT.totaalMin > 0 &&
        woT.totaalMin <= 45 &&
        woT.blokken.every((b: any) => b.pctLo > 0 && b.pctHi >= b.pctLo),
    );
    assert_(
      "t28 drempelwerk aanwezig",
      true,
      woT.blokken.some((b: any) => b.pctLo === 98 && b.pctHi === 105),
    );
    assert_(
      "s210 exp ≤45 + numeriek",
      true,
      woS.totaalMin > 0 &&
        woS.totaalMin <= 45 &&
        woS.blokken.every((b: any) => b.pctLo > 0 && b.pctHi >= b.pctLo),
    );
    assert_(
      "s210 sweetspotwerk aanwezig",
      true,
      woS.blokken.some((b: any) => b.pctLo === 88 && b.pctHi === 92),
    );
    // DRIFT-guard: bij bt=80 kiest goalWorkout_ NIET de korte archetypes (duurRange sluit ze uit).
    const g = goalWorkout_(profileForDoel_("FTP"), "Build", 80, []);
    assert_(
      "geen korte-arch bij bt=80",
      true,
      !!g &&
        g.archetypeId !== "threshold_2x8" &&
        g.archetypeId !== "sweetspot_2x10",
    );
  });

  // ── Fase 2b: korte archetypes profiel-gescoped (restrictTo → onderhoud) ──
  it("testOnderhoudArchetypeScope", () => {
    const shortIds = ["threshold_2x8", "sweetspot_2x10"];
    function byId_(id: any) {
      return ARCHETYPES.filter((a: any) => a.id === id)[0];
    }
    assert_(
      "threshold_2x8 restrictTo onderhoud",
      true,
      byId_("threshold_2x8").restrictTo.indexOf("onderhoud") >= 0,
    );
    assert_(
      "sweetspot_2x10 restrictTo onderhoud",
      true,
      byId_("sweetspot_2x10").restrictTo.indexOf("onderhoud") >= 0,
    );
    assert_(
      "threshold_2x20 geen restrictTo",
      true,
      byId_("threshold_2x20").restrictTo == null,
    );
    // intentHaalbaar_ EENS met de pool: onderhoud ziet kort drempel/sweetspot @40, klim NIET.
    assert_(
      "haalbaar drempel@40 onderhoud",
      true,
      intentHaalbaar_("drempel", 40, "onderhoud"),
    );
    assert_(
      "haalbaar drempel@40 klim NIET",
      false,
      intentHaalbaar_("drempel", 40, "klim"),
    );
    assert_(
      "haalbaar sweetspot@40 onderhoud",
      true,
      intentHaalbaar_("sweetspot", 40, "onderhoud"),
    );
    assert_(
      "haalbaar sweetspot@40 klim NIET",
      false,
      intentHaalbaar_("sweetspot", 40, "klim"),
    );
    // integratie: onderhoud@40 → kort quality-archetype (niet null/recovery); ftp/klim@40 → niet de korte.
    const gO = goalWorkout_(profileForDoel_("Onderhoud"), "Base", 40, []);
    assert_(
      "onderhoud@40 → kort archetype",
      true,
      !!gO && shortIds.indexOf(gO.archetypeId) >= 0 && gO.type !== "recovery",
    );
    const gF = goalWorkout_(profileForDoel_("FTP"), "Build", 40, []);
    assert_(
      "ftp@40 geen kort archetype",
      true,
      !gF || shortIds.indexOf(gF.archetypeId) < 0,
    );
    const gK = goalWorkout_(profileForDoel_("Beklimmingen"), "Build", 40, []);
    assert_(
      "klim@40 geen kort archetype",
      true,
      !gK || shortIds.indexOf(gK.archetypeId) < 0,
    );
  });

  // ── Fase 2: Onderhoud gedrag-kern (fase-pin + quota 2 + debt-off + 45-cap) ──
  it("testOnderhoudWeekSim", () => {
    // (a) fase-pin: Onderhoud → Base (overrult stale→Test); 4 doelen passthrough.
    assert_(
      "effFase Onderhoud stale→Base",
      "Base",
      effectiveMacroFase_("Test", { doel: "Onderhoud" }),
    );
    assert_(
      "effFase FTP Peak passthrough",
      "Peak",
      effectiveMacroFase_("Peak", { doel: "FTP" }),
    );
    assert_(
      "effFase FTP Test passthrough",
      "Test",
      effectiveMacroFase_("Test", { doel: "FTP" }),
    );

    // (b) week-sim via de allocator op de gepinde Base-fase; ruime beschikbaarheid (bt≥60 → 45-cap bindt).
    function dW(idx: any, type: any, minuten: any) {
      return {
        dagIdx: idx,
        dag: "d" + idx,
        train: true,
        datum: new Date(2026, 5, 8 + idx),
        minuten: minuten,
        type: type,
        gedaan: false,
        voorgesteldType: "",
      };
    }
    function byId_(id: any) {
      return ARCHETYPES.filter((a: any) => a.id === id)[0];
    }
    const week = [
      dW(0, "vrij", 60),
      dW(1, "vrij", 75),
      dW(2, "vrij", 90),
      dW(3, "vrij", 60),
      dW(4, "vrij", 75),
      dW(5, "weekend", 120),
      dW(6, "weekend", 90),
    ];
    const dek = { low: false, high: false, anaerobic: false };
    const today = new Date(2026, 5, 8);
    const debt = { low: 0, high: 30, anaerobic: 0 }; // zou ZONDER debt-off een quality-slot claimen
    const plan = allocateQualityWeek_(
      week,
      PROFILES.onderhoud,
      "Base",
      dek,
      [],
      null,
      debt,
      { doel: "Onderhoud", pendelDuurMin: 80 },
      today,
      false,
      null,
    );

    const qKeys = Object.keys(plan).filter((k) => plan[k].role === "quality");
    assert_("onderhoud exact 2 quality", 2, qKeys.length);
    let typesOk = true,
      capOk = true,
      archOk = true;
    qKeys.forEach((k) => {
      const p = plan[k];
      if (["threshold", "sweet_spot", "vo2max"].indexOf(p.type) < 0)
        typesOk = false; // niet recovery/skip
      if (p.archetypeId == null) archOk = false; // debt-slot zou archetypeId:null zijn
      const rec = p.archetypeId ? byId_(p.archetypeId) : null;
      if (!rec || rec.duurRange[0] > 45) capOk = false; // korte archetype: past ≤45 (de cap)
    });
    assert_("onderhoud quality types (geen recovery)", true, typesOk);
    assert_("onderhoud alle quality ≤45 (korte arch)", true, capOk);
    assert_("onderhoud geen debt-slot (arch gezet)", true, archOk);
    const geenLang = Object.keys(plan).every(
      (k) =>
        plan[k].role !== "longride" &&
        plan[k].role !== "longride_efforts" &&
        plan[k].type !== "combo_long_with_efforts",
    );
    assert_("onderhoud geen lange-rit (langeRitPerWeek 0)", true, geenLang);

    // (c) REGRESSIE-contrast: FTP-week ongemoeid — debt AAN (debt-slot met archetypeId:null), bt-klem geen effect.
    const planF = allocateQualityWeek_(
      week,
      PROFILES.ftp,
      "Build",
      dek,
      [],
      null,
      debt,
      { doel: "FTP", pendelDuurMin: 80 },
      today,
      false,
      null,
    );
    const qF = Object.keys(planF).filter((k) => planF[k].role === "quality");
    assert_("ftp Build quality >=1", true, qF.length >= 1);
    assert_(
      "ftp debt-slot aanwezig (contrast met Onderhoud)",
      true,
      qF.some((k) => planF[k].archetypeId == null),
    );
  });

  // ── Fase 3: plan-card mode-label (Onderhoud-doel wint; 4 doelen ongewijzigd) ──
  it("testPlanModeLabel", () => {
    assert_(
      "modeLabel Onderhoud-doel",
      "Onderhoud",
      planModeLabel_(
        { doel: "Onderhoud", fase: "build" },
        { eventDriven: false },
      ),
    );
    assert_(
      "modeLabel Onderhoud wint van event",
      "Onderhoud",
      planModeLabel_({ doel: "Onderhoud" }, { eventDriven: true }),
    );
    assert_(
      "modeLabel FTP → Opbouw",
      "Opbouw",
      planModeLabel_({ doel: "FTP", fase: "build" }, { eventDriven: false }),
    );
    assert_(
      "modeLabel FTP event → Doel-gericht",
      "Doel-gericht",
      planModeLabel_({ doel: "FTP" }, { eventDriven: true }),
    );
    assert_(
      "modeLabel FTP maintain → Onderhoud (bestaand)",
      "Onderhoud",
      planModeLabel_({ doel: "FTP", fase: "maintain" }, { eventDriven: false }),
    );
  });

  // ── wellnessSignal_ — HRV/slaap-derivatie (Fase 1a, port Algorithm.gs:1251) ──
  // Cadans-conventie = OUDSTE-EERST; recent/baseline slicen vanaf het EIND.
  it("testWellnessSignalOrdering", () => {
    // hrv oudste→nieuwste: [60,60,45,45,45]. slice(-3) = de LAATSTE 3 (45) —
    // NIET de eerste 3. Wie vanaf de kop sliced, krijgt recent≈55 → deze test valt.
    const rows = [
      _wrow_({ hrv: 60, slaap: 8 }),
      _wrow_({ hrv: 60, slaap: 8 }),
      _wrow_({ hrv: 45, slaap: 8 }),
      _wrow_({ hrv: 45, slaap: 8 }),
      _wrow_({ hrv: 45, slaap: 8 }),
    ];
    const s = wellnessSignal_(rows);
    assert_("wsig recent = laatste 3 (oudste-eerst)", 45, s.hrvRecent);
    assert_("wsig baseline = gemiddelde alle", 51, s.hrvBaseline);
    assert_("wsig deficit round((45-51)/51*100)", -12, s.hrvDeficit);
    assert_("wsig sleepLastNight = laatste rij", 8, s.sleepLastNight);
    assert_("wsig signal demote (hrv <-10)", "demote", s.signal);
  });

  it("testWellnessSignalSleep", () => {
    // Geen HRV (idx2=0 → null) → hrvDeficit null; slaap stuurt de cascade alleen.
    const sig = (slaap: any) =>
      wellnessSignal_([
        _wrow_({ hrv: 0, slaap: slaap }),
        _wrow_({ hrv: 0, slaap: slaap }),
        _wrow_({ hrv: 0, slaap: slaap }),
      ]);
    assert_("wsig slaap 4.9 → recovery", "recovery", sig(4.9).signal);
    assert_(
      "wsig slaap 5.0 grens → demote (niet recovery)",
      "demote",
      sig(5.0).signal,
    );
    assert_("wsig slaap 5.5 → demote", "demote", sig(5.5).signal);
    assert_("wsig slaap 6.5 → warning", "warning", sig(6.5).signal);
    assert_("wsig slaap 7.5 → normal", "normal", sig(7.5).signal);
    assert_("wsig geen hrv → deficit null", null, sig(7.5).hrvDeficit);
  });

  it("testWellnessSignalHrv", () => {
    // Slaap 8 (geen slaap-tak) → HRV-deficit stuurt de cascade.
    const flat = (n: number, hrv: number, slaap: number) =>
      Array.from({ length: n }, () => _wrow_({ hrv: hrv, slaap: slaap }));
    const demote = wellnessSignal_([...flat(17, 60, 8), ...flat(3, 40, 8)]);
    assert_("wsig hrv-deficit -30 → demote", "demote", demote.signal);
    assert_("wsig hrv-deficit waarde -30", -30, demote.hrvDeficit);
    const warn = wellnessSignal_([...flat(17, 60, 8), ...flat(3, 54, 8)]);
    assert_("wsig hrv-deficit -9 → warning", "warning", warn.signal);
    const normal = wellnessSignal_(flat(6, 60, 8));
    assert_("wsig hrv gelijk → deficit 0", 0, normal.hrvDeficit);
    assert_("wsig hrv gelijk → normal", "normal", normal.signal);
    // combo-tak: deficit <-10 EN sleepAvg3 <6 → recovery.
    const combo = wellnessSignal_([...flat(17, 60, 8), ...flat(3, 40, 5.5)]);
    assert_(
      "wsig hrv+slaap onder baseline → recovery",
      "recovery",
      combo.signal,
    );
  });

  it("testWellnessSignalNulls", () => {
    // Null-slaap mag GEEN tak triggeren (coercion-val: null<5 zou true zijn).
    const noSleep = wellnessSignal_([
      _wrow_({ hrv: 50 }),
      _wrow_({ hrv: 50 }),
      _wrow_({ hrv: 50 }),
    ]);
    assert_(
      "wsig null-slaap → normal (geen coercion-tak)",
      "normal",
      noSleep.signal,
    );
    assert_(
      "wsig null-slaap → sleepLastNight null",
      null,
      noSleep.sleepLastNight,
    );
    assert_("wsig null-slaap → sleepAvg3 null", null, noSleep.sleepAvg3);
    // Lege reeks → fallback normal + alles null.
    assert_("wsig lege reeks → normal", "normal", wellnessSignal_([]).signal);
    assert_(
      "wsig lege reeks → deficit null",
      null,
      wellnessSignal_([]).hrvDeficit,
    );
    assert_(
      "wsig lege reeks → baseline null",
      null,
      wellnessSignal_([]).hrvBaseline,
    );
  });

  // ── formStateFromWellness_ — fs-input (Fase 1a, port getFormScore_ :1337) ──
  it("testFormState", () => {
    const d = (n: number) => new Date(2026, 0, n);
    const rows = [
      _wrow_({ date: d(1), ctl: 58, atl: 49, ramp: 2.5 }),
      _wrow_({ date: d(2), ctl: 59, atl: 49, ramp: 2.8 }),
      _wrow_({ date: d(3), ctl: 60, atl: 50, ramp: 3 }),
    ];
    const fs = formStateFromWellness_(rows);
    assert_("formState ctl = laatste rij", 60, fs?.ctl);
    assert_("formState atl = laatste rij", 50, fs?.atl);
    assert_("formState form = ctl-atl", 10, fs?.form);
    assert_("formState ramp = idx11", 3, fs?.ramp);
    // Laatste rij mist atl → wordt overgeslagen; pak de vorige complete rij.
    const gap = formStateFromWellness_([
      _wrow_({ date: d(1), ctl: 55, atl: 48, ramp: 2 }),
      _wrow_({ date: d(2), ctl: 62, ramp: 4 }),
    ]);
    assert_("formState slaat incomplete laatste rij over", 55, gap?.ctl);
    assert_("formState vorige-rij form", 7, gap?.form);
    // Geen enkele rij met ctl+atl → null; lege reeks → null; string-datum → null.
    assert_(
      "formState geen ctl/atl → null",
      null,
      formStateFromWellness_([_wrow_({ date: d(1), hrv: 50 })]),
    );
    assert_("formState lege reeks → null", null, formStateFromWellness_([]));
    assert_(
      "formState idx0 geen Date → null",
      null,
      formStateFromWellness_([
        _wrow_({ date: "2026-01-01", ctl: 60, atl: 50 }),
      ]),
    );
  });

  it("testReadinessAssembly", () => {
    // End-to-end: wellnessSignal_ + formStateFromWellness_ → getReadinessScore_.
    const d = (n: number) => new Date(2026, 0, n);
    const rows = [
      _wrow_({ date: d(1), hrv: 50, slaap: 8, ctl: 58, atl: 49, ramp: 2.5 }),
      _wrow_({ date: d(2), hrv: 50, slaap: 8, ctl: 59, atl: 49, ramp: 2.8 }),
      _wrow_({ date: d(3), hrv: 50, slaap: 8, ctl: 60, atl: 50, ramp: 3 }),
    ];
    const res = getReadinessScore_(
      formStateFromWellness_(rows),
      wellnessSignal_(rows),
      [],
      null,
    );
    assert_("readiness assembly score", 89, res.score);
    assert_("readiness assembly band", "ready", res.band);
    assert_(
      "readiness belasting-sub (fs.ctl/atl/ramp doorgerijgd)",
      85,
      res.factors.find((f: any) => f.key === "belasting").sub,
    );
    assert_(
      "readiness hrv-sub (wellness.hrvDeficit doorgerijgd)",
      75,
      res.factors.find((f: any) => f.key === "hrv").sub,
    );
  });

  // ── weekprep.ts (Fase 5.3a): plan-gekoppelde weekgen-prep ────────────
  it("testRollingZoneCoverage", () => {
    const today = "2026-03-15"; // cutoff = 2026-03-08 → venster [03-08..03-15] (8 dagen)
    const intent: any = { "2026-03-14": { low: 60, high: 20, anaerobic: 0 } };
    const rows = [
      _wpRow_(new Date(2026, 2, 14), { type: "Ride" }), // intent → low+high (multi-bucket)
      _wpRow_(new Date(2026, 2, 13), { type: "Ride", iff: 0.9 }), // IF → high
      _wpRow_(new Date(2026, 2, 12), { type: "Ride", iff: 0.7 }), // IF → low
      _wpRow_(new Date(2026, 2, 12), { type: "Run", iff: 0.99 }), // niet-fiets → weg
      _wpRow_(new Date(2026, 2, 8), { type: "Ride", iff: 0.96 }), // rand-in (today-7) → anaerobic
      _wpRow_(new Date(2026, 2, 7), { type: "Ride", iff: 0.99 }), // rand-uit (today-8) → weg
    ];
    const cov = rollingZoneCoverage_(rows, intent, today, 7);
    assert_("rolling cov.low", 2, cov.low);
    assert_("rolling cov.high", 2, cov.high);
    assert_(
      "rolling cov.anaerobic (rand-in telt, niet-fiets weg)",
      1,
      cov.anaerobic,
    );
    assert_(
      "rolling lege reeks → 0",
      0,
      rollingZoneCoverage_([], {}, today).low,
    );
    assert_(
      "rolling today-7 telt mee",
      1,
      rollingZoneCoverage_(
        [_wpRow_(new Date(2026, 2, 8), { iff: 0.96 })],
        {},
        today,
      ).anaerobic,
    );
    assert_(
      "rolling today-8 valt buiten",
      0,
      rollingZoneCoverage_(
        [_wpRow_(new Date(2026, 2, 7), { iff: 0.96 })],
        {},
        today,
      ).anaerobic,
    );
  });

  it("testZoneDebt", () => {
    const week = "2026-03-09"; // venster [03-09 .. 03-16)
    const intent: any = {
      "2026-03-10": { low: 60, high: 30, anaerobic: 0 },
      "2026-03-11": { low: 40, high: 0, anaerobic: 15 }, // geen zone-data → actual 0 → debt = intent
      "2026-03-12": { low: 100, high: 0, anaerobic: 0 }, // GEMIST maar verstreken → volle debt (M63)
      "2026-03-20": { low: 100, high: 0, anaerobic: 0 }, // buiten [maandag..vandaag) → genegeerd
    };
    const days = [
      { datum: "2026-03-10", train: true, gedaan: true },
      { datum: "2026-03-11", train: true, gedaan: true },
      { datum: "2026-03-12", train: true, gedaan: false },
      { datum: "2026-03-20", train: true, gedaan: true },
    ];
    const acts = [
      _wpRow_(new Date(2026, 2, 10), {
        type: "Ride",
        zoneJson: JSON.stringify([
          { id: "Z1", secs: 1800 }, // 30 min low
          { id: "Z3", secs: 600 }, // 10 min high
        ]),
      }),
    ];
    // M63: de poort staat op VERSTREKEN, niet op `gedaan`. Met vandaag = 03-13 tellen
    // 03-10, 03-11 én het GEMISTE 03-12 mee; 03-20 valt buiten [maandag .. vandaag).
    const debt = zoneDebt_(intent, days, acts, week, "2026-03-13");
    assert_("debt.low (60-30 + 40 + 100 gemist)", 170, debt.low);
    assert_("debt.high (30-10 + 0)", 20, debt.high);
    assert_("debt.anaerobic (0 + 15)", 15, debt.anaerobic);
    const neg = zoneDebt_(
      { "2026-03-13": { low: 20, high: 0, anaerobic: 0 } },
      [{ datum: "2026-03-13", train: true, gedaan: true }],
      [
        _wpRow_(new Date(2026, 2, 13), {
          type: "Ride",
          zoneJson: JSON.stringify([{ id: "Z1", secs: 3600 }]),
        }),
      ],
      week,
      "2026-03-14",
    );
    assert_("debt negatief geen clamp (20-60)", -40, neg.low);
    assert_(
      "debt lege plannerDays → 0",
      0,
      zoneDebt_({}, [], [], week, "2026-03-14").low,
    );

    // ── M63-fork, expliciet (geautoriseerde GAS-divergentie, Algorithm.gs:515) ──
    const wk = "2026-03-09";
    const vandaag = "2026-03-13";
    // (a) volledig GEMISTE verstreken train-dag met intent → volle intent als debt.
    const gemist = zoneDebt_(
      { "2026-03-11": { low: 45, high: 25, anaerobic: 5 } },
      [{ datum: "2026-03-11", train: true, gedaan: false }],
      [],
      wk,
      vandaag,
    );
    assert_("M63 gemiste dag → volle debt low", 45, gemist.low);
    assert_("M63 gemiste dag → volle debt high", 25, gemist.high);
    assert_("M63 gemiste dag → volle debt anaerobic", 5, gemist.anaerobic);
    // (b) TE-LICHT gereden verstreken dag → intent − actual (deel-debt).
    const teLicht = zoneDebt_(
      { "2026-03-11": { low: 45, high: 25, anaerobic: 0 } },
      [{ datum: "2026-03-11", train: true, gedaan: false }],
      [
        _wpRow_(new Date(2026, 2, 11), {
          type: "Ride",
          zoneJson: JSON.stringify([{ id: "Z1", secs: 1200 }]), // 20 min low
        }),
      ],
      wk,
      vandaag,
    );
    assert_("M63 te licht → intent-actual low (45-20)", 25, teLicht.low);
    assert_("M63 te licht → high onaangeroerd", 25, teLicht.high);
    // (c) een dag VANAF vandaag telt niet mee (wordt nog (her)gepland).
    const toekomst = zoneDebt_(
      {
        "2026-03-13": { low: 99, high: 0, anaerobic: 0 },
        "2026-03-14": { low: 99, high: 0, anaerobic: 0 },
      },
      [
        { datum: "2026-03-13", train: true, gedaan: false },
        { datum: "2026-03-14", train: true, gedaan: false },
      ],
      [],
      wk,
      vandaag,
    );
    assert_("M63 vandaag/toekomst → geen debt", 0, toekomst.low);
  });

  it("testRecentHardDate", () => {
    const intent: any = { "2026-03-14": { low: 0, high: 20, anaerobic: 0 } };
    const rows = [
      _wpRow_(new Date(2026, 2, 10), { type: "Ride", iff: 0.7 }), // zacht
      _wpRow_(new Date(2026, 2, 12), { type: "Ride", iff: 0.9 }), // hard via IF
      _wpRow_(new Date(2026, 2, 14), { type: "Ride", iff: 0.5 }), // hard via intent (high)
      _wpRow_(new Date(2026, 2, 16), { type: "Run", iff: 0.99 }), // hard via IF, GEEN fiets-filter
    ];
    const hard = recentHardDate_(rows, intent);
    assert_("recentHard is Date", true, hard instanceof Date);
    assert_(
      "recentHard = max harde datum (Run telt, geen fiets-filter)",
      new Date(2026, 2, 16).getTime(),
      hard ? hard.getTime() : null,
    );
    const viaIntent = recentHardDate_(
      [_wpRow_(new Date(2026, 2, 13), { type: "Ride", iff: 0.55 })],
      { "2026-03-13": { low: 0, high: 0, anaerobic: 10 } },
    );
    assert_(
      "recentHard via intent-anaerobic",
      new Date(2026, 2, 13).getTime(),
      viaIntent ? viaIntent.getTime() : null,
    );
    assert_(
      "recentHard alles zacht → null",
      null,
      recentHardDate_([_wpRow_(new Date(2026, 2, 11), { iff: 0.6 })], {}),
    );
    assert_("recentHard lege reeks → null", null, recentHardDate_([], {}));
  });

  // ── RPE-signaal (Fase 5.3d-ii): rpeSignal_ + combineSignals_ ──────────
  it("testRpeSignal", () => {
    // sweet_spot → expected high(7); diff = rpe − 7. Venster = [maandag..todayISO].
    const T3: any = {
      "2026-03-09": "sweet_spot",
      "2026-03-10": "sweet_spot",
      "2026-03-11": "sweet_spot",
    };
    // a) 2 gegradeerd, diff 2 → avg 2 → demote.
    assert_(
      "rpe avg 2 → demote",
      "demote",
      rpeSignal_(
        [
          { datum: "2026-03-10", rpe: 9 },
          { datum: "2026-03-11", rpe: 9 },
        ],
        T3,
        "2026-03-11",
      ).signal,
    );
    // b) <2 gegradeerd → normal.
    assert_(
      "rpe <2 sessies → normal",
      "normal",
      rpeSignal_([{ datum: "2026-03-11", rpe: 9 }], T3, "2026-03-11").signal,
    );
    // c) avg<2 → normal.
    assert_(
      "rpe avg<2 → normal",
      "normal",
      rpeSignal_(
        [
          { datum: "2026-03-10", rpe: 8 },
          { datum: "2026-03-11", rpe: 8 },
        ],
        T3,
        "2026-03-11",
      ).signal,
    );
    // d) hoge avg → nog steeds demote (cap, nooit recovery/warning).
    assert_(
      "rpe hoge avg → demote-cap",
      "demote",
      rpeSignal_(
        [
          { datum: "2026-03-10", rpe: 12 },
          { datum: "2026-03-11", rpe: 12 },
        ],
        T3,
        "2026-03-11",
      ).signal,
    );
    // e) null-rpe overgeslagen → n=2.
    assert_(
      "rpe null-rij overgeslagen",
      true,
      rpeSignal_(
        [
          { datum: "2026-03-09", rpe: 9 },
          { datum: "2026-03-10", rpe: null },
          { datum: "2026-03-11", rpe: 9 },
        ],
        T3,
        "2026-03-11",
      ).reason.includes("laatste 2 sessies"),
    );
    // f) onbekend type gefilterd → n=2.
    assert_(
      "rpe onbekend type gefilterd",
      true,
      rpeSignal_(
        [
          { datum: "2026-03-09", rpe: 9 },
          { datum: "2026-03-10", rpe: 9 },
          { datum: "2026-03-11", rpe: 9 },
        ],
        {
          "2026-03-09": "sweet_spot",
          "2026-03-10": "onbekend_type",
          "2026-03-11": "sweet_spot",
        },
        "2026-03-11",
      ).reason.includes("laatste 2 sessies"),
    );
    // g) recentste ≤3 (niet oudste-3): diffs [4,4,0,0,0] → recent [0,0,0] → normal.
    assert_(
      "rpe recentste-3 (niet oudste-3)",
      "normal",
      rpeSignal_(
        [
          { datum: "2026-03-09", rpe: 11 },
          { datum: "2026-03-10", rpe: 11 },
          { datum: "2026-03-11", rpe: 7 },
          { datum: "2026-03-12", rpe: 7 },
          { datum: "2026-03-13", rpe: 7 },
        ],
        {
          "2026-03-09": "sweet_spot",
          "2026-03-10": "sweet_spot",
          "2026-03-11": "sweet_spot",
          "2026-03-12": "sweet_spot",
          "2026-03-13": "sweet_spot",
        },
        "2026-03-13",
      ).signal,
    );
    // h) vorige-week-sessie buiten venster → alleen 1 in-week → normal.
    assert_(
      "rpe vorige-week buiten venster",
      "normal",
      rpeSignal_(
        [
          { datum: "2026-03-06", rpe: 12 },
          { datum: "2026-03-11", rpe: 9 },
        ],
        { "2026-03-06": "sweet_spot", "2026-03-11": "sweet_spot" },
        "2026-03-11",
      ).signal,
    );
  });

  it("testCombineSignals", () => {
    const wl = (signal: any, reason: string): any => ({
      hrvBaseline: null,
      hrvRecent: null,
      hrvDeficit: null,
      sleepLastNight: null,
      sleepAvg3: null,
      signal,
      reason,
    });
    const rp = (signal: any, reason: string): any => ({ signal, reason });
    // a) rpe demote + wellness normal → demote (rpe wint, reason vervangt).
    const a = combineSignals_(
      wl("normal", "binnen baseline"),
      rp("demote", "RPE hoog"),
    );
    assert_("combine demote wint van normal", "demote", a.signal);
    assert_("combine rpe-reason vervangt", "RPE hoog", a.reason);
    // b) rpe normal → geen override (recovery blijft).
    assert_(
      "combine rpe normal → recovery blijft",
      "recovery",
      combineSignals_(wl("recovery", "x"), rp("normal", "")).signal,
    );
    // c) rpe normal + wellness demote → demote blijft.
    assert_(
      "combine rpe normal → demote blijft",
      "demote",
      combineSignals_(wl("demote", "y"), rp("normal", "")).signal,
    );
    // d) gelijke rang (demote+demote) → wellness behouden + reason concat.
    const d = combineSignals_(
      wl("demote", "HRV laag"),
      rp("demote", "RPE hoog"),
    );
    assert_("combine gelijke rang → wellness signal", "demote", d.signal);
    assert_("combine reason concat", "HRV laag + RPE hoog", d.reason);
    // e) lagere rpe-rang (demote < recovery) → recovery behouden + reason concat.
    const e = combineSignals_(
      wl("recovery", "slaap laag"),
      rp("demote", "RPE hoog"),
    );
    assert_("combine recovery wint van demote-rpe", "recovery", e.signal);
    assert_("combine concat bij lagere rpe", "slaap laag + RPE hoog", e.reason);
    // f) non-mutatie: beide inputs onveranderd na de call.
    const wIn = wl("normal", "orig-w");
    const rIn = rp("demote", "orig-r");
    combineSignals_(wIn, rIn);
    assert_("combine muteert wellness niet (signal)", "normal", wIn.signal);
    assert_("combine muteert wellness niet (reason)", "orig-w", wIn.reason);
    assert_("combine muteert rpe niet", "demote", rIn.signal);
  });

  // Vloer stijgt mee met nieuwe asserts (1b: +4 testRecencyEntriesParam 957→961;
  // fase 2a: +6 voor de M63-fork in testZoneDebt 961→967).
  it("exactly 967 assertions", () => {
    expect(assertCount).toBe(967);
  });
});
