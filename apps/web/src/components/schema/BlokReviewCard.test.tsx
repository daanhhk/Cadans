import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import type { BlokReview, BlokWeek } from "../../lib/blok";
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
