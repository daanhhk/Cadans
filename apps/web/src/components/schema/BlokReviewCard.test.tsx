import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import type { BlokReview, BlokWeek } from "../../lib/blok";
import type { EffectReferent } from "../../lib/effect";
import { BlokReviewCard } from "./BlokReviewCard";

/**
 * ROADMAP punt 33 — DE EERSTE RENDER-TEST VAN apps/web.
 *
 * Waarom deze kaart: `BlokReviewCard` kleurt op TWEE plekken los van elkaar — de zone-regel per
 * week (`:179`) en het blok-totaal (`:276`) — en beide dragen dezelfde punt-17-regel: ronden vóór
 * vergelijken, zodat de kleur nooit iets anders beweert dan het cijfer ernaast. Twee kopieën van
 * één regel is precies wat punt 33 wil consolideren, en zonder vangnet is die consolidatie blind.
 *
 * DE FIXTURE IS MET DE HAND GEBOUWD, en dat is een besluit: dit toetst de RENDER en niet de
 * pijplijn. De producent-kant staat al onder `apps/web/src/lib/punt17.test.ts`. Wel tegen de ECHTE
 * types — geen cast naar `any`, geen eigen interface — want een fixture die zijn eigen type
 * verzint, verzint ook de garantie die hij zou moeten geven.
 *
 * HET SCHARNIER IS 7,6 TEGEN EEN NORM VAN 8. Afgerond is dat 8 en dus GEHAALD; onafgerond is het
 * een tekort. Zonder de ronding kleurt een zone die "8/8" TOONT als tekort. De tegenfixture staat
 * op 6,4 — afgerond 6, dus een echt tekort — zodat elke assertie een tegenkant heeft: een toets
 * die alleen de neutrale kant meet, slaagt ook als de kleur nóóit gezet wordt.
 */

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function render(node: React.ReactElement): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(node);
  });
  return host;
}

/** Eén MEEGETELDE week, met de anaeroob-as expliciet gezet. */
function week(geleverdAnaeroob: number): BlokWeek {
  return {
    weekMonday: "2026-07-06",
    blokWeek: 1,
    gevraagd: 8,
    geleverd: geleverdAnaeroob,
    gevraagdTempo: 0,
    gevraagdDrempel: 0,
    gevraagdAnaeroob: 8,
    geleverdTempo: 0,
    geleverdDrempel: 0,
    geleverdAnaeroob,
    planTempo: 0,
    planDrempel: 0,
    planAnaeroob: 8,
    planWerk: 8,
    geleverdRust: 0,
    geleverdZ2: 0,
    zonesOpNorm: 0,
    zonesVoorgeschreven: ["anaeroob"],
    totaalOpNorm: null,
    zoneRegels: [{ zone: "anaeroob", geleverd: geleverdAnaeroob, norm: 8 }],
    poortHerkomst: "week",
    ritMinuten: 60,
    zoneDekking: 1,
    status: "compleet",
    telt: true,
    geleverdOk: false,
  };
}

function review(geleverdAnaeroob: number): BlokReview {
  return {
    startMonday: "2026-07-06",
    eindMonday: "2026-07-27",
    fase: "afgerond",
    doel: "FTP",
    norm: 8,
    normTempo: 0,
    normDrempel: 0,
    normAnaeroob: 8,
    weekUren: 6,
    weeks: [week(geleverdAnaeroob)],
    uitvoering: {
      geleverd: false,
      geleverdeWeken: 0,
      beoordeeldeWeken: 1,
      tekortZones: ["anaeroob"],
      verschuiving: false,
    },
    check: null,
    ctlDelta: null,
    effect: null,
    laatsteMeting: null,
  };
}

/**
 * De span van de zone-regel; zijn textContent is "VO2max 8/8".
 *
 * DE BLADSPAN, en dat is geen detail. De kaart nest een gekleurde span in een ongekleurde
 * wrapper (die de " · " tussen twee zones draagt), en beide hebben DEZELFDE textContent zodra
 * er één zone staat. `querySelectorAll` geeft documentvolgorde, dus de wrapper komt eerst — een
 * helper die de eerste treffer pakt leest altijd een lege kleur en slaagt dan op de neutrale kant
 * om de verkeerde reden. Precies dat gebeurde bij het eerste rood: A1 groen, A2 rood.
 */
function zoneSpan(host: HTMLElement, tekst: string): HTMLElement {
  // `Array.from` en geen spread: `apps/web/tsconfig.app.json` draagt lib ["ES2023", "DOM"] zonder
  // DOM.Iterable, dus een NodeList is daar niet als iterable getypeerd. Dat lokaal oplossen is
  // goedkoper dan de lib van de hele app verbreden voor één test.
  const treffers = Array.from(host.querySelectorAll("span")).filter(
    (s) => s.textContent === tekst && s.querySelector("span") === null,
  );
  if (treffers.length !== 1) {
    throw new Error(
      `verwacht 1 bladspan met textContent "${tekst}", gevonden ${treffers.length}`,
    );
  }
  return treffers[0] as HTMLElement;
}

/** De getal-div van een blok-totaalrij: de BUUR van de div die de naam draagt. */
function totaalWaarde(host: HTMLElement, naam: string): HTMLElement {
  const naamDiv = Array.from(host.querySelectorAll("div")).find(
    (d) => d.textContent === naam,
  );
  if (!naamDiv) throw new Error(`geen div met textContent "${naam}"`);
  const buur = naamDiv.nextElementSibling;
  if (!buur) throw new Error(`de div "${naam}" heeft geen nextElementSibling`);
  return buur as HTMLElement;
}

describe("BlokReviewCard — punt 17, de kleur volgt het GETOONDE getal", () => {
  it("A1 zone-regel: 7,6 tegen norm 8 toont 8/8 en kleurt NIET", () => {
    const host = render(
      <BlokReviewCard review={review(7.6)} coachNaam={null} />,
    );
    expect(zoneSpan(host, "VO2max 8/8").style.color).toBe("");
  });

  it("A2 zone-regel: 6,4 tegen norm 8 toont 6/8 en kleurt WEL", () => {
    const host = render(
      <BlokReviewCard review={review(6.4)} coachNaam={null} />,
    );
    expect(zoneSpan(host, "VO2max 6/8").style.color).toBe("var(--warn)");
  });

  it("A3 blok-totaal: 7,6 tegen norm 8 kleurt NIET", () => {
    const host = render(
      <BlokReviewCard review={review(7.6)} coachNaam={null} />,
    );
    expect(totaalWaarde(host, "VO2max").style.color).toBe(
      "var(--text-secondary)",
    );
  });

  it("A4 blok-totaal: 6,4 tegen norm 8 kleurt WEL", () => {
    const host = render(
      <BlokReviewCard review={review(6.4)} coachNaam={null} />,
    );
    expect(totaalWaarde(host, "VO2max").style.color).toBe("var(--warn)");
  });
});

// ── ROADMAP punt 34 — DE GETALSRIJ IN DRIE GEVALLEN ──────────────────────────
// De rij toonde `instap → maximum` zodra er een referent was. Dat zijn er nu drie: geen rij bij
// een ontbrekende maat, de volle rij bij een gemeten gelegenheid, en alleen de huidige waarde als
// er niets gemeten is. Een pijl van instap naar maximum SUGGEREERT een gemeten verschil, en dat is
// er in het derde geval niet.
describe("ROADMAP punt 34 — de rolling-FTP-rij", () => {
  function metEffect(o: {
    doelTak: EffectReferent["doelTak"];
    bron: "race" | null;
    uitkomst?: EffectReferent["uitkomst"];
  }): BlokReview {
    const r = review(8);
    return {
      ...r,
      effect: {
        instap: 262,
        maximum: 272,
        verschil: 10,
        gevuldeWeken: 4,
        gelegenheid:
          o.bron === null
            ? { bron: null, datum: null }
            : { bron: "race", datum: "2026-07-11" },
        uitkomst: o.uitkomst ?? "gestegen",
        dosisTerm: null,
        doelTak: o.doelTak,
      },
    };
  }

  /** De labeldiv van de rolling-FTP-rij, of null als de rij er niet is. */
  function labelDiv(host: HTMLElement): HTMLElement | null {
    const treffers = Array.from(host.querySelectorAll("div")).filter((d) =>
      (d.textContent ?? "").startsWith("rolling FTP"),
    );
    return (treffers[treffers.length - 1] as HTMLElement) ?? null;
  }

  it("meter_ontbreekt: GEEN rij, geen badge, geen watt-getal", () => {
    const host = render(
      <BlokReviewCard
        review={metEffect({
          doelTak: "meter_ontbreekt",
          bron: null,
          uitkomst: "niet_meetbaar",
        })}
        coachNaam="Coach"
      />,
    );
    expect(labelDiv(host)).toBeNull();
    expect(host.textContent ?? "").not.toContain("272");
    expect(host.textContent ?? "").not.toContain("262");
  });

  it("een meter MET gelegenheid: de rij zoals hij was — instap, pijl, maximum, badge", () => {
    const host = render(
      <BlokReviewCard
        review={metEffect({ doelTak: "stijging", bron: "race" })}
        coachNaam="Coach"
      />,
    );
    const label = labelDiv(host);
    expect(label).not.toBeNull();
    expect(label?.textContent).toContain("wedstrijd");
    const waarde = label?.nextElementSibling as HTMLElement;
    expect(waarde.textContent).toContain("262");
    expect(waarde.textContent).toContain("→");
    expect(waarde.textContent).toContain("272");
    // STAP 6b — groen mag hier: gestegen ÉN gemeten.
    expect(waarde.style.color).toBe("var(--good)");
  });

  it("een meter ZONDER gelegenheid: geen pijl, geen instap, label 'schatting'", () => {
    const host = render(
      <BlokReviewCard
        review={metEffect({ doelTak: "stijging", bron: null })}
        coachNaam="Coach"
      />,
    );
    const label = labelDiv(host);
    expect(label?.textContent).toContain("rolling FTP · schatting");
    const waarde = label?.nextElementSibling as HTMLElement;
    expect(waarde.textContent).toContain("272");
    expect(waarde.textContent).not.toContain("→");
    expect(waarde.textContent).not.toContain("262");
    // STAP 6b — GEEN groen: een groen getal is zelf een winst-claim en spreekt "schatting" tegen.
    expect(waarde.style.color).toBe("var(--text-muted)");
  });

  it("behoud met gelegenheid maar NIET gestegen: gedempt, ook al is er gemeten", () => {
    const host = render(
      <BlokReviewCard
        review={metEffect({
          doelTak: "behoud",
          bron: "race",
          uitkomst: "niet_gestegen",
        })}
        coachNaam="Coach"
      />,
    );
    const waarde = labelDiv(host)?.nextElementSibling as HTMLElement;
    expect(waarde.style.color).toBe("var(--text-muted)");
  });
});
