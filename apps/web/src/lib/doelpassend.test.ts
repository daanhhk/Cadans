import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DOEL_UREN_VLOER,
  type DoelPassendInput,
  doelPassendSettingsPatch,
  doelPassendVoorstel,
  kaartPrecedentie,
} from "./doelpassend";

// ROADMAP punt 12 — DOEL-PASSENDHEID. Spec: docs/PUNT12-BOUWDOC.md §4 en §6.
//
// De klok is een FIXTURE-VARIABELE en wordt binnen de test gepind: `blokWeekVanWeek` rekent op
// kalenderdagen, en een test die op de ambient klok leunt meet een andere week dan hij beschrijft.

const MAANDAG = new Date(2026, 2, 9, 8, 0, 0); // 2026-03-09, ma
const WEEK = "2026-03-09";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MAANDAG);
});
afterAll(() => {
  vi.useRealTimers();
});

/** Basis: Korte beklimmingen (vloer 5) met 4 uur, blokweek 1, nog niet beantwoord → kaart. */
function inp(o: Partial<DoelPassendInput> = {}): DoelPassendInput {
  return {
    doel: "Korte beklimmingen",
    weekUren: 4,
    doelStart: WEEK, // blokweek 1
    weekMondayISO: WEEK,
    beantwoordBlok: null,
    beantwoordDoel: null,
    ...o,
  };
}

describe("doelPassendVoorstel — de vijf poorten, elk apart", () => {
  it("de basis vuurt, en draagt de velden die de kaart nodig heeft", () => {
    const v = doelPassendVoorstel(inp());
    expect(v).not.toBeNull();
    expect(v?.huidigDoel).toBe("Korte beklimmingen");
    expect(v?.vloerUren).toBe(5);
    expect(v?.weekUren).toBe(4);
    expect(v?.voorstelDoel).toBe("FTP");
    expect(v?.blokStart).toBe(WEEK);
  });

  it("poort 1 — geen bruikbare uren geeft null (M5: geen uren, geen oordeel)", () => {
    expect(doelPassendVoorstel(inp({ weekUren: null }))).toBeNull();
    expect(doelPassendVoorstel(inp({ weekUren: 0 }))).toBeNull();
    expect(doelPassendVoorstel(inp({ weekUren: Number.NaN }))).toBeNull();
  });

  it("poort 2 — een doel zonder vloer geeft null", () => {
    expect(doelPassendVoorstel(inp({ doel: "FTP", weekUren: 1 }))).toBeNull();
    expect(
      doelPassendVoorstel(inp({ doel: "Onderhoud", weekUren: 1 })),
    ).toBeNull();
  });

  it("poort 3 — STRIKT kleiner: op de vloer past het doel", () => {
    // Korte beklimmingen: 4 vuurt, 5 niet.
    expect(doelPassendVoorstel(inp({ weekUren: 4 }))).not.toBeNull();
    expect(doelPassendVoorstel(inp({ weekUren: 5 }))).toBeNull();
    // Lange beklimmingen: 5 vuurt, 6 niet.
    const lang = { doel: "Lange beklimmingen" };
    expect(doelPassendVoorstel(inp({ ...lang, weekUren: 5 }))).not.toBeNull();
    expect(doelPassendVoorstel(inp({ ...lang, weekUren: 6 }))).toBeNull();
    // Conditie: 3 vuurt, 4 niet.
    const cond = { doel: "Conditie" };
    expect(doelPassendVoorstel(inp({ ...cond, weekUren: 3 }))).not.toBeNull();
    expect(doelPassendVoorstel(inp({ ...cond, weekUren: 4 }))).toBeNull();
  });

  it("poort 4 — buiten blokweek 1 geen kaart", () => {
    // doelStart een week eerder → deze week is blokweek 2.
    expect(doelPassendVoorstel(inp({ doelStart: "2026-03-02" }))).toBeNull();
  });

  it("poort 5 — al beantwoord voor DIT blok en DIT doel geeft null", () => {
    expect(
      doelPassendVoorstel(
        inp({ beantwoordBlok: WEEK, beantwoordDoel: "Korte beklimmingen" }),
      ),
    ).toBeNull();
  });

  it("poort 5 — een ANDER niet-passend doel binnen hetzelfde blok is een NIEUW besluit", () => {
    // "nee" gezegd op Korte beklimmingen, daarna gewisseld naar Lange beklimmingen: de vraag
    // hoort terug te komen, want dat is een andere keuze.
    const v = doelPassendVoorstel(
      inp({
        doel: "Lange beklimmingen",
        weekUren: 4,
        beantwoordBlok: WEEK,
        beantwoordDoel: "Korte beklimmingen",
      }),
    );
    expect(v).not.toBeNull();
    expect(v?.huidigDoel).toBe("Lange beklimmingen");
    expect(v?.vloerUren).toBe(6);
  });

  it("een LEGACY-string valt via normalizeDoel_ op dezelfde vloer", () => {
    const v = doelPassendVoorstel(inp({ doel: "Beklimmingen" }));
    expect(v?.huidigDoel).toBe("Korte beklimmingen");
    expect(v?.vloerUren).toBe(DOEL_UREN_VLOER["Korte beklimmingen"]);
  });
});

describe("doelPassendSettingsPatch — de FULL-REPLACE-valkuil", () => {
  const SETTINGS = {
    ftp: 280,
    lthr: 170,
    gewicht: 75,
    doel: "Korte beklimmingen",
    doelStart: "2026-01-05",
    hrMax: 190,
    hrRest: 45,
    doelDuur: null,
    fase: null,
    profielPreset: "gemiddeld",
    pendelDuurMin: 40,
    pendelAantal: 2,
    weekUren: 4,
  };

  it("draagt ELKE sleutel mee en verandert er precies TWEE", () => {
    const v = doelPassendVoorstel(inp())!;
    const uit = doelPassendSettingsPatch(SETTINGS, v);

    // Elke sleutel van het origineel zit erin — een partiele body zou ftp, gewicht en weekUren
    // legen, want PUT /api/settings is FULL-REPLACE.
    for (const k of Object.keys(SETTINGS)) {
      expect(Object.hasOwn(uit, k)).toBe(true);
    }
    const verschillen = Object.keys(SETTINGS).filter(
      (k) =>
        (uit as Record<string, unknown>)[k] !==
        (SETTINGS as Record<string, unknown>)[k],
    );
    expect(verschillen.sort()).toEqual(["doel", "doelStart"]);
    expect(uit.doel).toBe("FTP");
    expect(uit.doelStart).toBe(WEEK);
  });
});

describe("kaartPrecedentie — één vraag tegelijk", () => {
  it("de event-overname onderdrukt de doel-passendheid", () => {
    const r = kaartPrecedentie({ e: 1 }, { d: 1 }, { t: 1 });
    expect(r.eventOvername).toEqual({ e: 1 });
    expect(r.doelPassend).toBeNull();
    // De dosis-trede wordt hier NIET genulld: die hangt aan de doel-passendheid, en die is nu
    // weg. Dat de event-overname de dosis-trede onderdrukt doet de BESTAANDE guard in
    // SchemaView.tsx, en die blijft ongewijzigd — twee plekken, twee gronden.
    expect(r.dosisTrede).toEqual({ t: 1 });
  });

  it("de doel-passendheid onderdrukt de dosis-trede", () => {
    const r = kaartPrecedentie(null, { d: 1 }, { t: 1 });
    expect(r.doelPassend).toEqual({ d: 1 });
    expect(r.dosisTrede).toBeNull();
  });

  it("TEGENPROEF: valt er niets te onderdrukken, dan blijft alles staan", () => {
    const r = kaartPrecedentie(null, null, { t: 1 });
    expect(r.dosisTrede).toEqual({ t: 1 });
    const r2 = kaartPrecedentie({ e: 1 }, null, null);
    expect(r2.eventOvername).toEqual({ e: 1 });
  });
});
