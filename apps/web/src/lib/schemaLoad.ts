// ROADMAP punt 30 — DE WEEKLAADBEURT VALT NIET MEER OM OP ÉÉN RIJ.
// Spec: docs/PUNT30-BOUWDOC.md.
//
// Twee termen, en allebei zijn ze ALLES-OF-NIETS. Er wordt NIETS gedegradeerd: twaalf van de
// vijftien rijen voeden `buildWeekProposal`, en de getoonde week wordt daarna via
// `persistWeekplan` weggeschreven als plan-van-record. Een stil vervangen rij zou dus geen
// ontbrekende kaart opleveren maar een ANDER plan-van-record — zelfde vorm als punt 26.
//
// Pure module, geen React en geen fetch: zo is het gedrag toetsbaar zonder render-infrastructuur,
// en die heeft `apps/web` niet.

/**
 * DE HERHAAL-GETALLEN ZIJN BELEID, GEEN IJKING.
 *
 * Er valt hier geen signaal te bemonsteren: een herhaalinterval drukt een afweging uit tussen
 * "nog even wachten" en "zeg dat het stuk is", en die afweging is een KEUZE. Er hoort dus geen
 * plateau-toets bij en een volgende chat moet er ook geen data voor gaan zoeken — zelfde
 * categorie als de testfrequentie.
 *
 * Wat er wél onder ligt: drie pogingen met deze pauzes kosten bij een echt dode backend hoogstens
 * ongeveer 2,4 seconden extra voordat de melding verschijnt, en dat is korter dan de tijd die een
 * gebruiker zelf zou nemen om op Opnieuw te tikken.
 *
 * DIT DEKT HET PROPAGATIEVENSTER NA EEN DEPLOY BEWUST NIET. Dat duurde gemeten circa twintig
 * seconden, en daar doorheen wachten zou van een ECHT dode route een blanco scherm van twintig
 * seconden maken. De herhaling mikt op de korte hapering — één time-out op een slechte
 * verbinding, en dat is op een telefoon met vijftien parallelle verzoeken het alledaagse geval.
 */
export const LAAD_POGINGEN = 3;
export const LAAD_PAUZES_MS = [600, 1800];

const wacht = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/**
 * Draait `run`; gooit die, dan wacht hij en probeert opnieuw, tot `attempts` op is.
 *
 * SLAAGT EEN POGING, DAN STOPT HIJ — hij probeert niet door. Dat lijkt vanzelfsprekend maar is
 * juist de term die stil dubbel laden veroorzaakt als hij wegvalt, en daar is een eigen test voor.
 *
 * FALEN ALLE POGINGEN, DAN GOOIT HIJ DE LAATSTE FOUT DOOR — niet een eigen generieke. De
 * oorspronkelijke boodschap draagt de reden, en die is het enige waar de gebruiker iets aan heeft.
 */
export async function retryLoad<T>(
  run: () => Promise<T>,
  opts?: {
    attempts?: number;
    delaysMs?: number[];
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<T> {
  const attempts = Math.max(1, opts?.attempts ?? LAAD_POGINGEN);
  const delays = opts?.delaysMs ?? LAAD_PAUZES_MS;
  const sleep = opts?.sleep ?? wacht;

  let laatste: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await run();
    } catch (e) {
      laatste = e;
      if (i < attempts - 1)
        await sleep(delays[i] ?? delays[delays.length - 1] ?? 0);
    }
  }
  throw laatste;
}

/** Eén rij van de laadbeurt: een naam die in de melding kan staan, plus zijn belofte. */
export interface GelabeldeRij<T> {
  label: string;
  laad: () => Promise<T>;
}

/**
 * Haalt alle rijen op en geeft ze in dezelfde volgorde terug.
 *
 * VALT ER ÉÉN, DAN FAALT DE HELE BOUW. Er wordt niets gedegradeerd en er wordt niets
 * weggeschreven — zie de kop van dit bestand. Wat er WEL verandert tegenover een kale
 * `Promise.all`: de melding is niet langer "de eerste de beste afwijzing" maar noemt WELKE rij
 * viel en waarom. Vandaar `allSettled`: die wacht alle rijen af, zodat een tweede uitvaller niet
 * onzichtbaar blijft achter de eerste.
 */
export async function laadGelabeld(
  rijen: GelabeldeRij<unknown>[],
): Promise<unknown[]> {
  const uit = await Promise.allSettled(rijen.map((r) => r.laad()));
  const gevallen: string[] = [];
  for (let i = 0; i < uit.length; i++) {
    const r = uit[i];
    if (r.status === "rejected") {
      const reden =
        r.reason instanceof Error ? r.reason.message : String(r.reason);
      gevallen.push(`${rijen[i].label}: ${reden}`);
    }
  }
  if (gevallen.length) {
    throw new Error(
      `weekgegevens niet compleet — ${gevallen.length === 1 ? "deze bron gaf een fout" : "deze bronnen gaven een fout"}: ${gevallen.join(" | ")}`,
    );
  }
  return uit.map((r) => (r as PromiseFulfilledResult<unknown>).value);
}
