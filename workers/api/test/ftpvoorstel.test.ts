import { describe, expect, it } from "vitest";
import {
  kiesFtpVoorstel,
  m93Drempel,
  type VoorstelKandidaat,
} from "../src/ftpvoorstel";
import { leesPiek1200 } from "../src/integrations/ritpiek";
import ritpieken from "./fixtures/ritpieken-215.json";

const RIT = (o: Partial<VoorstelKandidaat> = {}): VoorstelKandidaat => ({
  activityIdExt: "i1",
  datum: "2026-08-20",
  naam: "Rit",
  duurMin: 90,
  piek1200W: 300,
  ...o,
});

describe("leesPiek1200 — op het EXACTE duurpunt, nergens anders", () => {
  it("leest de waarde op secs = 1200", () => {
    expect(
      leesPiek1200({ secs: [300, 1200, 3600], values: [400, 268, 210] }),
    ).toBe(268);
  });

  // ROADMAP punt 70: een mean-max-kromme MAG plaatselijk stijgen. Dat is een echte eigenschap, geen
  // fout, en het lopende maximum zou een getal opleveren dat de renner niet gereden heeft.
  it("neemt GEEN naburig punt en GEEN lopend maximum", () => {
    const k = { secs: [1140, 1200, 1380], values: [265, 261, 264] };
    expect(leesPiek1200(k)).toBe(261); // niet 264, niet 265
  });

  it("geeft null als het punt 1200 ontbreekt — niet interpoleren", () => {
    expect(
      leesPiek1200({ secs: [300, 1140, 1260], values: [400, 265, 263] }),
    ).toBeNull();
  });

  it("geeft null op een lege, kapotte of nulwaarde-kromme", () => {
    expect(leesPiek1200(null)).toBeNull();
    expect(leesPiek1200({})).toBeNull();
    expect(leesPiek1200({ secs: [1200], values: [0] })).toBeNull();
    expect(leesPiek1200({ secs: [1200], values: [null] })).toBeNull();
  });
});

describe("m93Drempel — 95 procent, afgerond op hele watt", () => {
  it("rekent zoals M93 voorschrijft", () => {
    expect(m93Drempel(310)).toBe(295); // 294,5 -> Math.round rondt half OMHOOG
    expect(m93Drempel(268)).toBe(255); // 254,6
    expect(m93Drempel(200)).toBe(190);
  });
});

describe("kiesFtpVoorstel — de vier poorten", () => {
  it("stelt voor wanneer de waarde BOVEN de staande drempel uitkomt", () => {
    const v = kiesFtpVoorstel({
      doel: "FTP",
      staandeFtp: 280,
      kandidaten: [RIT({ piek1200W: 310 })],
    });
    expect(v).not.toBeNull();
    expect(v?.voorstelFtp).toBe(295);
    expect(v?.staandeFtp).toBe(280);
    expect(v?.piek1200W).toBe(310);
    expect(v?.factorPct).toBe(95);
  });

  // M94: een ongeplande inspanning stelt alleen OMHOOG bij. Dit is het Z2-geval — 195 W geeft 185 W
  // tegen een staande 280, en dat is precies het voorstel dat NIET gedaan mag worden.
  it("stelt NIETS voor wanneer de waarde eronder blijft (M94)", () => {
    expect(
      kiesFtpVoorstel({
        doel: "FTP",
        staandeFtp: 280,
        kandidaten: [RIT({ piek1200W: 195 })],
      }),
    ).toBeNull();
  });

  it("stelt niets voor bij een GELIJKE waarde — gelijk is geen verhoging", () => {
    expect(
      kiesFtpVoorstel({
        doel: "FTP",
        staandeFtp: 190,
        kandidaten: [RIT({ piek1200W: 200 })], // 0,95 x 200 = 190
      }),
    ).toBeNull();
  });

  it("stelt niets voor onder een ander doel (poort 1)", () => {
    for (const doel of ["Conditie", "Korte beklimmingen", "Onderhoud", null]) {
      expect(
        kiesFtpVoorstel({
          doel,
          staandeFtp: 280,
          kandidaten: [RIT({ piek1200W: 310 })],
        }),
      ).toBeNull();
    }
  });

  // DE VAL DIE GEMETEN IS: `settings.ftp` is nullable — het is naast `user_id` de enige kolom zonder
  // NOT NULL — en in JavaScript is `294 > null` WAAR omdat null naar 0 wordt gedwongen, terwijl
  // `294 > undefined` ONWAAR is. Dezelfde afwezigheid, de omgekeerde poort. Zonder deze expliciete
  // toets zou ELKE rit een voorstel opleveren zodra de gebruiker zijn FTP-veld leegmaakt.
  it("stelt niets voor zonder staande waarde — null EN undefined (poort 2)", () => {
    for (const staandeFtp of [
      null,
      undefined as unknown as null,
      0,
      Number.NaN,
    ]) {
      expect(
        kiesFtpVoorstel({
          doel: "FTP",
          staandeFtp,
          kandidaten: [RIT({ piek1200W: 310 })],
        }),
      ).toBeNull();
    }
  });

  it("slaat een rit zonder waarde op het duurpunt over (poort 3)", () => {
    expect(
      kiesFtpVoorstel({
        doel: "FTP",
        staandeFtp: 280,
        kandidaten: [RIT({ piek1200W: null })],
      }),
    ).toBeNull();
  });

  // GEMETEN: op 44 dagen dragen twee fietsritten allebei een waarde, met een mediaan verschil van 43
  // watt en een uitschieter van 156. Het huisidioom `mergeDone` kiest de LANGSTE rit, en dat is
  // stelselmatig de rit met de LAGERE piek — op de enige dag die in de hele reeks een voorstel
  // oplevert zou dat 154 W zijn in plaats van 310.
  it("kiest bij twee ritten op een dag de HOOGSTE piek, niet de langste rit", () => {
    const v = kiesFtpVoorstel({
      doel: "FTP",
      staandeFtp: 280,
      kandidaten: [
        RIT({ activityIdExt: "lang", duurMin: 120, piek1200W: 300 }),
        RIT({ activityIdExt: "hard", duurMin: 60, piek1200W: 310 }),
      ],
    });
    expect(v?.activityIdExt).toBe("hard");
    expect(v?.piek1200W).toBe(310);
  });

  it("bij een gelijke piek wint de NIEUWSTE rit", () => {
    const v = kiesFtpVoorstel({
      doel: "FTP",
      staandeFtp: 280,
      kandidaten: [
        RIT({ activityIdExt: "oud", datum: "2026-08-01", piek1200W: 310 }),
        RIT({ activityIdExt: "nieuw", datum: "2026-08-20", piek1200W: 310 }),
      ],
    });
    expect(v?.activityIdExt).toBe("nieuw");
  });

  it("draagt de HERKOMST mee — die vervangt de plausibiliteitsgrens", () => {
    const v = kiesFtpVoorstel({
      doel: "FTP",
      staandeFtp: 280,
      kandidaten: [
        RIT({
          naam: "De Ronde Venen - FTP build up",
          duurMin: 88,
          piek1200W: 310,
        }),
      ],
    });
    expect(v?.naam).toBe("De Ronde Venen - FTP build up");
    expect(v?.duurMin).toBe(88);
    expect(v?.datum).toBe("2026-08-20");
  });
});

// ── DE REGRESSIETOETS OVER DE ECHTE REEKS ────────────────────────────────────────────────────
// 215 teruggehaalde twintigminutenwaarden uit Daans eigen historie. Deze toets draait de ECHTE
// `kiesFtpVoorstel` over die reeks en niet een nagebouwde formule — dat laatste is in deze reeks
// twee keer eerder misgegaan en toetst de rekensom in plaats van de poort.
//
// EN HIJ HEEFT TWEE HELFTEN, met opzet. Een toets die alleen "nul voorstellen" meet, slaagt ook als
// de poort per ongeluk ALTIJD zwijgt — een typefout in een kolomnaam zou hem groen laten. De
// POSITIEVE CONTROLE eronder sluit dat uit: dezelfde functie, dezelfde reeks, en dan moet er precies
// ÉÉN voorstel komen op een bij naam genoemde rit. Zie CC-CHECKS CHECK 40.
describe("regressie over de 215 echte waarden (ROADMAP punt 69)", () => {
  const kandidaten = ritpieken as VoorstelKandidaat[];

  it("de reeks is compleet: 215 waarden", () => {
    expect(kandidaten).toHaveLength(215);
  });

  // MET de seed is elke rit uit de backfill beantwoord, dus komt er geen enkele kandidaat binnen.
  it("MET de seed: nul kandidaten, dus nul voorstellen", () => {
    expect(
      kiesFtpVoorstel({ doel: "FTP", staandeFtp: 280, kandidaten: [] }),
    ).toBeNull();
  });

  // ZONDER de seed zou de hele historie meedoen. Dan vuurt hij PRECIES ÉÉN keer, en dat is de
  // positieve controle: de poort kan wel degelijk vuren, en hij kiest de juiste rit.
  it("ZONDER de seed: precies ÉÉN voorstel, op De Ronde Venen - FTP build up", () => {
    const v = kiesFtpVoorstel({ doel: "FTP", staandeFtp: 280, kandidaten });
    expect(v).not.toBeNull();
    expect(v?.naam).toBe("De Ronde Venen - FTP build up");
    expect(v?.piek1200W).toBe(310);
    expect(v?.voorstelFtp).toBe(295);

    // en het is er ECHT maar één: geen tweede rit haalt de drempel
    const alle = kandidaten.filter(
      (k) => k.piek1200W != null && m93Drempel(k.piek1200W) > 280,
    );
    expect(alle).toHaveLength(1);
  });

  // De op een na hoogste kandidaat ligt 28 W ONDER de staande waarde en er is geen rit binnen 5 watt
  // aan weerskanten: de poort staat nergens op een mesrand.
  it("de marge is schoon — geen rit binnen 5 watt van de drempel", () => {
    const marges = kandidaten
      .filter((k) => k.piek1200W != null)
      .map((k) => m93Drempel(k.piek1200W as number) - 280)
      .filter((m) => m !== 15); // de vurende rit zelf
    expect(marges.filter((m) => Math.abs(m) <= 5)).toHaveLength(0);
  });
});
